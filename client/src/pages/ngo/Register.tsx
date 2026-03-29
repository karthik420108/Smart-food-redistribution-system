import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, FileText, MapPin, Users, CheckCircle,
  ChevronRight, ChevronLeft, Eye, EyeOff, Upload, X, Plus, Minus, HeartHandshake
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const ORG_TYPES = [
  { value: 'ngo', label: 'NGO', icon: '🏛️' },
  { value: 'community_kitchen', label: 'Community Kitchen', icon: '🍲' },
  { value: 'food_bank', label: 'Food Bank', icon: '📦' },
  { value: 'orphanage', label: 'Orphanage', icon: '🏠' },
  { value: 'old_age_home', label: 'Old Age Home', icon: '👴' },
  { value: 'hospital', label: 'Hospital', icon: '🏥' },
  { value: 'shelter', label: 'Shelter', icon: '⛺' },
  { value: 'other', label: 'Other', icon: '🌍' },
];

const DIETARY_OPTIONS = ['Vegetarian Only', 'Vegan', 'Halal', 'Kosher', 'No Pork', 'No Beef', 'Nut-Free', 'Gluten-Free'];
const FOOD_TYPE_OPTIONS = ['Cooked Ready-to-Eat', 'Raw Produce', 'Packaged Non-Perishables', 'Baked Goods', 'Beverages', 'Dairy'];
const WHO_SERVED = ['Children', 'Elderly', 'Homeless', 'Pregnant Women', 'General Public', 'Special Needs', 'Disaster Relief'];
const MEAL_TIMES = ['Breakfast', 'Lunch', 'Dinner'];

const STEPS = [
  { label: 'Identity', icon: Building2 },
  { label: 'Documents', icon: FileText },
  { label: 'Location', icon: MapPin },
  { label: 'Preferences', icon: Users },
  { label: 'Review', icon: CheckCircle },
];

export function NgoRegister() {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    org_type: '',
    dietary_restrictions: [],
    food_type_preferences: [],
    who_served: [],
    peak_meal_times: {},
    primary_lat: 12.9716,
    primary_lng: 77.5946,
    service_radius_km: 10,
    distribution_centers: [],
    documents: {},
  });
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const updateFormData = (updates: any) => setFormData((prev: any) => ({ ...prev, ...updates }));

  const toggleItem = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v: string) => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleSubmitForm = async () => {
    setLoading(true);
    try {
      const payload = { ...formData };
      const res = await api.post('/ngo/auth/register', payload);
      if (res.data.success) {
        toast.success('Registration submitted! Awaiting admin approval.');
        navigate('/ngo/login');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-[380px] flex-col bg-gradient-to-b from-green-900 to-gray-900 p-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #22c55e 0%, transparent 50%), radial-gradient(circle at 80% 20%, #3b82f6 0%, transparent 50%)'}} />
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-green-500 shadow-lg border-b-2 border-green-700 flex items-center justify-center">
               <HeartHandshake className="text-white w-6 h-6" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-black text-xl tracking-tight uppercase">Rescue</span>
              <span className="text-green-500 font-black text-xl tracking-tight uppercase">Bite</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-3">Join the Mission</h1>
          <p className="text-green-200 text-sm leading-relaxed mb-8">
            Register your NGO with RescueBite to start claiming surplus food and feeding communities in need. Verified partners gain access to real-time logistics, volunteer management, and impact analytics.
          </p>
          <div className="space-y-3">
            {['Real-time food listings near you', 'Manage volunteers & pickups', 'Track impact & generate reports', 'AI-powered smart suggestions'].map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-white/80">
                <div className="w-5 h-5 rounded-full bg-teal-500/30 border border-teal-400/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-teal-400 text-xs">✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-6 lg:p-10">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? 'bg-teal-500 text-white' :
                    i === step ? 'bg-teal-500/20 border-2 border-teal-500 text-teal-400' :
                    'bg-gray-800 text-gray-600'
                  }`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px w-8 transition-all ${i < step ? 'bg-teal-500' : 'bg-gray-800'}`} />
                  )}
                </div>
              ))}
            </div>
            <h2 className="text-xl font-bold text-white">
              {['Organization Identity', 'Document Upload', 'Location & Service Area', 'Food Preferences', 'Review & Submit'][step]}
            </h2>
            <p className="text-gray-400 text-sm mt-1">Step {step + 1} of {STEPS.length}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && <Step1 formData={formData} updateFormData={updateFormData} />}
              {step === 1 && <Step2 formData={formData} updateFormData={updateFormData} />}
              {step === 2 && <Step3 formData={formData} updateFormData={updateFormData} />}
              {step === 3 && (
                <Step4
                  formData={formData}
                  updateFormData={updateFormData}
                  toggleItem={toggleItem}
                />
              )}
              {step === 4 && <Step5 formData={formData} />}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={prevStep}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5 text-sm font-medium"
              >
                <ChevronLeft size={16} /> Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="flex-1 bg-teal-600 hover:bg-teal-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmitForm}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
            )}
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            Already registered? <Link to="/ngo/login" className="text-teal-400 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, error, ...props }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      <input
        {...props}
        className={`w-full px-3.5 py-2.5 rounded-xl bg-gray-800/80 border text-white placeholder-gray-500 text-sm outline-none transition focus:border-teal-500 ${
          error ? 'border-red-500/60' : 'border-white/10 hover:border-white/20'
        }`}
      />
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}

function Step1({ formData, updateFormData }: any) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Organization Type *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ORG_TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => updateFormData({ org_type: t.value })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center text-xs font-medium transition-all ${
                formData.org_type === t.value
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/20'
              }`}
            >
              <span className="text-xl">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>
      <InputField label="Organization Name *" placeholder="Hope Foundation" value={formData.org_name || ''} onChange={(e: any) => updateFormData({ org_name: e.target.value })} />
      <InputField label="Registration Number *" placeholder="FCRA/NGO Darpan ID/Trust Deed" value={formData.registration_number || ''} onChange={(e: any) => updateFormData({ registration_number: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Contact Person *" placeholder="Full name" value={formData.contact_person || ''} onChange={(e: any) => updateFormData({ contact_person: e.target.value })} />
        <InputField label="Designation" placeholder="Director, Manager..." value={formData.designation || ''} onChange={(e: any) => updateFormData({ designation: e.target.value })} />
      </div>
      <InputField label="Email Address *" type="email" placeholder="contact@ngo.org" value={formData.email || ''} onChange={(e: any) => updateFormData({ email: e.target.value })} />
      <InputField label="Phone *" type="tel" placeholder="+91 98765 43210" value={formData.phone || ''} onChange={(e: any) => updateFormData({ phone: e.target.value })} />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Password *" type="password" placeholder="Min 8 characters" value={formData.password || ''} onChange={(e: any) => updateFormData({ password: e.target.value })} />
        <InputField label="Confirm Password *" type="password" placeholder="Repeat password" value={formData.confirm_password || ''} onChange={(e: any) => updateFormData({ confirm_password: e.target.value })} />
      </div>
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-800/50 border border-white/5">
        <input type="checkbox" id="tos" checked={formData.tos || false} onChange={e => updateFormData({ tos: e.target.checked })} className="mt-0.5" />
        <label htmlFor="tos" className="text-xs text-gray-400">
          I agree to RescueBite's <a href="#" className="text-green-400">Terms of Service</a> and confirm that all information provided is accurate.
        </label>
      </div>
    </div>
  );
}

function Step2({ formData, updateFormData }: any) {
  const docs = [
    { key: 'registration_cert', label: 'Registration Certificate *', note: 'FCRA/Trust/Society certificate', required: true },
    { key: 'tax_certificate', label: '80G / 12A Tax Certificate', note: 'Increases trust score by +15', required: false },
    { key: 'financial_report', label: 'Financial Statement', note: 'Annual report — increases trust by +10', required: false },
    { key: 'id_proof', label: 'ID Proof of Contact Person *', note: 'Aadhaar, PAN, or Passport', required: true },
    { key: 'authorization_letter', label: 'Authorization Letter', note: 'Increases trust score by +10', required: false },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-400">Upload KYC documents. Files must be under 10MB (PDF, JPG, PNG).</p>
      {docs.map(doc => (
        <div key={doc.key} className="flex items-center gap-4 p-4 rounded-xl bg-gray-800/50 border border-white/5 hover:border-white/10">
          <div className="flex-1">
            <div className="text-sm font-medium text-white">{doc.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{doc.note}</div>
          </div>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  updateFormData({ documents: { ...formData.documents, [doc.key]: file.name } });
                }
              }}
            />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              formData.documents?.[doc.key]
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'
            }`}>
              <Upload size={12} />
              {formData.documents?.[doc.key] ? 'Uploaded ✓' : 'Upload'}
            </div>
          </label>
        </div>
      ))}
    </div>
  );
}

function Step3({ formData, updateFormData }: any) {
  return (
    <div className="space-y-5">
      <InputField
        label="Primary Address *"
        placeholder="Full address with pincode"
        value={formData.primary_address || ''}
        onChange={(e: any) => updateFormData({ primary_address: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <InputField label="Latitude" type="number" step="any" value={formData.primary_lat || ''} onChange={(e: any) => updateFormData({ primary_lat: parseFloat(e.target.value) })} />
        <InputField label="Longitude" type="number" step="any" value={formData.primary_lng || ''} onChange={(e: any) => updateFormData({ primary_lng: parseFloat(e.target.value) })} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-300">Service Radius: {formData.service_radius_km} km</label>
        </div>
        <input
          type="range" min={2} max={50} step={1}
          value={formData.service_radius_km}
          onChange={e => updateFormData({ service_radius_km: parseInt(e.target.value) })}
          className="w-full accent-teal-500"
        />
        <div className="flex justify-between text-xs text-gray-500"><span>2 km</span><span>50 km</span></div>
      </div>

      {/* Distribution Centers */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-300">Distribution Centers</label>
          <button
            onClick={() => updateFormData({ distribution_centers: [...(formData.distribution_centers || []), { label: '', address: '', lat: 0, lng: 0 }] })}
            className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
          >
            <Plus size={12} /> Add Center
          </button>
        </div>
        {(formData.distribution_centers || []).map((center: any, idx: number) => (
          <div key={idx} className="mb-3 p-3 rounded-xl bg-gray-800/50 border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400 font-medium">Center {idx + 1}</span>
              <button onClick={() => {
                const centers = [...formData.distribution_centers];
                centers.splice(idx, 1);
                updateFormData({ distribution_centers: centers });
              }} className="text-gray-600 hover:text-red-400"><X size={14} /></button>
            </div>
            <InputField placeholder="Label (e.g., Main Hub)" value={center.label} onChange={(e: any) => {
              const c = [...formData.distribution_centers];
              c[idx].label = e.target.value;
              updateFormData({ distribution_centers: c });
            }} />
            <InputField placeholder="Full address" value={center.address} onChange={(e: any) => {
              const c = [...formData.distribution_centers];
              c[idx].address = e.target.value;
              updateFormData({ distribution_centers: c });
            }} />
          </div>
        ))}
        {(formData.distribution_centers || []).length === 0 && (
          <p className="text-xs text-gray-500 italic">Your primary address will be used as the main distribution center.</p>
        )}
      </div>
    </div>
  );
}

function Step4({ formData, updateFormData, toggleItem }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1.5">Daily Beneficiaries Served</label>
        <InputField
          type="number" placeholder="e.g., 200"
          value={formData.beneficiary_count || ''}
          onChange={(e: any) => updateFormData({ beneficiary_count: parseInt(e.target.value) })}
        />
      </div>

      <CheckboxGroup
        label="Who You Serve"
        options={WHO_SERVED}
        selected={formData.who_served || []}
        onToggle={(v: string) => toggleItem('who_served', v)}
      />
      <CheckboxGroup
        label="Dietary Restrictions Served"
        options={DIETARY_OPTIONS}
        selected={formData.dietary_restrictions || []}
        onToggle={(v: string) => toggleItem('dietary_restrictions', v)}
      />
      <CheckboxGroup
        label="Food Types Needed Most"
        options={FOOD_TYPE_OPTIONS}
        selected={formData.food_type_preferences || []}
        onToggle={(v: string) => toggleItem('food_type_preferences', v)}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Peak Meal Times</label>
        <div className="flex gap-2 flex-wrap">
          {MEAL_TIMES.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => {
                const times = { ...(formData.peak_meal_times || {}) };
                if (times[t.toLowerCase()]) delete times[t.toLowerCase()];
                else times[t.toLowerCase()] = true;
                updateFormData({ peak_meal_times: times });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                formData.peak_meal_times?.[t.toLowerCase()]
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-white/10 bg-gray-800/50 text-gray-400'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/50 border border-white/5">
        <div>
          <div className="text-sm font-medium text-white">Cold Storage Available</div>
          <div className="text-xs text-gray-500">Affects which listings are matched</div>
        </div>
        <button
          onClick={() => updateFormData({ cold_storage: !formData.cold_storage })}
          className={`w-11 h-6 rounded-full relative transition-all ${formData.cold_storage ? 'bg-teal-500' : 'bg-gray-700'}`}
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${formData.cold_storage ? 'right-0.5' : 'left-0.5'}`} />
        </button>
      </div>
    </div>
  );
}

function CheckboxGroup({ label, options, selected, onToggle }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt: string) => (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              selected.includes(opt)
                ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                : 'border-white/10 bg-gray-800/50 text-gray-400 hover:border-white/20'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step5({ formData }: any) {
  const fields = [
    { label: 'Organization', value: formData.org_name },
    { label: 'Type', value: formData.org_type },
    { label: 'Registration #', value: formData.registration_number },
    { label: 'Contact', value: formData.contact_person },
    { label: 'Email', value: formData.email },
    { label: 'Phone', value: formData.phone },
    { label: 'Address', value: formData.primary_address },
    { label: 'Service Radius', value: `${formData.service_radius_km} km` },
    { label: 'Beneficiaries', value: formData.beneficiary_count },
    { label: 'Dietary Served', value: (formData.dietary_restrictions || []).join(', ') || '—' },
    { label: 'Food Types', value: (formData.food_type_preferences || []).join(', ') || '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <p className="text-sm text-amber-400 font-medium">Please review your information before submitting. Once submitted, your application will be reviewed by our team within 24–48 hours.</p>
      </div>
      <div className="space-y-2">
        {fields.map(f => (
          <div key={f.label} className="flex items-start gap-3 py-2 border-b border-white/5">
            <span className="text-xs text-gray-500 w-32 flex-shrink-0 pt-0.5">{f.label}</span>
            <span className="text-sm text-white">{f.value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
