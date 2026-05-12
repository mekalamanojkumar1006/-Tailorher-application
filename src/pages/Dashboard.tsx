import { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';
import { Package, Clock, CheckCircle2, User as UserIcon, Eye, Star, Settings, DollarSign, Plus, Save, IndianRupee, Image as ImageIcon, QrCode } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DESIGNS } from './DesignGallery';
import { QRCodeSVG } from 'qrcode.react';

export function Dashboard() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'services' | 'feedbacks' | 'settings'>('orders');
  const [editingPrice, setEditingPrice] = useState<{id: string, price: number} | null>(null);
  const [editingDesignPrice, setEditingDesignPrice] = useState<{id: string, price: number} | null>(null);
  const [designOverrides, setDesignOverrides] = useState<Record<string, number>>({});
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: '', basePrice: 0, category: 'Blouse' });
  const [paymentSettings, setPaymentSettings] = useState({ 
    upiId: '', 
    bankName: 'North East Small Finance Bank', 
    accountNumber: '033325221948854', 
    ifscCode: 'NESF0000333' 
  });

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;

    const fetchDashboard = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const uDoc = await getDoc(doc(db, 'users', user.uid));
        const data = uDoc.data();
        setUserData(data);
        
        const finalRole = (data?.role === 'tailor' || data?.role === 'admin' || user.email === 'mekalamanojkumar6@gmail.com') ? 'tailor' : 'customer';
        
        // Setup Real-time Orders Listener
        let q;
        if (finalRole === 'tailor') {
          q = query(collection(db, 'orders'));
          
          // One-time fetch for Feedbacks
          const fSnap = await getDocs(query(collection(db, 'feedbacks')));
          setFeedbacks(fSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));

          // One-time fetch/seed for Services
          const sSnap = await getDocs(query(collection(db, 'services')));
          const servicesData = sSnap.docs.map(d => ({ id: d.id, ...(d.data() as object) }));
          
          if (servicesData.length === 0) {
            const defaultServices = [
              { id: 'blouse-simple', name: 'Simple Blouse', basePrice: 500, category: 'Blouse' },
              { id: 'blouse-designer', name: 'Designer Blouse', basePrice: 800, category: 'Blouse' },
              { id: 'kurti', name: 'Standard Kurti', basePrice: 400, category: 'Kurti' },
              { id: 'suit-anarkali', name: 'Anarkali Suit', basePrice: 1500, category: 'Suit' },
              { id: 'suit-punjabi', name: 'Punjabi Suit', basePrice: 1200, category: 'Suit' },
              { id: 'lehenga-wedding', name: 'Wedding Lehenga', basePrice: 2500, category: 'Lehenga' },
              { id: 'lehenga-party', name: 'Party Wear Lehenga', basePrice: 1800, category: 'Lehenga' },
              { id: 'palazzo', name: 'Palazzo Pants', basePrice: 3500, category: 'Bottom Wear' },
              { id: 'skirt', name: 'Long Skirt', basePrice: 600, category: 'Bottom Wear' },
              { id: 'maggam-work', name: 'Maggam Work (Basic)', basePrice: 2000, category: 'Work' }
            ];
            for (const s of defaultServices) {
              await setDoc(doc(db, 'services', s.id), s);
            }
            setServices(defaultServices);
          } else {
            setServices(servicesData);
          }

          // Fetch Design Overrides
          const dSnap = await getDocs(query(collection(db, 'design_overrides')));
          const overrides: Record<string, number> = {};
          dSnap.docs.forEach(doc => {
            overrides[doc.id] = doc.data().price;
          });
          setDesignOverrides(overrides);

          // Fetch Payment Settings
          const pDoc = await getDoc(doc(db, 'settings', 'payment'));
          if (pDoc.exists()) {
            setPaymentSettings(prev => ({ ...prev, ...pDoc.data() }));
          } else {
            // Auto-save the details provided by the user if the record doesn't exist yet
            const initialSettings = {
              bankName: 'North East Small Finance Bank',
              accountNumber: '033325221948854',
              ifscCode: 'NESF0000333',
              upiId: '', // User didn't provide this yet
              updatedAt: serverTimestamp()
            };
            await setDoc(doc(db, 'settings', 'payment'), initialSettings);
            setPaymentSettings(prev => ({ ...prev, ...initialSettings }));
          }
        } else {
          q = query(collection(db, 'orders'), where('customerId', '==', user.uid));
        }

        unsubscribeOrders = onSnapshot(q, (snap) => {
          setOrders(snap.docs.map(d => ({ id: d.id, ...(d.data() as object) })));
        }, (err) => {
          if (auth.currentUser) {
            handleFirestoreError(err, OperationType.LIST, 'orders');
          }
        });

      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
    return () => {
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    } finally {
      setUpdating(null);
    }
  };

  const addService = async () => {
    if (!newService.name || newService.basePrice <= 0) return;
    setUpdating('adding-service');
    try {
      const id = newService.name.toLowerCase().replace(/\s+/g, '-');
      const serviceData = { ...newService, id, createdAt: serverTimestamp() };
      await setDoc(doc(db, 'services', id), serviceData);
      setServices(prev => [...prev, serviceData]);
      setShowAddService(false);
      setNewService({ name: '', basePrice: 0, category: 'Blouse' });
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const updateServicePrice = async () => {
    if (!editingPrice) return;
    setUpdating('service-' + editingPrice.id);
    try {
      await updateDoc(doc(db, 'services', editingPrice.id), {
        basePrice: Number(editingPrice.price)
      });
      setServices(prev => prev.map(s => s.id === editingPrice.id ? { ...s, basePrice: editingPrice.price } : s));
      setEditingPrice(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const updateDesignPrice = async () => {
    if (!editingDesignPrice) return;
    setUpdating('design-' + editingDesignPrice.id);
    try {
      await setDoc(doc(db, 'design_overrides', editingDesignPrice.id), {
        price: Number(editingDesignPrice.price),
        updatedAt: serverTimestamp()
      });
      setDesignOverrides(prev => ({ ...prev, [editingDesignPrice.id]: editingDesignPrice.price }));
      setEditingDesignPrice(null);
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return <div className="p-20 text-center animate-pulse text-natural-gold font-serif text-xl">{t('common.loading')}</div>;
  
  const currentUserEmail = auth.currentUser?.email;
  const isTailor = userData?.role === 'tailor' || userData?.role === 'admin' || currentUserEmail === 'mekalamanojkumar6@gmail.com';

  return (
    <div className="min-h-screen bg-natural-subtle/30 pb-20">
      {/* Hero Header */}
      <div className="bg-white border-b border-natural-gold/10 px-6 py-12 mb-8">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-natural-gold/10 rounded-full flex items-center justify-center text-natural-gold border-2 border-natural-gold/20 shadow-inner">
                <UserIcon className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-4xl font-serif font-bold text-natural-text leading-tight">
                  {t('auth.welcome', { name: userData?.displayName || 'User' })}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="px-3 py-1 bg-natural-gold text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                    {userData?.role || 'Customer'}
                  </span>
                  <span className="text-natural-text/40 text-xs font-medium">Account ID: {userData?.uid.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
            
            {isTailor && (
              <div className="flex bg-natural-subtle p-1 rounded-2xl border border-natural-gold/10">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeTab === 'orders' ? "bg-white text-natural-gold shadow-md" : "text-natural-text/40 hover:text-natural-gold")}
                >
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('services')}
                  className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeTab === 'services' ? "bg-white text-natural-gold shadow-md" : "text-natural-text/40 hover:text-natural-gold")}
                >
                  Prices
                </button>
                <button 
                  onClick={() => setActiveTab('feedbacks')}
                  className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeTab === 'feedbacks' ? "bg-white text-natural-gold shadow-md" : "text-natural-text/40 hover:text-natural-gold")}
                >
                  Feedback
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={cn("px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", activeTab === 'settings' ? "bg-white text-natural-gold shadow-md" : "text-natural-text/40 hover:text-natural-gold")}
                >
                  Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard 
            icon={<Package className="w-6 h-6" />} 
            label={isTailor ? "Total Orders" : "My Orders"} 
            value={orders.length} 
            color="bg-natural-gold" 
          />
          <StatCard 
            icon={<Clock className="w-6 h-6" />} 
            label="In Progress" 
            value={orders.filter(o => !['delivered', 'ready'].includes(o.status)).length} 
            color="bg-natural-peach" 
          />
          <StatCard 
            icon={<CheckCircle2 className="w-6 h-6" />} 
            label="Completed" 
            value={orders.filter(o => o.status === 'delivered').length} 
            color="bg-natural-text" 
          />
        </div>

        {/* Dynamic Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'orders' && (
            <motion.div 
              key="orders"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif font-bold text-natural-text">
                  {isTailor ? "Global Order Management" : "Your Recent Boutique Orders"}
                </h2>
                {!isTailor && (
                  <Link to="/booking" className="px-4 py-2 bg-natural-gold text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-natural-gold/90 transition-all shadow-lg shadow-natural-gold/20">
                    New Order
                  </Link>
                )}
              </div>
              
              <div className="bg-white rounded-[40px] border border-natural-gold/10 overflow-hidden shadow-2xl shadow-natural-gold/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-natural-subtle/50">
                      <tr>
                        <th className="px-8 py-6 text-natural-text font-serif font-bold tracking-tight">Order Reference</th>
                        <th className="px-8 py-6 text-natural-text font-serif font-bold tracking-tight">Processing Status</th>
                        {isTailor && <th className="px-8 py-6 text-natural-text font-serif font-bold tracking-tight">Client Name</th>}
                        <th className="px-8 py-6 text-natural-text font-serif font-bold tracking-tight text-right">View</th>
                        {isTailor && <th className="px-8 py-6 text-natural-text font-serif font-bold tracking-tight text-right">Rapid Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-natural-gold/5">
                      {orders.length === 0 ? (
                        <tr><td colSpan={isTailor ? 5 : 3} className="px-8 py-20 text-center text-natural-text/30 italic font-medium">No order history available yet.</td></tr>
                      ) : (
                        orders.map(order => (
                          <tr key={order.id} className="hover:bg-natural-subtle/20 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="font-mono text-sm font-bold text-natural-gold group-hover:scale-105 transition-transform inline-block">#{order.id.slice(0, 8)}</div>
                              <div className="text-[10px] text-natural-text/40 mt-1 uppercase font-bold tracking-tighter">{order.serviceId || 'Custom Stitching'}</div>
                            </td>
                            <td className="px-8 py-6">
                              {isTailor ? (
                                <div className="relative inline-flex items-center">
                                  <select 
                                    disabled={updating === order.id}
                                    value={order.status}
                                    onChange={(e) => updateStatus(order.id, e.target.value)}
                                    className="appearance-none bg-natural-subtle border border-natural-gold/10 rounded-xl px-4 py-2 pr-10 text-[10px] font-bold text-natural-gold uppercase tracking-widest focus:ring-4 focus:ring-natural-gold/5 outline-none disabled:opacity-50 transition-all cursor-pointer hover:border-natural-gold/30"
                                  >
                                    <option value="pending">Pending Review</option>
                                    <option value="paid">Payment Received</option>
                                    <option value="received">Order Received</option>
                                    <option value="cutting">Cutting Phase</option>
                                    <option value="stitching">Stitching Phase</option>
                                    <option value="finishing">Finishing Phase</option>
                                    <option value="ready">Ready for Pickup</option>
                                    <option value="delivered">Successfully Delivered</option>
                                  </select>
                                  <div className="absolute right-3 pointer-events-none text-natural-gold/40 scale-75">▼</div>
                                </div>
                              ) : (
                                <StatusBadge status={order.status} />
                              )}
                            </td>
                            {isTailor && (
                              <td className="px-8 py-6">
                                <div className="text-sm font-bold text-natural-text">{order.customerName || 'Boutique Client'}</div>
                                <div className="text-[10px] text-natural-text/40 font-medium">Standard Request</div>
                              </td>
                            )}
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-4">
                                {!isTailor && order.status === 'pending' && (
                                  <button 
                                    onClick={() => updateStatus(order.id, 'cancelled')}
                                    disabled={updating === order.id}
                                    className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-widest disabled:opacity-50"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <Link 
                                  to={`/order/${order.id}`}
                                  className="inline-flex items-center gap-2 text-natural-peach font-bold hover:text-natural-gold transition-colors group/btn text-xs uppercase tracking-widest"
                                >
                                  <Eye className="w-4 h-4 group-hover/btn:-translate-y-0.5 transition-transform" />
                                  View
                                </Link>
                              </div>
                            </td>
                            {isTailor && (
                              <td className="px-8 py-6 text-right">
                                {['pending', 'paid'].includes(order.status) && (
                                  <button 
                                    onClick={() => updateStatus(order.id, 'received')}
                                    disabled={updating === order.id}
                                    className="px-6 py-3 bg-natural-gold text-white text-xs font-bold uppercase tracking-widest rounded-2xl hover:bg-natural-gold/90 transition-all shadow-xl shadow-natural-gold/20 flex items-center gap-2 ml-auto active:scale-95"
                                  >
                                    <CheckCircle2 className="w-4 h-4" /> Accept Order
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'services' && isTailor && (
            <motion.div 
              key="services"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif font-bold text-natural-text">Item Price Management</h2>
                  {!showAddService ? (
                    <button 
                      onClick={() => setShowAddService(true)}
                      className="flex items-center gap-2 px-4 py-2 border border-natural-gold/20 rounded-xl text-xs font-bold uppercase tracking-widest text-natural-gold hover:bg-natural-gold hover:text-white transition-all shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowAddService(false)}
                      className="text-xs font-bold uppercase tracking-widest text-natural-text/40 hover:text-natural-gold"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                {showAddService && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-white p-8 rounded-[40px] border border-natural-gold/20 shadow-xl mb-8"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Item Name</label>
                        <input 
                          type="text"
                          value={newService.name}
                          onChange={(e) => setNewService({...newService, name: e.target.value})}
                          placeholder="e.g. Designer Blouse"
                          className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/10 focus:ring-4 focus:ring-natural-gold/5 outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Base Price (₹)</label>
                        <input 
                          type="number"
                          value={newService.basePrice || ''}
                          onChange={(e) => setNewService({...newService, basePrice: Number(e.target.value)})}
                          placeholder="800"
                          className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/10 focus:ring-4 focus:ring-natural-gold/5 outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Category</label>
                        <select 
                          value={newService.category}
                          onChange={(e) => setNewService({...newService, category: e.target.value})}
                          className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/10 focus:ring-4 focus:ring-natural-gold/5 outline-none font-medium"
                        >
                          <option value="Blouse">Blouse</option>
                          <option value="Suit">Suit</option>
                          <option value="Lehenga">Lehenga</option>
                          <option value="Kurti">Kurti</option>
                          <option value="Bottom Wear">Bottom Wear</option>
                          <option value="Work">Embroidery/Work</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-8 flex justify-end">
                      <button 
                        onClick={addService}
                        disabled={updating === 'adding-service'}
                        className="px-8 py-3 bg-natural-gold text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-natural-gold/90 transition-all shadow-lg shadow-natural-gold/20 disabled:opacity-50"
                      >
                        {updating === 'adding-service' ? 'Adding...' : 'Save Item'}
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map(service => (
                    <div key={service.id} className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-xl shadow-natural-gold/5 flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="px-3 py-1 bg-natural-subtle text-[8px] font-bold uppercase tracking-widest text-natural-text/50 rounded-full border border-natural-gold/5">
                            {service.category}
                          </span>
                          <Settings className="w-4 h-4 text-natural-gold/20 group-hover:rotate-90 transition-transform" />
                        </div>
                        <h3 className="text-xl font-serif font-bold text-natural-text mb-2">{service.name}</h3>
                        <p className="text-sm text-natural-text/40 mb-8 font-medium">Modify the base stitching price for this category.</p>
                      </div>

                      <div className="pt-6 border-t border-natural-gold/5">
                        {editingPrice?.id === service.id ? (
                          <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-natural-gold font-bold">₹</span>
                              <input 
                                type="number"
                                autoFocus
                                value={editingPrice.price}
                                onChange={(e) => setEditingPrice({...editingPrice, price: Number(e.target.value)})}
                                className="w-full pl-8 pr-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/20 focus:ring-4 focus:ring-natural-gold/5 outline-none font-bold text-natural-gold"
                              />
                            </div>
                            <button 
                              onClick={updateServicePrice}
                              disabled={updating === 'service-' + service.id}
                              className="p-3 bg-natural-gold text-white rounded-xl shadow-lg shadow-natural-gold/20 active:scale-95 transition-all text-sm font-bold disabled:opacity-50"
                            >
                              {updating === 'service-' + service.id ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-natural-text/30 uppercase tracking-widest mb-1">Base Cost</p>
                              <p className="text-2xl font-bold text-natural-peach">₹{service.basePrice}</p>
                            </div>
                            <button 
                              onClick={() => setEditingPrice({id: service.id, price: service.basePrice})}
                              className="px-4 py-2 bg-natural-subtle text-natural-gold rounded-xl text-[10px] font-bold uppercase tracking-widest border border-natural-gold/10 hover:bg-natural-gold hover:text-white transition-all"
                            >
                              Change Price
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Design Collections Reference */}
              <section className="pt-12 border-t border-natural-gold/10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="p-3 bg-natural-gold rounded-2xl text-white">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif font-bold text-natural-text">Design Reference Gallery</h2>
                    <p className="text-xs text-natural-text/40 font-bold uppercase tracking-widest mt-1">Browse collections to help determine pricing</p>
                  </div>
                </div>

                <div className="space-y-12">
                  {['Blouses', 'Chudidars', 'Lehengas', 'Saree Finishing'].map(category => (
                    <div key={category} className="space-y-6">
                      <h3 className="text-xl font-serif font-bold text-natural-gold flex items-center gap-3">
                        <span className="w-8 h-[2px] bg-natural-gold/20" />
                        {category}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {DESIGNS.filter(d => d.mainCategory === category).map(design => {
                          const currentPrice = designOverrides[design.id] || design.price;
                          return (
                            <div key={design.id} className="group relative aspect-square rounded-2xl overflow-hidden border border-natural-gold/10 bg-white shadow-sm hover:shadow-xl transition-all">
                              <img 
                                src={design.image} 
                                alt={design.name_en} 
                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                <p className="text-[9px] font-bold text-white uppercase tracking-tighter leading-tight">{design.name_en}</p>
                                {editingDesignPrice?.id === design.id ? (
                                  <div className="flex flex-col gap-1 mt-1">
                                    <input 
                                      type="number"
                                      autoFocus
                                      value={editingDesignPrice.price}
                                      onChange={(e) => setEditingDesignPrice({...editingDesignPrice, price: Number(e.target.value)})}
                                      className="w-full px-2 py-1 bg-white rounded text-[10px] font-bold text-natural-gold outline-none"
                                    />
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={updateDesignPrice}
                                        className="flex-1 bg-natural-gold text-white text-[8px] font-bold py-1 rounded"
                                      >
                                        Save
                                      </button>
                                      <button 
                                        onClick={() => setEditingDesignPrice(null)}
                                        className="flex-1 bg-white/20 text-white text-[8px] font-bold py-1 rounded"
                                      >
                                        X
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-[11px] font-bold text-natural-gold">₹{currentPrice}</p>
                                    <button 
                                      onClick={() => setEditingDesignPrice({id: design.id, price: currentPrice})}
                                      className="p-1 px-2 bg-white/20 hover:bg-white/40 rounded text-[8px] font-bold text-white uppercase tracking-tighter"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'settings' && isTailor && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl"
            >
              <h2 className="text-2xl font-serif font-bold text-natural-text mb-8">Boutique Payment Settings</h2>
              <div className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-6 w-full">
                    <div>
                      <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">UPI ID (VPA)</label>
                      <input 
                        type="text"
                        value={paymentSettings.upiId}
                        onChange={(e) => setPaymentSettings({...paymentSettings, upiId: e.target.value})}
                        placeholder="e.g. tailorher@upi"
                        className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/10 focus:ring-4 focus:ring-natural-gold/5 outline-none font-medium text-natural-gold"
                      />
                      <p className="mt-1 text-[10px] text-natural-text/40 font-medium">This will be used to generate the payment QR code for customers.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-natural-gold/5">
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Bank Name</label>
                        <input 
                          type="text"
                          value={paymentSettings.bankName}
                          onChange={(e) => setPaymentSettings({...paymentSettings, bankName: e.target.value})}
                          placeholder="e.g. HDFC Bank"
                          className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/10 focus:ring-4 focus:ring-natural-gold/5 outline-none font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">IFSC Code</label>
                        <input 
                          type="text"
                          value={paymentSettings.ifscCode}
                          onChange={(e) => setPaymentSettings({...paymentSettings, ifscCode: e.target.value})}
                          placeholder="HDFC0001234"
                          className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/10 focus:ring-4 focus:ring-natural-gold/5 outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-natural-text/40 uppercase tracking-widest mb-2">Account Number</label>
                      <input 
                        type="text"
                        value={paymentSettings.accountNumber}
                        onChange={(e) => setPaymentSettings({...paymentSettings, accountNumber: e.target.value})}
                        placeholder="1234567890"
                        className="w-full px-4 py-3 bg-natural-subtle rounded-xl border border-natural-gold/10 focus:ring-4 focus:ring-natural-gold/5 outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex-shrink-0 flex flex-col items-center gap-4 bg-natural-subtle/50 p-6 rounded-3xl border border-natural-gold/5">
                    <p className="text-[10px] font-bold text-natural-text/40 uppercase tracking-widest">QR Code Preview</p>
                    <div className="bg-white p-4 rounded-2xl border border-natural-gold/10">
                      {paymentSettings.upiId ? (
                        <QRCodeSVG 
                          value={`upi://pay?pa=${paymentSettings.upiId}&pn=TailorHer&cu=INR`} 
                          size={150}
                        />
                      ) : (
                        <div className="w-[150px] h-[150px] flex items-center justify-center text-natural-text/20">
                          <QrCode className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] text-natural-gold/60 font-medium max-w-[150px] text-center">
                      Customers will scan this to make payments.
                    </p>
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    onClick={async () => {
                      setUpdating('save-settings');
                      try {
                        await setDoc(doc(db, 'settings', 'payment'), {
                          ...paymentSettings,
                          updatedAt: serverTimestamp()
                        });
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setUpdating(null);
                      }
                    }}
                    disabled={updating === 'save-settings'}
                    className="w-full py-4 bg-natural-gold text-white rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-natural-gold/20 hover:bg-natural-gold/90 transition-all disabled:opacity-50"
                  >
                    {updating === 'save-settings' ? 'Updating...' : 'Save Payment Details'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'feedbacks' && isTailor && (
            <motion.div 
              key="feedbacks"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-serif font-bold text-natural-text mb-8">Customer Voice & Ratings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbacks.map(fb => (
                  <FeedbackCard key={fb.id} feedback={fb} />
                ))}
                {feedbacks.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-white rounded-[40px] border border-dashed border-natural-gold/20 text-natural-text/30 font-medium">
                    No customer feedbacks recorded yet.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: any, label: string, value: number, color: string }) {
  return (
    <div className="p-8 bg-white border border-natural-gold/10 rounded-[32px] shadow-xl shadow-natural-gold/5 flex items-center gap-6 hover:translate-y-[-4px] transition-all group">
      <div className={cn(color, "p-5 rounded-2xl text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform")}>
        {icon}
      </div>
      <div>
        <h3 className="text-natural-text/40 font-bold uppercase tracking-widest text-[10px] mb-1">{label}</h3>
        <p className="text-3xl font-serif font-bold text-natural-text">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    pending: "bg-amber-50 text-amber-600 border-amber-100",
    received: "bg-blue-50 text-blue-600 border-blue-100",
    cutting: "bg-indigo-50 text-indigo-600 border-indigo-100",
    stitching: "bg-purple-50 text-purple-600 border-purple-100",
    ready: "bg-green-50 text-green-600 border-green-100",
    delivered: "bg-natural-text/5 text-natural-text/60 border-natural-text/10",
    cancelled: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border",
      styles[status] || "bg-gray-50 text-gray-400"
    )}>
      {status.replace('-', ' ')}
    </span>
  );
}

function FeedbackCard({ feedback }: any) {
  return (
    <div className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-xl shadow-natural-gold/5 relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 transition-opacity">
        <Star className="w-20 h-20 text-natural-gold fill-current" />
      </div>
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map(s => (
          <Star key={s} className={cn("w-3 h-3", s <= feedback.rating ? "text-natural-peach fill-current font-bold" : "text-gray-200")} />
        ))}
      </div>
      <p className="text-sm text-natural-text/70 mb-8 italic leading-relaxed min-h-[60px]">"{feedback.comment}"</p>
      <div className="flex items-center justify-between pt-6 border-t border-natural-gold/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-natural-subtle rounded-full flex items-center justify-center text-xs font-bold text-natural-gold border border-natural-gold/10 uppercase tracking-tighter">
            {feedback.customerName?.[0] || 'C'}
          </div>
          <div>
            <p className="text-xs font-bold text-natural-text">{feedback.customerName}</p>
            <p className="text-[10px] text-natural-text/40 font-medium">Verified Purchase</p>
          </div>
        </div>
      </div>
    </div>
  );
}
