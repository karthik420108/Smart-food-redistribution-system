import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useNgoStore } from '../../store/ngoStore';
import { useVolunteerStore } from '../../store/volunteerStore';

export function NgoLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Setup Mode state
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [phone, setPhone] = useState('');
  const [setupPin, setSetupPin] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const isVolunteerPath = location.pathname.startsWith('/volunteer');
  const { setNgo } = useNgoStore();
  const { setVolunteer } = useVolunteerStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/ngo/auth/login', { email, password });
      const { data } = res.data;

      // Set supabase session
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });

      if (data.role === 'ngo_admin' && data.ngo) {
        setNgo(data.ngo);
        navigate('/ngo');
      } else if (data.role === 'ngo_volunteer' && data.volunteer) {
        setVolunteer(data.volunteer);
        navigate('/volunteer');
      } else {
        toast.error('No NGO or volunteer profile found for this account.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.length !== 6) {
      toast.error('PIN must be 6 digits');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await api.post('/volunteer/auth/setup-pin', {
        phone,
        setup_pin: setupPin,
        new_password: password
      });
      toast.success('Account set up successfully! You can now log in.');
      setIsSetupMode(false);
      setPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Setup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-3xl border border-white/5 p-8 shadow-2xl"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 mb-7">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isVolunteerPath ? 'from-purple-400 to-purple-600' : 'from-teal-400 to-teal-600'} flex items-center justify-center`}>
              <span className="text-white font-bold">FB</span>
            </div>
            <div>
              <div className="font-bold text-white text-sm">FoodBridge</div>
              <div className="text-xs text-gray-400">{isVolunteerPath ? 'Volunteer Portal' : 'NGO / Admin Portal'}</div>
            </div>
          </div>

          <Link to="/" className="text-xs text-gray-600 hover:text-gray-400 mb-5 flex items-center gap-1">← Back to portal selection</Link>
          
          <h1 className="text-2xl font-bold text-white mb-1">
            {isSetupMode ? 'Set up Account' : isVolunteerPath ? 'Volunteer Login' : 'NGO Login'}
          </h1>
          <p className="text-sm text-gray-400 mb-6">
            {isSetupMode 
              ? 'Enter your details to activate your account'
              : isVolunteerPath 
                ? 'Sign in to access your assigned tasks' 
                : 'Sign in to manage your organization'}
          </p>


          {!isSetupMode ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={isVolunteerPath ? "volunteer@example.com" : "contact@ngo.org"}
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-teal-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-teal-500 transition pr-10"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full ${isVolunteerPath ? 'bg-purple-600 hover:bg-purple-500' : 'bg-teal-600 hover:bg-teal-500'} text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              
              {isVolunteerPath && (
                <button
                  type="button"
                  onClick={() => setIsSetupMode(true)}
                  className="w-full text-xs text-purple-400 hover:text-purple-300 transition-colors pt-2"
                >
                  Have a setup PIN? Set up your account
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Setup PIN (6 digits)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={setupPin}
                  onChange={e => setSetupPin(e.target.value.replace(/\D/g, ''))}
                  required
                  placeholder="123456"
                  className="w-full px-3.5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-purple-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Create New Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-gray-800 border border-white/10 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-purple-500 transition pr-10"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60 transition"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Setting up...' : 'Complete Setup'}
              </button>

              <button
                type="button"
                onClick={() => setIsSetupMode(false)}
                className="w-full text-xs text-gray-500 hover:text-gray-400 transition-colors pt-2"
              >
                Back to Login
              </button>
            </form>
          )}

          {!isSetupMode && !isVolunteerPath && (
            <div className="mt-6 text-center text-xs text-gray-500 space-y-2">
              <div>Not registered yet? <Link to="/ngo/register" className="text-teal-400 hover:underline">Register your NGO</Link></div>
              <div>Or go to <Link to="/login" className="text-gray-400 hover:underline">Donor login</Link></div>
            </div>
          )}
          
          {!isSetupMode && isVolunteerPath && (
            <div className="mt-6 text-center text-xs text-gray-500">
              Go to <Link to="/ngo/login" className="text-purple-400 hover:underline">NGO Admin login</Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
