import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { HeartHandshake, UserPlus, FileText, MapPin, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Valid phone number is required'),
  donorType: z.enum(['individual', 'business']),
  address: z.string().optional(),
  pincode: z.string().optional(),
  kycUrl: z.string().optional(),
  selfieUrl: z.string().optional(),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const { loginSuccess } = useAuthStore();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      donorType: 'individual'
    }
  });

  const kycUrl = watch('kycUrl');
  const selfieUrl = watch('selfieUrl');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'kycUrl' | 'selfieUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(prev => ({ ...prev, [field]: true }));
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `temp/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('verification')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('verification')
        .getPublicUrl(filePath);

      setValue(field, publicUrl);
    } catch (err: any) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setIsUploading(prev => ({ ...prev, [field]: false }));
    }
  };

  const onSubmit = async (data: RegisterValues) => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        const res = await fetch('http://127.0.0.1:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            full_name: data.fullName,
            phone: data.phone,
            donor_type: data.donorType,
            address: data.address,
            pincode: data.pincode,
            kyc_document_url: data.kycUrl,
            selfie_url: data.selfieUrl,
          })
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to register');

        // Sync auth state locally
        if (json.data?.session) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: json.data.session.access_token,
            refresh_token: json.data.session.refresh_token,
          });
          if (sessionError) throw sessionError;
        }

        if (json.data?.user && json.data?.profile) {
          await loginSuccess(json.data.user, json.data.profile, json.data.session);
        }

        navigate('/');
      } catch (err: any) {
        console.error('Registration Error:', err);
        alert(err.message || 'An unexpected error occurred during registration.');
      }
    }
  };

  const stepsInfo = [
    { title: 'Details', icon: UserPlus },
    { title: 'Verification', icon: FileText },
    { title: 'Location', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center flex-col items-center">
          <HeartHandshake className="w-12 h-12 text-primary" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            Create an Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:text-primary/80">Log in</Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Stepper */}
        <div className="flex justify-center items-center mb-8 px-4 relative">
          <div className="absolute top-1/2 left-8 w-[calc(100%-4rem)] h-1 bg-gray-200 -translate-y-1/2 rounded-full -z-10 overflow-hidden" />
          <div className="flex w-full justify-between z-10">
            {stepsInfo.map((s, index) => {
              const isActive = step === index + 1;
              const isCompleted = step > index + 1;
              return (
                <div key={index} className="flex flex-col items-center bg-gray-50 dark:bg-gray-950 px-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isActive ? 'border-primary bg-primary text-white' :
                      isCompleted ? 'border-primary bg-primary/10 text-primary' :
                        'border-gray-300 bg-white text-gray-400'
                    }`}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium mt-1 text-gray-500">{s.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow sm:rounded-xl sm:px-10 border">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <div>
                  <label className="block text-sm font-medium">Full Legal Name / Business Name</label>
                  <input {...register('fullName')} className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary bg-transparent" />
                  {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Email Address</label>
                  <input type="email" {...register('email')} className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary bg-transparent" />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone Number</label>
                  <input type="tel" {...register('phone')} className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary bg-transparent" />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Password</label>
                  <input type="password" {...register('password')} className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary bg-transparent" />
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">I am registering as an:</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input type="radio" value="individual" {...register('donorType')} className="text-primary focus:ring-primary" defaultChecked />
                      <span>Individual</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="radio" value="business" {...register('donorType')} className="text-primary focus:ring-primary" />
                      <span>Business/NGO</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-semibold mb-2">KYC & Identity Verification</h3>

                <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="file"
                      id="kyc-upload"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'kycUrl')}
                      accept="image/*"
                    />
                    <label
                      htmlFor="kyc-upload"
                      className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${kycUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary'
                        }`}
                    >
                      {isUploading.kycUrl ? (
                        <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      ) : kycUrl ? (
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      ) : (
                        <FileText className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      )}
                      <p className="text-sm font-medium">{kycUrl ? 'ID Uploaded Successfully' : 'Upload Government ID'}</p>
                      <p className="text-xs text-gray-500 mt-1">{kycUrl ? 'Click to change' : '(Aadhaar / PAN / Passport)'}</p>
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      type="file"
                      id="selfie-upload"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'selfieUrl')}
                      accept="image/*"
                    />
                    <label
                      htmlFor="selfie-upload"
                      className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${selfieUrl ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary'
                        }`}
                    >
                      {isUploading.selfieUrl ? (
                        <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                      ) : selfieUrl ? (
                        <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
                      ) : (
                        <UserPlus className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      )}
                      <p className="text-sm font-medium">{selfieUrl ? 'Selfie Uploaded Successfully' : 'Take a Selfie'}</p>
                      <p className="text-xs text-gray-500 mt-1">{selfieUrl ? 'Click to change' : 'For manual facial matching'}</p>
                    </label>
                  </div>
                </div>

                <div className="flex items-start gap-2 mt-4">
                  <input type="checkbox" required className="mt-1 text-primary focus:ring-primary rounded" />
                  <p className="text-xs text-gray-600">I agree to the Terms of Service and Privacy Policy. I confirm all provided information is accurate.</p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                <h3 className="font-semibold mb-2">Primary Pickup Address</h3>
                <div>
                  <label className="block text-sm font-medium">Pincode</label>
                  <input
                    {...register('pincode')}
                    className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary bg-transparent"
                    placeholder="e.g. 560001"
                  />
                  {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium">Full Address</label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="mt-1 block w-full px-4 py-2 border rounded-md focus:ring-primary focus:border-primary bg-transparent"
                    placeholder="Street name, Landmark, Building..."
                  />
                  {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
                </div>
                <div className="h-40 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center mt-2 text-sm text-gray-500">
                  <MapPin className="w-6 h-6 mb-2 text-gray-400" />
                  <span>Map Picker Integrated</span>
                  <p className="text-[10px] mt-1 text-gray-400">Coordinates will be captured automatically</p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4 border-t">
              {step > 1 && (
                <button type="button" onClick={() => setStep(step - 1)} className="px-4 py-2 border border-gray-300 rounded-md font-medium hover:bg-gray-50 flex-1 transition-colors">
                  Back
                </button>
              )}
              <button
                type="submit"
                className="w-full flex-2 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                {step === 3 ? 'Complete Registration' : 'Next Step'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
