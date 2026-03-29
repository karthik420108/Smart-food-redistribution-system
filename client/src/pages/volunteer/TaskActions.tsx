import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, X, Loader2, ChevronLeft, Star, Package, Droplets
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useVolunteerStore } from '../../store/volunteerStore';

// OTP Verify Page
export function VerifyOtpPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { verifyOtp } = useVolunteerStore();
  const [code, setCode] = useState(['', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    if (value && index < 3) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = code.join('');
    if (otp.length < 4) { toast.error('Enter the complete 4-digit OTP'); return; }
    setVerifying(true);
    try {
      console.log('Attempting OTP verification:', { taskId: id, otp });
      const result = await verifyOtp(id!, otp);
      if (result.success) {
        toast.success('OTP Verified! Food confirmed at donor.');
        navigate(-1);
      } else {
        toast.error(result.error || 'Incorrect OTP. Try again.');
        setCode(['', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch (err: any) {
      toast.error('Verification failed. Check your connection.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6">
          <ChevronLeft size={16} /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-900 rounded-2xl border border-white/5 p-6 space-y-6">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h1 className="text-xl font-bold text-white">Enter Pickup OTP</h1>
            <p className="text-sm text-gray-400 mt-1">Ask the donor for their 4-digit OTP to confirm pickup</p>
          </div>

          {/* OTP Input */}
          <div className="flex gap-2 justify-center">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-xl font-bold bg-gray-800 border border-white/10 rounded-xl text-white outline-none focus:border-teal-500 transition"
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            disabled={verifying || code.some(c => !c)}
            className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {verifying ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {verifying ? 'Verifying...' : 'Verify OTP'}
          </button>

          <p className="text-xs text-center text-gray-500">
            The OTP was sent to the donor when their food was claimed. It's displayed on the donor's dashboard.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// Task Complete Page
const FOOD_CONDITIONS = [
  { value: 'excellent', label: 'Excellent', emoji: '😍', sub: 'Fresh, perfect condition' },
  { value: 'good', label: 'Good', emoji: '😊', sub: 'Clean, ready to serve' },
  { value: 'fair', label: 'Fair', emoji: '😐', sub: 'Edible but imperfect' },
  { value: 'poor', label: 'Poor', emoji: '😕', sub: 'Required extra handling' },
];

export function CompleteTaskPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { completeTask } = useVolunteerStore();
  const [kgCollected, setKgCollected] = useState('');
  const [condition, setCondition] = useState('good');
  const [note, setNote] = useState('');
  const [completing, setCompleting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleComplete = async () => {
    if (!kgCollected) { toast.error('Enter the quantity collected'); return; }
    setCompleting(true);
    try {
      const res = await completeTask(id!, {
        actual_kg_collected: parseFloat(kgCollected),
        food_condition: condition,
        volunteer_note: note,
      });
      if (res.success) {
        setResult(res);
        toast.success('Task completed! Great work!');
      } else {
        toast.error(res.error || 'Completion failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete task');
    } finally {
      setCompleting(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm text-center space-y-5">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-green-500/20 border-2 border-green-500/30 flex items-center justify-center mx-auto">
              <CheckCircle size={44} className="text-green-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Mission Complete! 🎉</h1>
            <p className="text-gray-400 mt-1 text-sm">Thank you for making a difference</p>
          </div>
          <div className="bg-gray-900 rounded-2xl border border-white/5 p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Food Collected</span>
              <span className="text-white font-semibold">{kgCollected} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Meals Served</span>
              <span className="text-green-400 font-semibold">~{result.meals_estimated || Math.floor(parseFloat(kgCollected) * 2.5)} meals</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">CO₂ Saved</span>
              <span className="text-emerald-400 font-semibold">{(parseFloat(kgCollected) * 2.5).toFixed(1)} kg</span>
            </div>
          </div>
          <button onClick={() => navigate('/volunteer')} className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-xl font-semibold text-sm">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 max-w-lg mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm mb-6">
        <ChevronLeft size={16} /> Back
      </button>

      <h1 className="text-xl font-bold text-white mb-5">Complete Delivery</h1>

      <div className="space-y-5">
        {/* Quantity */}
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            <Package size={16} className="text-teal-400" /> Actual Quantity Collected
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              value={kgCollected}
              onChange={e => setKgCollected(e.target.value)}
              placeholder="0.0"
              className="w-full px-4 py-3 bg-gray-800 border border-white/10 rounded-xl text-white text-xl font-bold text-center placeholder-gray-600 outline-none focus:border-teal-500"
            />
            <span className="absolute right-4 top-3 text-gray-500 text-lg">kg</span>
          </div>
          {kgCollected && (
            <div className="text-center text-xs text-teal-400">
              ≈ {Math.round(parseFloat(kgCollected) * 2.5)} meals · {(parseFloat(kgCollected) * 2.5).toFixed(1)} kg CO₂ saved
            </div>
          )}
        </div>

        {/* Food Condition */}
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-4 space-y-3">
          <div className="text-sm font-medium text-white">Food Condition</div>
          <div className="grid grid-cols-2 gap-2">
            {FOOD_CONDITIONS.map(c => (
              <button key={c.value} onClick={() => setCondition(c.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  condition === c.value ? 'border-teal-500 bg-teal-500/10' : 'border-white/5 bg-gray-800/50 hover:border-white/10'
                }`}>
                <span className="text-2xl">{c.emoji}</span>
                <div>
                  <div className={`text-xs font-semibold ${condition === c.value ? 'text-teal-400' : 'text-white'}`}>{c.label}</div>
                  <div className="text-xs text-gray-500">{c.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-4 space-y-2">
          <div className="text-sm font-medium text-white">Notes (optional)</div>
          <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Any issues, special conditions, feedback..."
            className="w-full px-3 py-2 bg-gray-800/60 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-teal-500 resize-none" />
        </div>

        <button
          onClick={handleComplete}
          disabled={!kgCollected || completing}
          className="w-full bg-green-600 hover:bg-green-500 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
        >
          {completing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          {completing ? 'Completing...' : 'Submit & Complete Task'}
        </button>
      </div>
    </div>
  );
}
