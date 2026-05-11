import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2, MoveHorizontal, MoveVertical, Circle, CircleDot, CircleDashed } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DESIGNS } from './DesignGallery';

export function Booking() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const designId = searchParams.get('design');
  const serviceIdParam = searchParams.get('serviceId');
  
  const pickupParam = searchParams.get('pickup');
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPrompt, setShowAiPrompt] = useState(false);
  const [userSizeInfo, setUserSizeInfo] = useState('');
  
  const [formData, setFormData] = useState({
    serviceId: '',
    measurements: {
      bust: '',
      waist: '',
      hips: '',
      length: '',
      shoulder: ''
    },
    notes: '',
    image: null as string | null,
    pickupRequired: pickupParam === 'true',
    pickupAddress: '',
    designPrice: 0,
    designName: ''
  });

  const [services, setServices] = useState<any[]>([]);
  const [designOverrides, setDesignOverrides] = useState<Record<string, number>>({});
  const [selectedService, setSelectedService] = useState<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesSnap, overridesSnap] = await Promise.all([
          getDocs(collection(db, 'services')),
          getDocs(collection(db, 'design_overrides'))
        ]);

        setServices(servicesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const overrides: Record<string, number> = {};
        overridesSnap.docs.forEach(doc => {
          overrides[doc.id] = doc.data().price;
        });
        setDesignOverrides(overrides);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (services.length > 0) {
      let match = null;
      
      if (designId) {
        // Try to match by ID or at least pick a relevant service category
        match = services.find(s => s.id === designId);
        
        // If it's a design gallery ID (like sk2, b1), we should map it to a base service
        if (!match) {
          if (designId.startsWith('sk') || designId.startsWith('b') || designId.startsWith('mw') || designId.startsWith('m') || designId.startsWith('t')) {
            // It's a blouse design
            match = services.find(s => s.id.includes('blouse') || s.name.toLowerCase().includes('blouse'));
          } else if (designId.startsWith('c')) {
            // It's a chudidar
            match = services.find(s => s.id.includes('kurti') || s.id.includes('suit') || s.name.toLowerCase().includes('chudidar'));
          } else if (designId.startsWith('l')) {
            // It's a lehenga
            match = services.find(s => s.id.includes('lehenga'));
          } else if (designId.startsWith('s')) {
            // It's Saree Finishing
            match = services.find(s => s.id.includes('saree'));
          }
        }
      } else if (serviceIdParam) {
        match = services.find(s => s.id === serviceIdParam);
      }

      if (match) {
        const selectedDesign = designId ? DESIGNS.find(d => d.id === designId) : null;
        const currentPrice = selectedDesign ? (designOverrides[selectedDesign.id] || selectedDesign.price) : 0;
        
        setFormData(prev => ({ 
          ...prev, 
          serviceId: match.id,
          designPrice: currentPrice || prev.designPrice,
          designName: selectedDesign ? selectedDesign.name_en : prev.designName,
          notes: designId ? (designId.startsWith('custom') ? 'Custom design request.' : `Interest in Design ID: ${designId}`) : prev.notes
        }));
        setSelectedService(match);
        setStep(2); // Auto-advance to measurements
      } else if (!formData.serviceId && services.length > 0) {
        // Only default if nothing was specified
        setFormData(prev => ({ ...prev, serviceId: services[0].id }));
        setSelectedService(services[0]);
      }
    }
  }, [designId, serviceIdParam, services, designOverrides]);

  useEffect(() => {
    if (formData.serviceId) {
      setSelectedService(services.find(s => s.id === formData.serviceId));
    }
  }, [formData.serviceId, services]);

  useEffect(() => {
    if (pickupParam === 'true') {
      setFormData(prev => ({ ...prev, pickupRequired: true }));
    }
  }, [pickupParam]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getAIRecommendation = async () => {
    setAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Based on the user description: "${userSizeInfo || 'Standard Medium size'}", suggest logical tailoring measurements for a women's ${formData.serviceId} in inches. 
      Return a JSON object with these EXACT keys: bust, waist, hips, length, shoulder. 
      The values must be numbers represented as strings.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const text = response.text || "{}";
      const recs = JSON.parse(text);
      
      setFormData(prev => ({
        ...prev,
        measurements: {
          bust: recs.bust?.toString() || prev.measurements.bust,
          waist: recs.waist?.toString() || prev.measurements.waist,
          hips: recs.hips?.toString() || prev.measurements.hips,
          length: recs.length?.toString() || prev.measurements.length,
          shoulder: recs.shoulder?.toString() || prev.measurements.shoulder
        }
      }));
      setShowAiPrompt(false);
    } catch (err) {
      console.error("AI Recommendation Error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Must be logged in");

      const path = 'orders';
      const orderRef = await addDoc(collection(db, path), {
        ...formData,
        customerId: user.uid,
        customerName: user.displayName,
        status: 'pending',
        paymentStatus: 'pending',
        totalPrice: (selectedService?.basePrice || 0) + (formData.designPrice || 0) + (formData.pickupRequired ? 100 : 0),
        materialCost: formData.designPrice || 0,
        serviceCost: selectedService?.basePrice || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send notification email
      try {
        await fetch('/api/notify-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: user.displayName || 'Customer',
            customerEmail: user.email,
            orderId: orderRef.id,
            date: new Date().toLocaleDateString('en-IN'),
            serviceName: selectedService?.name || 'Tailoring Service',
            measurements: formData.measurements
          })
        });
      } catch (notifyErr) {
        console.error("Notification error:", notifyErr);
      }

      navigate(`/payment?orderId=${orderRef.id}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const measurementGroups = [
    {
      title: "Upper Body",
      icon: <MoveVertical className="w-5 h-5 text-natural-gold" />,
      fields: [
        { key: 'shoulder', label: 'Shoulder', icon: <MoveHorizontal className="w-3 h-3" /> },
        { key: 'bust', label: 'Bust', icon: <Circle className="w-3 h-3" /> },
        { key: 'length', label: 'Full Length', icon: <MoveVertical className="w-3 h-3" /> },
      ]
    },
    {
      title: "Mid & Lower Body",
      icon: <CircleDot className="w-5 h-5 text-natural-gold" />,
      fields: [
        { key: 'waist', label: 'Waist', icon: <CircleDot className="w-3 h-3" /> },
        { key: 'hips', label: 'Hips', icon: <CircleDashed className="w-3 h-3" /> },
      ]
    }
  ];

  return (
    <div className="container mx-auto px-6 py-20 max-w-2xl min-h-[80vh]">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-serif font-bold text-natural-text mb-2">{t('booking.title')}</h1>
        <div className="flex items-center justify-center gap-4 mt-8">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 w-16 rounded-full transition-all ${step >= i ? 'bg-natural-gold' : 'bg-natural-gold/10'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-serif font-bold text-natural-text">{t('booking.select_service')}</h2>
            <div className="grid grid-cols-1 gap-4">
              {services.map(s => (
                <button
                  key={s.id}
                  onClick={() => { setFormData({ ...formData, serviceId: s.id }); setStep(2); }}
                  className={`p-6 rounded-2xl border-2 text-left transition-all group ${
                    formData.serviceId === s.id ? 'border-natural-gold bg-natural-gold/5' : 'border-natural-gold/10 hover:border-natural-gold/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-serif font-bold text-natural-text block">{s.name}</span>
                      <span className="text-[10px] font-bold text-natural-gold uppercase tracking-widest">{s.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-natural-text/40 block font-bold uppercase mb-1">Stitching from</span>
                      <span className="text-xl font-bold text-natural-peach">₹{s.basePrice}</span>
                    </div>
                  </div>
                </button>
              ))}
              {services.length === 0 && <div className="text-center py-10 text-natural-text/40 animate-pulse">Loading bespoke options...</div>}
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-serif font-bold text-natural-text">{t('booking.measurements')}</h2>
                <button 
                  onClick={() => setShowAiPrompt(!showAiPrompt)}
                  className="flex items-center gap-2 px-4 py-2 bg-natural-gold text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-natural-gold/90 transition-all shadow-lg shadow-natural-gold/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Smart Size Recs
                </button>
              </div>

              <AnimatePresence>
                {showAiPrompt && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-natural-gold/5 rounded-[32px] border border-natural-gold/10 space-y-4">
                      <p className="text-xs font-bold text-natural-text/60 uppercase tracking-widest">How do you usually fit?</p>
                      <input 
                        type="text"
                        value={userSizeInfo}
                        onChange={(e) => setUserSizeInfo(e.target.value)}
                        placeholder="e.g., I'm 5'4, usually wear size M, slim build"
                        className="w-full px-5 py-3 rounded-2xl bg-white border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 transition-all text-natural-text text-sm"
                      />
                      <button 
                        onClick={getAIRecommendation}
                        disabled={aiLoading}
                        className="w-full py-4 bg-natural-gold text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl shadow-natural-gold/10 flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {aiLoading ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Generate Measurements
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-8">
              {measurementGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-natural-gold/10">
                    <div className="p-2 bg-natural-gold/5 rounded-xl">
                      {group.icon}
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-natural-text/60">{group.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {group.fields.map(field => (
                      <div key={field.key}>
                        <div className="flex items-center gap-2 mb-2 ml-1">
                          <span className="text-natural-gold/50">{field.icon}</span>
                          <label className="text-xs font-bold text-natural-text/80 uppercase tracking-tighter">{field.label} (inches)</label>
                        </div>
                        <input
                          type="number"
                          step="0.5"
                          value={formData.measurements[field.key as keyof typeof formData.measurements]}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            measurements: { ...formData.measurements, [field.key]: e.target.value }
                          })}
                          placeholder="00.0"
                          className="w-full px-5 py-3 rounded-2xl border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 font-sans bg-natural-subtle/30 text-natural-text transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between pt-8">
              <button onClick={() => setStep(1)} className="flex items-center gap-2 text-natural-gold font-bold">
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <button onClick={() => setStep(3)} className="bg-natural-gold text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-natural-gold/20 flex items-center gap-2">
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-serif font-bold text-natural-text">Service Details & Reference</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-natural-gold/5 rounded-2xl border border-natural-gold/10">
                <input 
                  type="checkbox" 
                  id="pickup" 
                  checked={formData.pickupRequired}
                  onChange={(e) => setFormData({ ...formData, pickupRequired: e.target.checked })}
                  className="w-5 h-5 rounded accent-natural-gold"
                />
                <label htmlFor="pickup" className="text-sm font-bold text-natural-text uppercase tracking-widest">Request Home Pickup (+₹100)</label>
              </div>

              {formData.pickupRequired && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-2 ml-1">Pickup Address (Within 15km Only)</label>
                  <textarea
                    placeholder="Enter your full address in Tuni/Suravaram area..."
                    className="w-full p-4 rounded-2xl border border-natural-gold/10 h-24 focus:outline-none focus:ring-2 focus:ring-natural-gold/20 font-sans bg-white"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    required={formData.pickupRequired}
                  />
                </motion.div>
              )}

              <div className="space-y-2">
                <label className="block text-xs font-bold text-natural-text/40 uppercase tracking-widest ml-1">Reference Image (Optional)</label>
                <div 
                  onClick={() => document.getElementById('image-upload')?.click()}
                  className="w-full aspect-video bg-natural-subtle border-2 border-dashed border-natural-gold/20 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:border-natural-gold/40 transition-all overflow-hidden"
                >
                  {formData.image ? (
                    <img src={formData.image} alt="Reference" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Sparkles className="w-12 h-12 text-natural-gold/30 mb-4" />
                      <p className="text-natural-text/60 font-medium text-sm">Click to upload reference image</p>
                    </>
                  )}
                  <input 
                    id="image-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-natural-text/40 uppercase tracking-widest ml-1">Additional Instructions</label>
                <textarea
                  placeholder="Any special instructions for the tailor?"
                  className="w-full p-4 rounded-2xl border border-natural-gold/10 h-24 focus:outline-none focus:ring-2 focus:ring-natural-gold/20 font-sans"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            
            <div className="p-6 bg-natural-subtle rounded-2xl border border-natural-gold/10">
              <div className="flex justify-between items-center mb-2">
                <span className="font-serif font-bold text-natural-text">Base Stitching Fee ({selectedService?.name})</span>
                <span className="font-bold text-natural-gold">+₹{selectedService?.basePrice || 0}</span>
              </div>
              {formData.designPrice > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="font-serif font-bold text-natural-text">Material Cost ({formData.designName})</span>
                  <span className="font-bold text-natural-gold">+₹{formData.designPrice}</span>
                </div>
              )}
              <div className="flex justify-between items-center mb-2 text-[10px] text-natural-text/40 italic">
                <span>* Final price may vary based on embroidery and fabric choices</span>
              </div>
              {formData.pickupRequired && (
                <div className="flex justify-between items-center mb-2 text-natural-peach">
                  <span className="font-serif font-bold">Priority Pickup</span>
                  <span className="font-bold">₹100</span>
                </div>
              )}
              <div className="border-t border-natural-gold/20 mt-4 pt-4 flex justify-between items-center">
                <span className="text-xl font-serif font-bold text-natural-text">Estimated Total</span>
                <span className="text-xl font-bold text-natural-peach">₹{(selectedService?.basePrice || 0) + (formData.designPrice || 0) + (formData.pickupRequired ? 100 : 0)}</span>
              </div>
            </div>

            <div className="flex justify-between pt-8">
              <button onClick={() => setStep(2)} className="flex items-center gap-2 text-natural-gold font-bold">
                <ArrowLeft className="w-5 h-5" /> Back
              </button>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="bg-natural-text text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-natural-text/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-6 h-6" />
                {loading ? 'Processing...' : 'Confirm Order'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
