import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  ArrowLeft, 
  Package, 
  User, 
  Ruler, 
  FileText, 
  IndianRupee, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Star,
  Scissors,
  Sparkles,
  Edit2,
  Save,
  Image as ImageIcon,
  QrCode
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { DESIGNS } from './DesignGallery';
import { QRCodeSVG } from 'qrcode.react';

interface Order {
  id: string;
  customerId?: string;
  serviceId?: string;
  status: string;
  totalPrice?: number;
  serviceCost?: number;
  materialCost?: number;
  pickupRequired?: boolean;
  designName?: string;
  measurements?: Record<string, string>;
  notes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [designOverrides, setDesignOverrides] = useState<Record<string, number>>({});
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [editingCosts, setEditingCosts] = useState(false);
  const [costs, setCosts] = useState({
    serviceCost: 0,
    materialCost: 0,
    totalPrice: 0
  });
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const isTailor = role === 'tailor' || role === 'admin';

  useEffect(() => {
    const checkFeedback = async () => {
      if (!id || isTailor) return;
      try {
        const q = query(collection(db, 'feedbacks'), where('orderId', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFeedbackSubmitted(true);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'feedbacks');
      }
    };
    checkFeedback();
  }, [id, isTailor]);

  useEffect(() => {
    if (order) {
      setCosts({
        serviceCost: order.serviceCost || 0,
        materialCost: order.materialCost || 0,
        totalPrice: order.totalPrice || 0
      });
    }
  }, [order]);

  const handleUpdateCosts = async () => {
    if (!id || !order) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', id), {
        serviceCost: costs.serviceCost,
        materialCost: costs.materialCost,
        totalPrice: costs.totalPrice,
        updatedAt: serverTimestamp()
      });
      setOrder({ ...order, ...costs });
      setEditingCosts(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const user = auth.currentUser;
        let isTailorUser = false;
        
        const [orderDoc, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'orders', id)),
          getDoc(doc(db, 'settings', 'payment'))
        ]);

        if (settingsSnap.exists()) {
          setPaymentSettings(settingsSnap.data());
        }

        if (user) {
          const uDoc = await getDoc(doc(db, 'users', user.uid));
          isTailorUser = (uDoc.data()?.role === 'tailor' || uDoc.data()?.role === 'admin' || user.email === 'mekalamanojkumar6@gmail.com');
          setRole(isTailorUser ? 'tailor' : 'customer');

          if (isTailorUser) {
            const oSnap = await getDocs(collection(db, 'design_overrides'));
            const overrides: Record<string, number> = {};
            oSnap.docs.forEach(doc => {
              overrides[doc.id] = doc.data().price;
            });
            setDesignOverrides(overrides);
          }
        }

        if (!orderDoc.exists()) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        const data = orderDoc.data();
        const orderData: Order = { 
          id: orderDoc.id, 
          status: data.status || 'pending',
          ...data 
        };
        setOrder(orderData);

        // Fetch customer details if order has customerId
        if (orderData.customerId) {
          try {
            const customerDoc = await getDoc(doc(db, 'users', orderData.customerId));
            if (customerDoc.exists()) {
              setCustomer(customerDoc.data());
            }
          } catch (cErr) {
            console.error("Customer fetch error:", cErr);
            // Non-blocking for details view, but tailor should probably see it
            if (isTailor) handleFirestoreError(cErr, OperationType.GET, `users/${orderData.customerId}`);
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `orders/${id}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-natural-gold/20 border-t-natural-gold rounded-full animate-spin" />
          <p className="text-natural-gold font-medium">Loading Order Details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center container mx-auto px-6">
        <div className="text-center p-12 bg-white rounded-[40px] border border-natural-gold/10 shadow-2xl max-w-md w-full">
          <AlertCircle className="w-16 h-16 text-natural-peach mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold text-natural-text mb-4">{error || 'Something went wrong'}</h2>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-natural-gold text-white rounded-full font-bold shadow-lg shadow-natural-gold/20"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in-progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-natural-pink/30 text-natural-peach border-natural-gold/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order || !id) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'orders', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setOrder({ ...order, status: newStatus });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    } finally {
      setUpdating(false);
    }
  };

  const statusOptions = ['pending', 'paid', 'received', 'cutting', 'stitching', 'finishing', 'ready', 'delivered'];

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-3 bg-white border border-natural-gold/10 rounded-2xl text-natural-gold hover:bg-natural-gold hover:text-white transition-all shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm font-bold text-natural-gold/60 uppercase tracking-widest">Order ID</span>
              <span className="font-mono text-sm bg-natural-subtle px-2 py-0.5 rounded border border-natural-gold/5">#{order.id}</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-natural-text">Order Details</h1>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 px-6 py-2 rounded-full border text-sm font-bold uppercase tracking-wider self-start md:self-center",
          getStatusColor(order.status)
        )}>
          {getStatusIcon(order.status)}
          {order.status}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Timeline */}
          <OrderTimeline currentStatus={order.status} />

          {/* Service Information */}
          <section className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Package className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-natural-subtle rounded-2xl text-natural-gold">
                  <Package className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-natural-text">Service Information</h2>
              </div>
              {isTailor && !editingCosts && (
                <button 
                  onClick={() => setEditingCosts(true)}
                  className="p-2 text-natural-gold hover:bg-natural-gold/10 rounded-xl transition-all"
                  title="Edit Prices"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              )}
            </div>

            {editingCosts ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Service Cost (₹)</label>
                    <input 
                      type="number"
                      value={costs.serviceCost}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCosts(prev => ({ ...prev, serviceCost: val, totalPrice: val + prev.materialCost + (order.pickupRequired ? 100 : 0) }));
                      }}
                      className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/20 focus:ring-4 focus:ring-natural-gold/5 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Material Cost (₹)</label>
                    <input 
                      type="number"
                      value={costs.materialCost}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setCosts(prev => ({ ...prev, materialCost: val, totalPrice: prev.serviceCost + val + (order.pickupRequired ? 100 : 0) }));
                      }}
                      className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/20 focus:ring-4 focus:ring-natural-gold/5 outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Total Price (₹)</label>
                    <div className="px-4 py-3 bg-natural-gold text-white rounded-xl border border-natural-gold/20 font-bold text-lg">
                      ₹{costs.totalPrice}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => {
                      setEditingCosts(false);
                      setCosts({
                        serviceCost: order.serviceCost || 0,
                        materialCost: order.materialCost || 0,
                        totalPrice: order.totalPrice || 0
                      });
                    }}
                    className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-natural-text/40"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateCosts}
                    disabled={updating}
                    className="px-8 py-2 bg-natural-gold text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-natural-gold/20 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" /> {updating ? "Saving..." : "Save Prices"}
                  </button>
                </div>

                {/* Reference Gallery toggle or section could go here too, but let's put it below the info */}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-1">Service Type</p>
                  <p className="text-xl font-medium text-natural-text capitalize">{order.serviceId || 'Standard Stitching'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-1">Total Price</p>
                  <div className="flex items-center gap-1 text-2xl font-bold text-natural-peach">
                    <IndianRupee className="w-5 h-5" />
                    {order.totalPrice}
                  </div>
                </div>
              </div>
            )}
            {/* Price Breakdown */}
            <div className="mt-8 pt-8 border-t border-natural-gold/5 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-1">Service Fee</p>
                <p className="text-lg font-bold text-natural-text">₹{order.serviceCost || (order.totalPrice! - (order.pickupRequired ? 100 : 0) - (order.materialCost || 0))}</p>
              </div>
              {order.materialCost ? (
                <div>
                  <p className="text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-1">Material ({order.designName || 'Design'})</p>
                  <p className="text-lg font-bold text-natural-text">₹{order.materialCost}</p>
                </div>
              ) : null}
              {order.pickupRequired ? (
                <div>
                  <p className="text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-1">Pickup Fee</p>
                  <p className="text-lg font-bold text-natural-peach">₹100</p>
                </div>
              ) : null}
            </div>
          </section>

          {/* Measurements */}
          <section className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-natural-subtle rounded-2xl text-natural-gold">
                <Ruler className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-natural-text">Measurements</h2>
            </div>
            {order.measurements ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {Object.entries(order.measurements).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-4 bg-natural-subtle/50 rounded-2xl border border-natural-gold/5">
                    <p className="text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-1">{key}</p>
                    <p className="text-lg font-bold text-natural-text">{value} <span className="text-sm font-medium opacity-40">in</span></p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-natural-text/40 italic">No measurements recorded for this order.</p>
            )}
          </section>

          {/* Notes */}
          <section className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-natural-subtle rounded-2xl text-natural-gold">
                <FileText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-natural-text">Special Instructions</h2>
            </div>
            <div className="p-6 bg-natural-subtle/30 rounded-3xl border border-natural-gold/5 min-h-[100px]">
              <p className="text-natural-text/70 leading-relaxed italic">
                {order.notes ? `"${order.notes}"` : 'No special instructions provided.'}
              </p>
            </div>
          </section>

          {/* Reference Design Gallery for Tailor */}
          {isTailor && (
            <section className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-natural-gold rounded-2xl text-white">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-natural-text">Design Reference</h2>
                  <p className="text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mt-1">Collections to help with pricing</p>
                </div>
              </div>
              
              <div className="space-y-8 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                {['Blouses', 'Chudidars', 'Lehengas'].map(cat => (
                  <div key={cat} className="space-y-4">
                    <h3 className="text-sm font-bold text-natural-gold uppercase tracking-[0.2em] flex items-center gap-2">
                       <span className="w-4 h-[1px] bg-natural-gold/30" />
                       {cat}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {DESIGNS.filter(d => d.mainCategory === cat).map(design => (
                        <div key={design.id} className="group relative aspect-square rounded-xl overflow-hidden border border-natural-gold/10">
                          <img 
                            src={design.image} 
                            alt={design.name_en} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1.5 translate-y-full group-hover:translate-y-0 transition-transform">
                            <p className="text-[8px] font-bold text-white uppercase tracking-tighter truncate">{design.name_en}</p>
                            <p className="text-[9px] font-bold text-natural-gold">₹{designOverrides[design.id] || design.price}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column - Customer & Timeline */}
        <div className="space-y-8">
          {/* Tailor Control Panel */}
          {isTailor && (
            <section className="bg-natural-gold/5 p-8 rounded-[40px] border border-natural-gold/20 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-natural-gold rounded-2xl text-white">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-natural-text">Tailor Actions</h2>
              </div>
              <div className="space-y-4">
                {['pending', 'paid'].includes(order.status) && (
                  <button 
                    onClick={() => handleUpdateStatus('received')}
                    disabled={updating}
                    className="w-full px-6 py-4 bg-natural-gold text-white rounded-3xl text-sm font-bold uppercase tracking-widest shadow-2xl shadow-natural-gold/30 flex items-center justify-center gap-3 active:scale-95 transition-all mb-4"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    Accept Order
                  </button>
                )}
                <p className="text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-2">Set Live Status</p>
                <div className="grid grid-cols-1 gap-2">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      disabled={updating || order.status === status}
                      onClick={() => handleUpdateStatus(status)}
                      className={cn(
                        "w-full px-6 py-3 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all border-2",
                        order.status === status
                          ? "bg-natural-gold text-white border-natural-gold shadow-lg shadow-natural-gold/20"
                          : "bg-white text-natural-gold border-natural-gold/10 hover:border-natural-gold"
                      )}
                    >
                      {status.replace('-', ' ')}
                    </button>
                  ))}
                </div>
                {updating && (
                  <p className="text-center text-[10px] text-natural-gold animate-pulse font-bold mt-4 uppercase">Updating Status...</p>
                )}
              </div>
            </section>
          )}

          {/* Customer Information */}
          <section className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-natural-subtle rounded-2xl text-natural-gold">
                <User className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-natural-text">Customer</h2>
            </div>
            {customer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-natural-pink/30 rounded-full flex items-center justify-center text-natural-peach font-bold text-xl">
                    {customer.displayName?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="font-bold text-natural-text">{customer.displayName || 'Unnamed User'}</p>
                    <p className="text-sm text-natural-text/40">{customer.email}</p>
                  </div>
                </div>
                {customer.phone && (
                  <div className="pt-4 border-t border-natural-gold/5">
                    <p className="text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-1">Phone</p>
                    <p className="text-sm font-medium text-natural-text">{customer.phone}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-natural-text/40 italic">Loading customer info...</p>
            )}
          </section>

          {/* Timing */}
          <section className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-natural-subtle rounded-2xl text-natural-gold">
                <Clock className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-natural-text">History</h2>
            </div>
            <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-natural-gold/10">
              <div className="relative pl-10">
                <div className="absolute left-0 top-1.5 w-[30px] h-[30px] bg-white border-2 border-natural-gold rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-natural-gold rounded-full" />
                </div>
                <p className="text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-1">Order Created</p>
                <p className="text-sm font-bold text-natural-text">
                  {order.createdAt?.toDate().toLocaleDateString('en-IN', { dateStyle: 'long' })}
                </p>
              </div>
              {order.updatedAt && (
                <div className="relative pl-10">
                  <div className="absolute left-0 top-1.5 w-[30px] h-[30px] bg-white border-2 border-natural-gold/20 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-natural-gold/20 rounded-full" />
                  </div>
                  <p className="text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-1">Last Updated</p>
                  <p className="text-sm font-medium text-natural-text/60">
                    {order.updatedAt?.toDate().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              )}
            </div>
            {!isTailor && order.status === 'pending' && (
              <div className="mt-8 pt-8 border-t border-natural-gold/5">
                {(() => {
                  const createdAt = order.createdAt?.toDate();
                  const now = new Date();
                  const hoursSinceCreation = createdAt ? (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60) : 0;
                  const canCancel = hoursSinceCreation < 24;

                  if (!canCancel) {
                    return (
                      <p className="text-[10px] text-center text-red-400 font-bold uppercase tracking-widest bg-red-50 p-4 rounded-xl border border-red-100">
                        Cancellation period (24h) has expired. Please contact the boutique directly.
                      </p>
                    );
                  }

                  return (
                    <>
                      {!showCancelConfirm ? (
                        <button 
                          onClick={() => setShowCancelConfirm(true)}
                          className="w-full py-4 border-2 border-red-100 text-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-red-50 transition-all"
                        >
                          Cancel Order
                        </button>
                      ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <p className="text-center text-xs font-bold text-red-500 uppercase tracking-widest">Are you sure? This cannot be undone.</p>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setShowCancelConfirm(false)}
                              className="flex-1 py-3 bg-natural-subtle text-natural-text/60 rounded-xl text-[10px] font-bold uppercase tracking-widest"
                            >
                              No, Keep It
                            </button>
                            <button 
                              onClick={() => {
                                handleUpdateStatus('cancelled');
                                setShowCancelConfirm(false);
                              }}
                              disabled={updating}
                              className="flex-1 py-3 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20"
                            >
                              {updating ? "Cancelling..." : "Yes, Cancel"}
                            </button>
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-center text-natural-text/30 mt-3 uppercase tracking-tighter">
                        Cancellation is only available within 24 hours of placing the order.
                      </p>
                    </>
                  );
                })()}
              </div>
            )}
          </section>

          {/* Payment Section for Customer */}
          {!isTailor && ['pending', 'ready', 'received'].includes(order.status) && (paymentSettings?.upiId || (paymentSettings?.accountNumber && paymentSettings?.ifscCode)) && (
             <section className="bg-natural-gold text-white p-8 rounded-[40px] border border-natural-gold shadow-2xl shadow-natural-gold/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <QrCode className="w-24 h-24" />
                </div>
                <h2 className="text-2xl font-serif font-bold mb-2">Secure Payment</h2>
                <p className="text-xs font-bold uppercase tracking-widest opacity-60 mb-8">Pay via UPI or Bank Transfer</p>
                
                {(() => {
                  const effectiveUpiId = paymentSettings?.upiId || (paymentSettings?.accountNumber && paymentSettings?.ifscCode ? `${paymentSettings.accountNumber}@${paymentSettings.ifscCode.toUpperCase()}.ifsc.npci` : '');
                  if (!effectiveUpiId) return null;
                  
                  return (
                    <div className="bg-white p-6 rounded-3xl mx-auto inline-block relative z-10 mb-8">
                      <QRCodeSVG 
                        value={`upi://pay?pa=${effectiveUpiId}&pn=TailorHer&am=${order.totalPrice}&cu=INR&tn=Order_${order.id.slice(0, 8)}`} 
                        size={200}
                        level="H"
                      />
                    </div>
                  );
                })()}
                
                <div className="space-y-4 relative z-10">
                   <div className="flex justify-between items-center bg-white/10 p-3 rounded-2xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Amount to Pay</span>
                      <span className="text-lg font-bold">₹{order.totalPrice}</span>
                   </div>
                   
                   {paymentSettings?.upiId && (
                     <div className="flex justify-between items-center bg-white/10 p-3 rounded-2xl">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">UPI ID</span>
                        <span className="text-xs font-bold">{paymentSettings.upiId}</span>
                     </div>
                   )}

                   {paymentSettings?.accountNumber && (
                     <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 text-center mb-2 italic">Bank Transfer Option</p>
                        <div className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl">
                           <span className="text-[8px] font-bold uppercase opacity-50">Account Number</span>
                           <span className="text-[10px] font-mono font-bold tracking-wider">{paymentSettings.accountNumber}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl">
                           <span className="text-[8px] font-bold uppercase opacity-50">IFSC Code</span>
                           <span className="text-[10px] font-mono font-bold tracking-wider">{paymentSettings.ifscCode}</span>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl">
                           <span className="text-[8px] font-bold uppercase opacity-50">Bank Name</span>
                           <span className="text-[10px] font-bold">{paymentSettings.bankName}</span>
                        </div>
                     </div>
                   )}
                </div>
                
                <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest opacity-60">
                   After paying, please notify us for confirmation
                </p>
             </section>
          )}

          {/* Feedback Section */}
          {!isTailor && order.status === 'delivered' && (
            <section className="bg-natural-peach/5 p-8 rounded-[40px] border border-natural-peach/20 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-natural-peach rounded-2xl text-white">
                  <Star className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-natural-text">Review Experience</h2>
              </div>
              
              {!feedbackSubmitted ? (
                <FeedbackForm 
                  orderId={id!} 
                  customerId={auth.currentUser?.uid!} 
                  customerName={auth.currentUser?.displayName || 'Customer'} 
                  onSuccess={() => setFeedbackSubmitted(true)}
                />
              ) : (
                <div className="text-center py-6 bg-white rounded-3xl border border-natural-peach/10">
                  <p className="text-natural-peach font-bold text-lg mb-2">Review Submitted ✨</p>
                  <p className="text-sm text-natural-text/60">Thank you for your valuable feedback.</p>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ currentStatus }: { currentStatus: string }) {
  const steps = [
    { key: 'pending', label: 'Placed' },
    { key: 'received', label: 'Received' },
    { key: 'stitching', label: 'Stitching' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivered', label: 'Delivered' }
  ];

  const statusToStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending' || s === 'paid') return 0;
    if (s === 'received' || s === 'cutting') return 1;
    if (s === 'stitching') return 2;
    if (s === 'finishing' || s === 'ready') return 3;
    if (s === 'delivered') return 4;
    return -1;
  };

  const currentIndex = statusToStepIndex(currentStatus);
  const isCancelled = currentStatus.toLowerCase() === 'cancelled';

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[30px] p-8 flex items-center gap-6 animate-in fade-in zoom-in duration-500">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-red-900 font-serif font-bold text-lg">Order Cancelled</h3>
          <p className="text-red-600/70 text-sm">This order was cancelled by the customer or store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-sm">
      <div className="relative flex items-center justify-between pb-4">
        {/* Progress Line Background */}
        <div className="absolute left-[5%] right-[5%] top-[20px] h-[2px] bg-natural-subtle rounded-full" />
        
        {/* Active Progress Line */}
        {currentIndex >= 0 && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(currentIndex / (steps.length - 1)) * 90}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute left-[5%] top-[20px] h-[2px] bg-natural-gold rounded-full z-0"
          />
        )}
        
        {/* Steps */}
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
          return (
            <div key={step.key} className="relative flex flex-col items-center z-10 w-1/5">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                isActive 
                  ? "bg-natural-gold border-white text-white shadow-lg shadow-natural-gold/20" 
                  : "bg-white border-natural-subtle text-natural-text/20"
              )}>
                {index < currentIndex ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  index === 0 ? <Clock className="w-5 h-5" /> :
                  index === 1 ? <Package className="w-5 h-5" /> :
                  index === 2 ? <Scissors className="w-5 h-5" /> :
                  index === 3 ? <Sparkles className="w-5 h-5" /> :
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="mt-3 text-center">
                <p className={cn(
                  "text-[9px] uppercase font-bold tracking-[0.2em] transition-colors",
                  isActive ? "text-natural-gold" : "text-natural-text/20",
                  isCurrent && "animate-pulse"
                )}>
                  {step.label}
                </p>
                {isCurrent && (
                  <div className="mt-1 w-1 h-1 bg-natural-gold rounded-full mx-auto" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FeedbackForm({ orderId, customerId, customerName, onSuccess }: { orderId: string, customerId: string, customerName: string, onSuccess: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        orderId,
        customerId,
        customerName,
        rating,
        comment,
        createdAt: serverTimestamp()
      });
      onSuccess();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'feedbacks');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className={cn(
              "w-12 h-12 flex items-center justify-center rounded-2xl transition-all scale-100 active:scale-90",
              rating >= star ? "bg-natural-peach text-white shadow-lg shadow-natural-peach/20" : "bg-white text-natural-peach/30 border border-natural-peach/10"
            )}
          >
            <Star className={cn("w-6 h-6", rating >= star ? "fill-current" : "")} />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was the fit and finish? / ఫిట్టింగ్ మరియు ఫినిషింగ్ ఎలా ఉంది?"
        className="w-full px-6 py-4 rounded-3xl border border-natural-peach/10 focus:outline-none focus:ring-4 focus:ring-natural-peach/5 transition-all text-natural-text text-sm min-h-[120px] bg-white"
        required
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-5 bg-natural-peach text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-natural-peach/20 hover:bg-natural-peach/90 active:scale-95 disabled:opacity-50 transition-all"
      >
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}
