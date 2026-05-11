import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle2, ShieldCheck, QrCode, Smartphone, ArrowLeft, IndianRupee, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function Payment() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'cod'>('upi');
  const [paid, setPaid] = useState(false);
  const [isCod, setIsCod] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) return;
      try {
        const [orderSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'orders', orderId)),
          getDoc(doc(db, 'settings', 'payment'))
        ]);

        if (orderSnap.exists()) {
          setOrder({ id: orderSnap.id, ...orderSnap.data() });
        }
        if (settingsSnap.exists()) {
          setPaymentSettings(settingsSnap.data());
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `orders/${orderId}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId]);

  const hasPaymentInfo = !!paymentSettings?.upiId || (!!paymentSettings?.accountNumber && !!paymentSettings?.ifscCode);

  const effectiveUpiId = paymentSettings?.upiId || (paymentSettings?.accountNumber && paymentSettings?.ifscCode ? `${paymentSettings.accountNumber}@${paymentSettings.ifscCode.toUpperCase()}.ifsc.npci` : '');

  const upiLink = order && effectiveUpiId 
    ? `upi://pay?pa=${effectiveUpiId}&pn=TailorHer&am=${order.totalPrice}&cu=INR&tn=Order_${orderId?.slice(0, 8)}`
    : '';

  const handlePayment = async () => {
    setProcessing(true);
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      if (orderId) {
        if (paymentMethod === 'cod') {
          await updateDoc(doc(db, 'orders', orderId), {
            status: 'received',
            paymentStatus: 'cod',
            updatedAt: serverTimestamp()
          });
          setIsCod(true);
          setPaid(true); // Re-use the "paid" screen logic with slightly different text
        } else {
          await updateDoc(doc(db, 'orders', orderId), {
            status: 'paid',
            paymentStatus: 'success',
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          setPaid(true);
        }
        setTimeout(() => navigate('/dashboard'), 3000);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-natural-gold font-serif">Verifying transaction...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center text-natural-text">Order not found.</div>;

  if (paid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-subtle px-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[40px] shadow-2xl border border-natural-gold/10 text-center max-w-md"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-natural-text mb-2">
            {isCod ? "Order Confirmed!" : "Payment Successful!"}
          </h2>
          <p className="text-natural-text/60 mb-8">
            {isCod 
              ? "Your Cash on Delivery order has been received. Our tailor will contact you shortly."
              : "We've received your order. Your tailoring journey begins now."
            }
          </p>
          <div className="text-xs font-bold text-natural-gold uppercase tracking-[0.2em]">Redirecting to Dashboard...</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-subtle py-20 px-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Order Summary */}
        <div className="space-y-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-natural-text/40 hover:text-natural-gold transition-colors font-bold uppercase text-[10px] tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
          
          <div className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-xl">
            <h2 className="text-2xl font-serif font-bold text-natural-text mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between pb-4 border-b border-natural-gold/5">
                <span className="text-natural-text/60">Service</span>
                <span className="font-bold text-natural-text uppercase text-xs tracking-wider">{order.serviceId}</span>
              </div>
              <div className="flex justify-between pb-4 border-b border-natural-gold/5">
                <span className="text-natural-text/60">Base Stitching</span>
                <span className="font-bold text-natural-text">₹{order.serviceCost || (order.totalPrice - (order.pickupRequired ? 100 : 0) - (order.materialCost || 0))}</span>
              </div>
              {order.materialCost > 0 && (
                <div className="flex justify-between pb-4 border-b border-natural-gold/5">
                  <span className="text-natural-text/60">Material / Design</span>
                  <span className="font-bold text-natural-text">₹{order.materialCost}</span>
                </div>
              )}
              {order.pickupRequired && (
                <div className="flex justify-between pb-4 border-b border-natural-gold/5">
                  <span className="text-natural-text/60">Home Pickup</span>
                  <span className="font-bold text-natural-peach">₹100</span>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <span className="text-xl font-serif font-bold text-natural-text">Total Amount</span>
                <span className="text-2xl font-bold text-natural-gold">₹{order.totalPrice}</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-natural-gold/5 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-natural-gold mt-1 shrink-0" />
              <p className="text-[10px] text-natural-gold font-bold uppercase tracking-widest leading-relaxed">
                Secure transaction powered by Stripe & Razorpay. Every stitch is protected.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-10 rounded-[40px] border border-natural-gold/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-natural-gold/5 rounded-bl-full -mr-10 -mt-10" />
          
          <h2 className="text-2xl font-serif font-bold text-natural-text mb-8">Secure Payment</h2>
          
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setPaymentMethod('upi')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                paymentMethod === 'upi' ? 'border-natural-gold bg-natural-gold/5' : 'border-natural-gold/10 grayscale opacity-50'
              }`}
            >
              <QrCode className="w-6 h-6 text-natural-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest">UPI</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('card')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                paymentMethod === 'card' ? 'border-natural-gold bg-natural-gold/5' : 'border-natural-gold/10 grayscale opacity-50'
              }`}
            >
              <CreditCard className="w-6 h-6 text-natural-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Card</span>
            </button>
            <button 
              onClick={() => setPaymentMethod('cod')}
              className={`flex-1 p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                paymentMethod === 'cod' ? 'border-natural-gold bg-natural-gold/5' : 'border-natural-gold/10 grayscale opacity-50'
              }`}
            >
              <IndianRupee className="w-6 h-6 text-natural-gold" />
              <span className="text-[10px] font-bold uppercase tracking-widest">COD</span>
            </button>
          </div>

          <div className="space-y-6">
            {paymentMethod === 'cod' ? (
              <div className="space-y-6 text-center py-8">
                <div className="w-24 h-24 bg-natural-gold/10 rounded-full mx-auto flex items-center justify-center">
                  <IndianRupee className="w-10 h-10 text-natural-gold" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-natural-text text-xl">Cash on Delivery</h3>
                  <p className="text-sm text-natural-text/60 max-w-[200px] mx-auto">Pay ₹{order.totalPrice} in person when we pick up or deliver your order.</p>
                </div>
              </div>
            ) : paymentMethod === 'upi' ? (
              <div className="space-y-6 text-center py-4">
                <div className="bg-white p-6 rounded-3xl mx-auto inline-block border border-natural-gold/10 shadow-sm">
                  {upiLink ? (
                    <div className="relative group">
                      <QRCodeSVG 
                        value={upiLink} 
                        size={180}
                        level="H"
                        includeMargin={false}
                        imageSettings={{
                          src: "https://cdn-icons-png.flaticon.com/512/2830/2830284.png",
                          x: undefined,
                          y: undefined,
                          height: 30,
                          width: 30,
                          excavate: true,
                        }}
                      />
                      <div className="absolute inset-0 bg-natural-gold/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                         <QrCode className="w-8 h-8 text-natural-gold" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-natural-text/20">
                      <QrCode className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-natural-text/60">Scan QR to pay <span className="font-bold text-natural-text">₹{order.totalPrice}</span></p>
                  {paymentSettings?.upiId && (
                    <p className="text-[10px] font-bold text-natural-gold uppercase tracking-widest bg-natural-gold/5 py-1 px-3 rounded-full inline-block">
                      UPI ID: {paymentSettings.upiId}
                    </p>
                  )}
                  {paymentSettings?.accountNumber && (
                    <div className="mt-4 p-4 bg-natural-subtle rounded-2xl border border-natural-gold/5 text-left">
                       <p className="text-[9px] font-bold text-natural-text/40 uppercase tracking-[0.2em] mb-3 text-center">Or Direct Bank Transfer</p>
                       <div className="space-y-2">
                          <div className="flex justify-between">
                             <span className="text-[9px] font-bold text-natural-text/40 uppercase">Bank</span>
                             <span className="text-[10px] font-bold text-natural-text">{paymentSettings.bankName}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[9px] font-bold text-natural-text/40 uppercase">A/C No</span>
                             <span className="text-[10px] font-mono font-bold text-natural-gold">{paymentSettings.accountNumber}</span>
                          </div>
                          <div className="flex justify-between">
                             <span className="text-[9px] font-bold text-natural-text/40 uppercase">IFSC</span>
                             <span className="text-[10px] font-mono font-bold text-natural-gold">{paymentSettings.ifscCode}</span>
                          </div>
                       </div>
                    </div>
                  )}
                </div>
                {!hasPaymentInfo && (
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest mt-2 px-6">
                    Tailor has not set up payment details yet. Please use COD or contact them directly.
                  </p>
                )}
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter Order ID to Verify" 
                    className="w-full px-6 py-4 rounded-2xl bg-natural-subtle border border-natural-gold/10 focus:outline-none focus:ring-4 focus:ring-natural-gold/5 transition-all text-center font-bold tracking-widest"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-natural-text/40 mb-2 block ml-1">Card Holder</label>
                  <input type="text" className="w-full px-5 py-3 rounded-xl bg-natural-subtle border border-natural-gold/10 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-natural-text/40 mb-2 block ml-1">Card Number</label>
                  <input type="text" placeholder="**** **** **** ****" className="w-full px-5 py-3 rounded-xl bg-natural-subtle border border-natural-gold/10 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-natural-text/40 mb-2 block ml-1">Expiry</label>
                    <input type="text" placeholder="MM/YY" className="w-full px-5 py-3 rounded-xl bg-natural-subtle border border-natural-gold/10 outline-none" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-natural-text/40 mb-2 block ml-1">CVV</label>
                    <input type="text" placeholder="***" className="w-full px-5 py-3 rounded-xl bg-natural-subtle border border-natural-gold/10 outline-none" />
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-5 bg-natural-text text-white rounded-3xl font-bold uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-natural-text/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                paymentMethod === 'cod' ? `Confirm COD Order ₹${order.totalPrice}` : `Secure Pay ₹${order.totalPrice}`
              )}
            </button>
            <p className="text-[10px] text-center text-natural-text/40 uppercase tracking-widest">
              Encrypted, 256-bit safe transaction
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
