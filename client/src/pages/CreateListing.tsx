import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, MapPin, Package, Upload, CheckCircle2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { apiFetch } from '../lib/api';
import { MockMap } from '../components/MockMap';

const formSchema = z.object({
  title: z.string().min(5, "Title is too short").max(100),
  description: z.string().min(10, "Provide a better description"),
  category: z.enum(['cooked_food', 'raw_produce', 'packaged', 'beverages', 'other']),
  quantity: z.number().positive(),
  quantity_unit: z.enum(['kg', 'liters', 'portions', 'boxes', 'packets']),
  expiry_datetime: z.string(),
  is_urgent: z.boolean().default(false),
  pickup_address: z.string().min(5),
});

type FormValues = z.infer<typeof formSchema>;

const STEPS = [
  { id: 1, title: 'Food Details', icon: Package },
  { id: 2, title: 'Photos', icon: Upload },
  { id: 3, title: 'Pickup Location', icon: MapPin },
  { id: 4, title: 'Review', icon: CheckCircle2 },
];

export function CreateListing() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mapLocation, setMapLocation] = useState({ lat: 19.0760, lng: 72.8777 }); // Default Mumbai
  const [images, setImages] = useState<File[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: 'cooked_food',
      quantity_unit: 'kg',
      is_urgent: false,
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - images.length);
      setImages([...images, ...newFiles]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setIsPublishing(true);
    try {
      // 1. Upload images to Supabase Storage
      const imageUrls: string[] = [];
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
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

      toast.success('Listing published successfully! Nearby recipients notified.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Publish error:', err);
      toast.error(err.message || 'Failed to publish listing');
    } finally {
      setIsPublishing(false);
    }
  };

  const formData = watch();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Listing</h1>
      </div>

      {/* Basic Stepper */}
      <div className="flex justify-between items-center mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-800 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
          <motion.div 
             className="h-full bg-primary"
             initial={{ width: '0%' }}
             animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
             transition={{ duration: 0.3 }}
          />
        </div>
        {STEPS.map((s) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-white dark:bg-gray-950 px-2 rounded-lg">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isActive ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-110' :
                  isCompleted ? 'border-primary bg-primary/10 text-primary' :
                  'border-gray-200 dark:border-gray-800 bg-white text-gray-400'
                }`}
              >
                <s.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider ${isActive || isCompleted ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-950 border rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 md:p-10">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                   <div className="p-2 bg-primary/10 rounded-lg"><Package className="w-6 h-6" /></div>
                   <h2 className="text-2xl font-bold">Food Details</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                    <div className="flex gap-2">
                      <input {...register('title')} className="flex-1 px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="E.g., 50 boxes of leftover buffet rice" />
                      <button type="button" className="px-5 py-3 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-xl font-bold flex items-center gap-2 transition-colors">
                        <Sparkles className="w-4 h-4" /> AI Assist
                      </button>
                    </div>
                    {errors.title && <p className="text-red-500 text-xs mt-1.5">{errors.title.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                      <select {...register('category')} className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none appearance-none">
                        <option value="cooked_food">Cooked Food</option>
                        <option value="raw_produce">Raw Produce</option>
                        <option value="packaged">Packaged Items</option>
                        <option value="beverages">Beverages</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expiry Date & Time</label>
                      <input type="datetime-local" {...register('expiry_datetime')} className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Quantity</label>
                        <input type="number" {...register('quantity', { valueAsNumber: true })} className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="0" />
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Unit</label>
                        <select {...register('quantity_unit')} className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none appearance-none">
                          <option value="kg">Kilograms (kg)</option>
                          <option value="portions">Portions / Meals</option>
                          <option value="boxes">Boxes</option>
                          <option value="liters">Liters</option>
                        </select>
                     </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                    <textarea {...register('description')} rows={3} className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="Any specific details, safety notes, or storage instructions..." />
                  </div>
                  
                  <label className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl cursor-pointer border border-red-100 dark:border-red-900/30">
                    <input type="checkbox" {...register('is_urgent')} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                    <div>
                       <span className="block text-sm font-bold text-red-600 uppercase tracking-wide">Mark as Urgent</span>
                       <p className="text-xs text-red-500 mt-0.5">Expires within 4 hours. Will trigger immediate priority notifications.</p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                   <div className="p-2 bg-primary/10 rounded-lg"><Upload className="w-6 h-6" /></div>
                   <h2 className="text-2xl font-bold">Food Photos</h2>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((file, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border group shadow-sm">
                      <img 
                        src={URL.createObjectURL(file)} 
                        className="w-full h-full object-cover" 
                        alt={`Food ${i+1}`} 
                      />
                      <button 
                        type="button" 
                        onClick={() => removeImage(i)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-800 rounded-xl hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                      <Upload className="w-8 h-8 text-gray-400 group-hover:text-primary mb-2" />
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Add Photo</span>
                      <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" multiple />
                    </label>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 text-primary">
                   <div className="p-2 bg-primary/10 rounded-lg"><MapPin className="w-6 h-6" /></div>
                   <h2 className="text-2xl font-bold">Pickup Location</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Exact Address</label>
                    <input {...register('pickup_address')} className="w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-primary outline-none" placeholder="123 Example St, City, State" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Mark Location on Map</label>
                    <MockMap 
                        className="w-full h-[350px] rounded-2xl border" 
                        center={mapLocation}
                        markers={[{ ...mapLocation, label: 'Your Pickup Point', type: 'donor' }]}
                        onClick={(lat, lng) => setMapLocation({ lat, lng })}
                    />
                    <p className="text-[10px] text-gray-500 font-medium italic">* Tap on the map to pinpoint your location for precise matched notification distance.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                   <CheckCircle2 className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold">Review & Publish</h2>
                <p className="text-gray-500 max-w-sm mx-auto">Your listing is ready to be shared with the community. Please double-check details before publishing.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left max-w-xl mx-auto">
                    {[
                      { label: "Title", value: formData.title },
                      { label: "Category", value: formData.category.replace('_', ' ') },
                      { label: "Quantity", value: `${formData.quantity} ${formData.quantity_unit}` },
                      { label: "Priority", value: formData.is_urgent ? "Urgent" : "Standard" },
                      { label: "Pickup", value: formData.pickup_address },
                    ].map((row, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border">
                         <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{row.label}</span>
                         <span className="text-sm font-semibold truncate block">{row.value || 'Not set'}</span>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 flex justify-between">
          <button 
            type="button" 
            onClick={() => setStep(step - 1)} 
            disabled={step === 1 || isPublishing}
            className="px-8 py-3 dark:bg-gray-800 bg-white border rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-gray-100 dark:hover:bg-gray-700 transition-all disabled:opacity-30"
          >
            Back
          </button>
          
          <button 
            type="submit" 
            disabled={isPublishing}
            className={`px-8 py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-3 ${isPublishing ? 'opacity-70' : ''}`}
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {step === STEPS.length ? 'Publish Listing' : 'Next Step'}
          </button>
        </div>
      </form>
    </div>
  );
}
