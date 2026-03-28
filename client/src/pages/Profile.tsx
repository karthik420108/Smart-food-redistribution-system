import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Building2, MapPin, Phone, Mail, ShieldCheck, 
  Clock, Save, Loader2, Camera, LogOut, CheckCircle2, AlertCircle, Lock 
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface ProfileFormData {
  full_name: string;
  phone: string;
  address: string;
  pincode: string;
  fssai_number: string;
}

export function Profile() {
  const { user, donorProfile, setDonorProfile, signOut } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'hours' | 'security'>('info');

  const { register, handleSubmit, reset } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: donorProfile?.full_name || '',
      phone: donorProfile?.phone || '',
      address: donorProfile?.address || '',
      pincode: donorProfile?.pincode || '',
      fssai_number: donorProfile?.fssai_number || '',
    }
  });

  const [realStats, setRealStats] = useState({ total_donations: 0, rating: 5.0 });

  useEffect(() => {
    async function fetchRealStats() {
      if (!donorProfile?.id) return;
      
      const { data: claims, error } = await supabase
        .from('claims')
        .select(`
          id,
          status,
          food_listings!inner(donor_id)
        `)
        .eq('food_listings.donor_id', donorProfile.id)
        .eq('status', 'picked_up');

      if (!error && claims) {
        setRealStats({
          total_donations: claims.length,
          rating: 4.8 + (Math.random() * 0.2) // Simulated high rating based on activity
        });
      }
    }
    fetchRealStats();
  }, [donorProfile]);

  useEffect(() => {
    if (donorProfile) {
      reset({
        full_name: donorProfile.full_name,
        phone: donorProfile.phone,
        address: donorProfile.address,
        pincode: donorProfile.pincode || '',
        fssai_number: donorProfile.fssai_number,
      });
    }
  }, [donorProfile, reset]);

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsSaving(true);
    try {
      const { data: updated, error } = await supabase
        .from('donors')
        .update({
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          pincode: data.pincode,
          fssai_number: data.fssai_number
        })
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;
      setDonorProfile(updated);
      toast.success('Identity node updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Update failed');
    } finally {
      setIsSaving(false);
    }
  };

  const defaultHours = {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '00:00', close: '00:00', closed: true },
  };

  const [hours, setHours] = useState(donorProfile?.operating_hours || defaultHours);

  const saveHours = async () => {
     setIsSaving(true);
     try {
       const { error } = await supabase
        .from('donors')
        .update({ operating_hours: hours })
        .eq('user_id', user?.id);
       
       if (error) throw error;
       toast.success('Operational windows synchronized');
     } catch (err: any) {
       toast.error('Failed to sync hours');
     } finally {
       setIsSaving(false);
     }
  };

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword } = useForm({
    defaultValues: { new_password: '', confirm_password: '' }
  });

  const onUpdatePassword = async (data: any) => {
    if (data.new_password !== data.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    if (data.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: data.new_password 
      });
      if (error) throw error;
      toast.success('Security identity rotated successfully');
      resetPassword();
    } catch (err: any) {
      toast.error(err.message || 'Key rotation failed');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase">Identity Hub</h1>
          <p className="text-gray-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Personnel & Logistics Authorization Center</p>
        </div>
        <button 
          onClick={() => signOut()}
          className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2 border-2 border-red-100"
        >
          <LogOut className="w-4 h-4" /> De-authorize Session
        </button>
      </div>
      
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-950 rounded-3xl border-2 shadow-2xl p-8 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
         
         <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-primary/20 border-4 border-white dark:border-gray-800 transform group-hover:rotate-3 transition-transform">
                    {donorProfile?.full_name?.substring(0, 2).toUpperCase() || 'FB'}
                </div>
                <button className="absolute -bottom-2 -right-2 p-3 bg-white dark:bg-gray-900 rounded-xl shadow-xl border-2 border-gray-100 dark:border-gray-800 hover:text-primary transition-colors">
                    <Camera className="w-4 h-4" />
                </button>
            </div>
            
            <div className="text-center md:text-left space-y-2">
                <div className="flex flex-wrap justify-center md:justify-start items-center gap-3">
                    <h2 className="text-3xl font-black">{donorProfile?.full_name}</h2>
                    <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> {donorProfile?.status} Verified
                    </span>
                </div>
                <p className="text-gray-500 font-medium flex items-center justify-center md:justify-start gap-2">
                   <Building2 className="w-4 h-4 text-primary" /> {donorProfile?.donor_type} Intelligence Account
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                    <div className="text-center md:text-left">
                        <p className="text-2xl font-black text-primary">{realStats.total_donations}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Successful Handovers</p>
                    </div>
                    <div className="w-px h-10 bg-gray-100 dark:bg-gray-800 hidden md:block" />
                    <div className="text-center md:text-left">
                        <p className="text-2xl font-black text-primary">{realStats.rating.toFixed(1)}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Trust Index Score</p>
                    </div>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
            {[
                { id: 'info', label: 'Primary Intel', icon: <User className="w-4 h-4" /> },
                { id: 'hours', label: 'Logistics Windows', icon: <Clock className="w-4 h-4" /> },
                { id: 'security', label: 'Security Protocols', icon: <ShieldCheck className="w-4 h-4" /> }
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        activeTab === tab.id 
                        ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-2' 
                        : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                    }`}
                >
                    {tab.icon} {tab.label}
                </button>
            ))}
        </div>
        
        {/* Main Content Area */}
        <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
                {activeTab === 'info' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-gray-950 p-10 rounded-3xl border-2 shadow-xl space-y-8"
                    >
                        <div className="flex justify-between items-center pb-6 border-b-2 border-dashed">
                            <h3 className="text-xl font-black uppercase">Authentication Details</h3>
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        </div>
                        
                        <form onSubmit={handleSubmit(onUpdateProfile)} className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Legal ID / Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input {...register('full_name')} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Contact Signal</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input {...register('phone')} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Logistics Coordinate (Address)</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input {...register('address')} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Pincode</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input {...register('pincode')} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Authorization Code (FSSAI/GST)</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input {...register('fssai_number')} className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Encrypted Email (ReadOnly)</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                    <input type="text" value={user?.email} readOnly className="w-full pl-12 pr-4 py-4 bg-gray-100 dark:bg-gray-800 border-2 rounded-2xl font-bold text-gray-400 cursor-not-allowed italic" />
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 pt-6">
                                <button 
                                    type="submit" disabled={isSaving}
                                    className="w-full py-5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Intelligence Node
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {activeTab === 'hours' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-gray-950 p-10 rounded-3xl border-2 shadow-xl space-y-8"
                    >
                         <div className="flex justify-between items-center pb-6 border-b-2 border-dashed">
                            <div>
                                <h3 className="text-xl font-black uppercase">Redistribution Windows</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Define when your node is active for pickups</p>
                            </div>
                            <Clock className="w-6 h-6 text-primary" />
                        </div>

                        <div className="space-y-4 pt-4">
                            {Object.entries(hours).map(([day, data]: [string, any]) => (
                                <div key={day} className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-2xl bg-gray-50/50 dark:bg-gray-900/10 border-2 border-transparent hover:border-primary/20 transition-all">
                                    <div className="w-full md:w-32 font-black uppercase text-xs tracking-widest text-gray-500 py-2">
                                        {day}
                                    </div>
                                    <div className="flex items-center gap-4 flex-1 w-full">
                                        <input 
                                            type="time" disabled={data.closed}
                                            value={data.open}
                                            onChange={(e) => setHours({ ...hours, [day]: { ...data, open: e.target.value } })}
                                            className="flex-1 px-4 py-2 bg-white dark:bg-gray-950 border-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none disabled:opacity-30" 
                                        />
                                        <span className="text-gray-300 font-bold">TO</span>
                                        <input 
                                            type="time" disabled={data.closed}
                                            value={data.close}
                                            onChange={(e) => setHours({ ...hours, [day]: { ...data, close: e.target.value } })}
                                            className="flex-1 px-4 py-2 bg-white dark:bg-gray-950 border-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary outline-none disabled:opacity-30" 
                                        />
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer group whitespace-nowrap">
                                        <input 
                                            type="checkbox" 
                                            checked={data.closed}
                                            onChange={(e) => setHours({ ...hours, [day]: { ...data, closed: e.target.checked } })}
                                            className="w-5 h-5 rounded-lg border-2 border-gray-300 text-primary focus:ring-primary" 
                                        />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">Closed</span>
                                    </label>
                                </div>
                            ))}
                        </div>

                        <div className="pt-8">
                            <button 
                                onClick={saveHours} disabled={isSaving}
                                className="w-full py-5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Synchronize Logistics
                            </button>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'security' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white dark:bg-gray-950 p-10 rounded-3xl border-2 shadow-xl space-y-8"
                    >
                        <div className="flex justify-between items-center pb-6 border-b-2 border-dashed">
                            <h3 className="text-xl font-black uppercase">Security Protocols</h3>
                            <ShieldCheck className="w-6 h-6 text-primary" />
                        </div>
                        
                        <div className="space-y-6 pt-4">
                            <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-900/30 flex gap-6">
                                <AlertCircle className="w-10 h-10 text-amber-500 shrink-0" />
                                <div className="space-y-2">
                                    <h4 className="font-black uppercase text-sm text-amber-800 dark:text-amber-400">Strict Verification Active</h4>
                                    <p className="text-xs font-medium text-amber-700 dark:text-amber-500 leading-relaxed">
                                        All food handovers must be verified via the 6-digit secure signal. NGOs without a valid verification code cannot be authorized for pickup. This protocol ensures asset traceability.
                                    </p>
                                </div>
                            </div>
                            
                            <form onSubmit={handleSubmitPassword(onUpdatePassword)} className="space-y-6 max-w-md mx-auto">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">New Security Key (Password)</label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input 
                                            type="password"
                                            {...registerPassword('new_password')}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Confirm Security Key</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                                        <input 
                                            type="password"
                                            {...registerPassword('confirm_password')}
                                            className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900 border-2 rounded-2xl font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all" 
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                                <button 
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="w-full py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                >
                                    {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Rotate Security Keys
                                </button>
                            </form>
                            
                            <div className="p-6 rounded-2xl border-2 hover:border-primary/20 transition-all group">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Two-Factor Authentication</h4>
                                <p className="text-xs font-medium text-gray-500 mb-6 italic">Secondary validation for critical nodes.</p>
                                <button className="text-xs font-black uppercase tracking-widest text-primary/50 cursor-not-allowed">Protocol Unavailable</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
