import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, MapPin, Package, Upload, CheckCircle2, X, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import { MockMap } from '../components/MockMap';

const formSchema = z.object({
  title: z.string().min(5, "Title (min 5 chars)").max(100),
  description: z.string().min(10, "Description (min 10 chars)"),
  category: z.enum(['cooked_food', 'raw_produce', 'packaged', 'beverages', 'other']),
  quantity: z.number().positive("Quantity must be positive"),
  quantity_unit: z.enum(['kg', 'liters', 'portions', 'boxes', 'packets']),
  expiry_datetime: z.string().min(1, "Expiry is required"),
  is_urgent: z.boolean(),
  pickup_address: z.string().min(5, "Address (min 5 chars)"),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: 'Details', icon: Package, fields: ['title', 'description', 'category', 'quantity', 'quantity_unit', 'expiry_datetime'] },
  { id: 2, title: 'Photos', icon: Upload, fields: [] },
  { id: 3, title: 'Location', icon: MapPin, fields: ['pickup_address'] },
  { id: 4, title: 'Review', icon: CheckCircle2, fields: [] },
];

export function CreateListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mapLocation, setMapLocation] = useState({ lat: 19.0760, lng: 72.8777 }); 
  const [images, setImages] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
    defaultValues: {
      category: 'cooked_food',
      quantity_unit: 'kg',
      is_urgent: false,
    }
  });

  const { register, handleSubmit, trigger, watch, formState: { errors } } = form;
  const formData = watch();

  const handleNext = async () => {
    const currentStepFields = STEPS.find(s => s.id === step)?.fields as any[];
    const isStepValid = await trigger(currentStepFields);
    
    if (isStepValid) {
      if (step === 2 && images.length === 0) {
        toast.error("Please upload at least one photo");
        return;
      }
      setStep(step + 1);
    } else {
      toast.error("Please fill required fields correctly");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - images.length);
      setImages([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onPublish = async (data: FormValues) => {
    setIsPublishing(true);
    try {
      // 1. Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('listings')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(uploadData.path);
        
        imageUrls.push(publicUrl);
      }

      // 2. Submit to backend
      const payload = {
        ...data,
        lat: mapLocation.lat,
        lng: mapLocation.lng,
        images: imageUrls
      };

      await apiFetch('/listings', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // 3. Success Feedback
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });

      toast.success('Listing published! Reaching out to nearby NGOs...');
      
      setTimeout(() => {
        navigate('/manage-listings');
      }, 2000);

    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(err.message || 'Failed to publish listing');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
          Distribute Assets
        </h1>
        <p className="text-gray-500 font-medium">Create a new food listing to reach nearby NGOs in real-time.</p>
      </div>

      <div className="flex justify-between items-center mb-12 relative px-4">
        <div className="absolute top-6 left-0 w-full h-1 bg-gray-100 dark:bg-gray-800 -z-10 rounded-full overflow-hidden">
          <motion.div 
             className="h-full bg-primary"
             animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
             transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          />
        </div>
        {STEPS.map((s) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <div key={s.id} className="flex flex-col items-center gap-3">
              <motion.div 
                animate={{ 
                  scale: isActive ? 1.2 : 1,
                  backgroundColor: isActive ? 'var(--primary)' : isCompleted ? '#ecfdf5' : '#fff'
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all shadow-sm ${
                  isActive ? 'border-primary text-white shadow-xl shadow-primary/30' :
                  isCompleted ? 'border-emerald-200 text-emerald-600' :
                  'border-gray-100 dark:border-gray-800 text-gray-400'
                }`}
              >
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <s.icon className="w-5 h-5" />}
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-[2rem] shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="space-y-8"
            >
              {step === 1 && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Asset Title</label>
                      <input 
                        {...register('title')} 
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all"
                        placeholder="e.g., 50 Meals of Vegetable Biryani" 
                      />
                      {errors.title && <p className="text-red-500 text-xs font-bold px-2">{errors.title.message}</p>}
                    </div>

                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Category</label>
                       <select {...register('category')} className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none">
                         <option value="cooked_food">Cooked Meals</option>
                         <option value="raw_produce">Raw Groceries</option>
                         <option value="packaged">Packaged Goods</option>
                         <option value="beverages">Beverages</option>
                       </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Quantity</label>
                      <input 
                        type="number" 
                        {...register('quantity', { valueAsNumber: true })} 
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none" 
                        placeholder="0.00" 
                      />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Unit</label>
                       <select {...register('quantity_unit')} className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none">
                         <option value="kg">kilograms</option>
                         <option value="portions">meals / portions</option>
                         <option value="boxes">boxes</option>
                         <option value="packets">packets</option>
                       </select>
                    </div>
                    <div className="space-y-2 md:col-span-1 col-span-2">
                       <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Valid Until</label>
                       <input 
                        type="datetime-local" 
                        {...register('expiry_datetime')} 
                        className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Condition & Instructions</label>
                    <textarea 
                      {...register('description')} 
                      rows={3} 
                      className="w-full px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none resize-none" 
                      placeholder="Any specific instructions..." 
                    />
                  </div>

                  <label className={`flex items-center gap-4 p-6 rounded-[1.5rem] cursor-pointer border-2 transition-all ${watch('is_urgent') ? 'bg-red-50 border-red-100' : 'bg-gray-50/50 border-transparent hover:border-gray-100'}`}>
                    <input type="checkbox" {...register('is_urgent')} className="w-6 h-6 rounded-lg text-red-600 border-gray-300 focus:ring-red-500" />
                    <div className="flex-1">
                       <span className={`block font-bold uppercase tracking-wider text-sm ${watch('is_urgent') ? 'text-red-600' : 'text-gray-900'}`}>High Priority</span>
                       <p className={`text-xs mt-1 ${watch('is_urgent') ? 'text-red-500' : 'text-gray-500'}`}>Alert NGOs immediately.</p>
                    </div>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8 text-center">
                  <h3 className="text-xl font-bold">Visual Asset Verification</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {images.map((file, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border group shadow-lg">
                        <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-xl"><X className="w-4 h-4" /></button>
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label className="aspect-square flex flex-col items-center justify-center border-4 border-dashed border-gray-100 rounded-2xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-300 mb-2" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Photo</span>
                        <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pickup Address</label>
                    <input {...register('pickup_address')} className="w-full px-5 py-4 rounded-2xl border border-gray-100 focus:ring-4 focus:ring-primary/10 outline-none transition-all" placeholder="Street, City..." />
                    {errors.pickup_address && <p className="text-red-500 text-xs font-bold px-2">{errors.pickup_address.message}</p>}
                  </div>
                  <MockMap 
                    className="w-full h-[380px] rounded-[2rem] border border-gray-100 overflow-hidden" 
                    center={mapLocation}
                    markers={[{ ...mapLocation, label: 'Current Hub', type: 'donor' }]}
                    onClick={(lat, lng) => setMapLocation({ lat, lng })}
                  />
                </div>
              )}

              {step === 4 && (
                <div className="space-y-8 text-center">
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-black">System Ready</h3>
                  <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 col-span-2">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Title</span>
                       <span className="text-sm font-bold block">{formData.title}</span>
                    </div>
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Volume</span>
                       <span className="text-sm font-bold block">{formData.quantity} {formData.quantity_unit}</span>
                    </div>
                    <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Priority</span>
                       <span className={`text-sm font-bold block ${formData.is_urgent ? 'text-red-600' : ''}`}>{formData.is_urgent ? "Urgent" : "Standard"}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
          <button 
            type="button" 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1 || isPublishing}
            className="px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-0"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          
          <div className="flex gap-4">
            {step < STEPS.length ? (
              <button 
                type="button"
                onClick={handleNext}
                className="px-10 py-5 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/30 hover:-translate-y-1 transition-all flex items-center gap-3"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="button"
                onClick={handleSubmit(onPublish)}
                disabled={isPublishing}
                className="px-12 py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/30 hover:-translate-y-1 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Publish Asset
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
