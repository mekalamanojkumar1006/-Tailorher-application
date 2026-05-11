import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Scissors, Ruler, Sparkles, Truck, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth, db } from '@/src/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

export function Home() {
  const { t } = useTranslation();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        setUserRole(snap.data()?.role || 'customer');
      } else {
        setUserRole(null);
      }
    });
  }, []);

  const features = [
    { icon: <Sparkles className="w-6 h-6 text-natural-peach" />, title_en: "Bespoke Designs", title_te: "బెస్పోక్ డిజైన్స్", link: "/designs" },
    { icon: <Ruler className="w-6 h-6 text-natural-peach" />, title_en: "AI Size Recs", title_te: "AI పరిమాణ సిఫార్సులు", link: "/booking" },
    { icon: <Scissors className="w-6 h-6 text-natural-peach" />, title_en: "Premium Stitching", title_te: "ప్రీమియం స్టిచ్చింగ్", link: "/services" },
    { icon: <Truck className="w-6 h-6 text-natural-peach" />, title_en: "Home Pickup", title_te: "హోమ్ పికప్", link: "/home-pickup" },
  ];

  const categories = [
    { name_en: "Blouses", name_te: "బ్లౌజులు", img: "https://tse2.mm.bing.net/th/id/OIP.4PDWM22BgQzqLw97f3eCTgHaEO?pid=Api&P=0&h=180" },
    { name_en: "Chudidars", name_te: "చుడీదార్లు", img: "https://tse4.mm.bing.net/th/id/OIP.1wLTZ-RJqVvBr8orkFSHmgHaKL?pid=Api&P=0&h=180" },
    { name_en: "Lehengas", name_te: "లెహంగాలు", img: "https://getethnic.com/wp-content/uploads/2021/08/Maroon-Bridal-Lehenga-6.jpg" },
    { name_en: "Saree Finishing", name_te: "చీర ఫినిషింగ్", img: "https://i.pinimg.com/originals/71/a9/fb/71a9fb1e9df1c3795f6f6987f1b5531e.jpg" },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden py-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://i.pinimg.com/originals/39/73/04/3973043d96da35daefce9bb663342389.jpg" 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-20"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-natural-bg/50 to-natural-bg"></div>
        </div>

        <div className="container mx-auto px-10 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="md:col-span-7"
            >
              <span className="text-natural-gold font-serif italic text-2xl mb-4 block">
                Bespoke Elegance for Every Woman
              </span>
              <h1 className="text-6xl md:text-8xl font-serif font-light text-natural-text mb-6 leading-tight">
                Custom Fit <br/>
                <span className="text-natural-peach">Tailoring Made Easy.</span>
              </h1>
              <p className="text-xl text-natural-text/70 max-w-lg mb-10 leading-relaxed">
                Experience the perfect stitch. AI-powered size recommendations and artisan craftsmanship, now available in English and Telugu.
              </p>
              <div className="flex flex-wrap gap-6">
                <Link to="/booking" className="px-10 py-5 bg-natural-gold text-white rounded-full text-lg font-bold shadow-xl shadow-natural-gold/20 hover:bg-natural-gold/90 transition-all hover:scale-105 active:scale-95">
                  Book Order / ఆర్డర్ చేయండి
                </Link>
                <Link to="/designs" className="px-10 py-5 border-2 border-natural-gold text-natural-gold rounded-full text-lg font-bold hover:bg-natural-gold hover:text-white transition-all hover:scale-105 active:scale-95">
                  View Gallery
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
              className="hidden md:block md:col-span-5 relative"
            >
              <div className="absolute inset-0 bg-natural-pink/20 rounded-[40px] rotate-3 -z-10"></div>
              <div className="relative bg-white p-8 rounded-[40px] shadow-2xl border border-natural-gold/10 overflow-hidden">
                <img 
                  src="https://i.pinimg.com/originals/39/73/04/3973043d96da35daefce9bb663342389.jpg" 
                  alt="Elegant Dress" 
                  className="rounded-3xl w-full h-[500px] object-cover"
                />
                <div className="absolute top-12 left-12 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-natural-gold/10 w-56">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-natural-text/40">Live Status</span>
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Stitching</span>
                  </div>
                  <h4 className="font-serif font-bold text-natural-gold">Silk Saree Blouse</h4>
                  <div className="w-full bg-natural-bg h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-natural-gold h-full w-2/3"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {userRole !== 'tailor' && (
        <section className="py-24 bg-natural-subtle/30">
          <div className="container mx-auto px-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {features.map((f, i) => (
                <Link
                  key={i}
                  to={f.link}
                  className="block"
                >
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex flex-col items-center text-center group cursor-pointer"
                  >
                    <div className="w-16 h-16 bg-natural-bg rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:bg-natural-gold group-hover:text-white transition-all transform group-hover:-translate-y-2">
                      <span className="group-hover:text-white transition-colors">{f.icon}</span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-natural-text mb-2 group-hover:text-natural-gold transition-colors">
                      {localStorage.getItem('i18nextLng') === 'te' ? f.title_te : f.title_en}
                    </h3>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Categories */}
      {userRole !== 'tailor' && (
        <section className="py-24 bg-natural-subtle">
          <div className="container mx-auto px-10">
            <div className="flex justify-between items-end mb-16">
              <h2 className="text-5xl font-serif font-light text-natural-text">
                Our <span className="text-natural-gold">Specialties</span>
              </h2>
              <Link to="/designs" className="text-natural-gold font-bold hover:underline mb-2">View All Gallery →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {categories.map((cat, i) => (
                <Link to={`/designs?category=${cat.name_en}`} key={i} className="group relative overflow-hidden rounded-[32px] h-[500px]">
                  <img 
                    src={cat.img} 
                    alt={cat.name_en} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-natural-text/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-8 left-8 text-white">
                    <span className="text-xs uppercase tracking-[0.2em] opacity-80 mb-2 block">Collection</span>
                    <h3 className="text-3xl font-serif font-bold tracking-tight">
                      {localStorage.getItem('i18nextLng') === 'te' ? cat.name_te : cat.name_en}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* How it Works */}
      {userRole !== 'tailor' && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-6 max-w-4xl">
            <h2 className="text-4xl font-serif font-bold text-pink-900 text-center mb-16">Simple 3-Step Process</h2>
            <div className="space-y-12">
              {[
                { id: '01', title: 'Pick a Service', desc: 'Choose from blouses, sarees, or chudidars.' },
                { id: '02', title: 'Enter Measurements', desc: 'Use our AI guide for a perfect fit recommendations.' },
                { id: '03', title: 'Get it Delivered', desc: 'We stitch with love and deliver to your home.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-8 items-start">
                  <span className="text-6xl font-serif font-bold text-pink-100 leading-none">{step.id}</span>
                  <div>
                    <h3 className="text-2xl font-serif font-bold text-pink-900 mb-2">{step.title}</h3>
                    <p className="text-pink-800/60 text-lg leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
