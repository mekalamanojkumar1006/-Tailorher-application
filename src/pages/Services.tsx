import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '@/src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function Services() {
  const { t } = useTranslation();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snap = await getDocs(collection(db, 'services'));
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Define static images/descriptions to complement Firestore data
        const serviceExtras: any = {
          'blouse-simple': { 
            img: 'https://i.pinimg.com/originals/39/73/04/3973043d96da35daefce9bb663342389.jpg',
            desc: 'Classic stitching with a perfect fit for everyday elegance.'
          },
          'blouse-designer': { 
            img: 'https://i.pinimg.com/originals/82/01/cc/8201ccd64e9e0f6f3630f40d3999999a.jpg',
            desc: 'Intricate patterns, custom necklines, and modern sleeve designs.'
          },
          kurti: { 
            img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?q=80&w=1974&auto=format&fit=crop',
            desc: 'Trendy and comfortable kurtis for semi-formal and casual wear.'
          },
          'suit-anarkali': { 
            img: 'https://tse4.mm.bing.net/th/id/OIP.1wLTZ-RJqVvBr8orkFSHmgHaKL?pid=Api&P=0&h=180',
            desc: 'Flowy, floor-length Anarkali suits that radiate royalty.'
          },
          'lehenga-wedding': { 
            img: 'https://getethnic.com/wp-content/uploads/2021/08/Maroon-Bridal-Lehenga-6.jpg',
            desc: 'Exquisite bridal lehengas with premium craftsmanship.'
          },
          'maggam-work': { 
            img: 'https://i.pinimg.com/originals/5e/8a/7e/5e8a7e4b9e2b1b3bfa4b9e2b1b3bfa4b.jpg',
            desc: 'Traditional hand embroidery work for a grand ethnic look.'
          }
        };

        setServices(data.map(s => ({
          ...s,
          ...(serviceExtras[s.id] || { 
            img: 'https://images.unsplash.com/photo-1556905055-8f358a7a4bb4?q=80&w=2070&auto=format&fit=crop',
            desc: 'Exquisite custom tailoring for your unique silhouette.'
          })
        })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  if (loading) return <div className="p-20 text-center animate-pulse text-natural-gold font-serif text-xl">{t('common.loading')}</div>;

  return (
    <div className="min-h-screen bg-natural-subtle/30 pb-20">
      <div className="bg-white border-b border-natural-gold/10 px-6 py-20 mb-12">
        <div className="container mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-serif font-bold text-natural-text mb-6"
          >
            {t('nav.services')}
          </motion.h1>
          <p className="text-natural-gold font-medium uppercase tracking-[0.3em] text-xs">Exquisite Craftsmanship</p>
        </div>
      </div>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {services.map((service, i) => (
            <motion.div 
              key={service.id} 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-natural-gold/10 rounded-[40px] overflow-hidden shadow-xl shadow-natural-gold/5 flex flex-col group hover:-translate-y-2 transition-all"
            >
              <div className="relative h-72 overflow-hidden">
                <img 
                  src={service.img} 
                  alt={service.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-bottom p-8">
                  <span className="px-4 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/30 self-end">
                    {service.category}
                  </span>
                </div>
              </div>
              <div className="p-10 flex-1 flex flex-col">
                <h3 className="text-2xl font-serif font-bold text-natural-text mb-4">{service.name}</h3>
                <p className="text-natural-text/40 mb-8 font-medium leading-relaxed flex-1">{service.desc}</p>
                <div className="flex items-center justify-between pt-6 border-t border-natural-gold/5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-natural-gold uppercase tracking-widest leading-none mb-1">Starting from</span>
                    <span className="text-2xl font-bold text-natural-peach">₹{service.basePrice}</span>
                  </div>
                  <button 
                    onClick={() => navigate(`/booking?serviceId=${service.id}`)}
                    className="px-6 py-3 bg-natural-gold text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-natural-gold/90 transition-all shadow-lg shadow-natural-gold/20 active:scale-95"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
