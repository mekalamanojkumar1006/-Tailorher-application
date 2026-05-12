import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Eye, ShoppingBag, X, ZoomIn } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { cn } from '@/src/lib/utils';
import { db } from '@/src/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

interface DesignItem {
  id: string;
  name_en: string;
  name_te: string;
  category: string;
  mainCategory: 'Blouses' | 'Chudidars' | 'Lehengas' | 'Saree Finishing';
  price: number;
  image: string;
}

export const DESIGNS: DesignItem[] = [
  // CUSTOM OPTION
  { 
    id: 'custom-1', 
    mainCategory: 'Blouses', 
    category: 'Custom', 
    name_en: 'Upload Your Own Design', 
    name_te: 'మీ స్వంత డిజైన్ అప్‌లోడ్ చేయండి', 
    price: 0, 
    image: 'https://tse3.mm.bing.net/th/id/OIP.LK2u78XoZ4-fgfsdqgpYvwHaEW?pid=Api&P=0&h=180' 
  },
  // BLOUSES
  { id: 'b1', mainCategory: 'Blouses', category: 'Bridal', name_en: 'Royal Bride Blouse', name_te: 'రాయల్ బ్రైడ్ బ్లౌజ్', price: 4500, image: 'https://cdn0.weddingwire.in/article/4229/original/1920/jpg/99224-242158974-2881482125477315-2063108543494541627-n.jpeg' },
  { id: 'b2', mainCategory: 'Blouses', category: 'Bridal', name_en: 'Maharani Cut Blouse', name_te: 'మహారాణి కట్ బ్లౌజ్', price: 5200, image: 'https://rukminim2.flixcart.com/image/1280/1280/xif0q/blouse/o/h/5/l-blrs38-parent-kjs-original-imahkhpq8wt6q2yj.jpeg?q=90' },
  { id: 'b4', mainCategory: 'Blouses', category: 'Bridal', name_en: 'Bridal Stone Work Blouse', name_te: 'బ్రైడల్ స్టోన్ వర్క్ బ్లౌజ్', price: 6000, image: 'https://i.pinimg.com/1200x/e0/fc/6c/e0fc6c8cf9bd6082660222c3c05fe191.jpg' },
  { id: 'm1', mainCategory: 'Blouses', category: 'Modern', name_en: 'Butterfly Back Blouse', name_te: 'బటర్ఫ్లై బ్యాక్ బ్లౌజ్', price: 2800, image: 'https://m.media-amazon.com/images/I/61liFf590DL._SX679_.jpg' },
  { id: 'm2', mainCategory: 'Blouses', category: 'Modern', name_en: 'Deep V Designer', name_te: 'డీప్ వి డిజైనర్', price: 3200, image: 'https://images.herzindagi.info/image/2024/Jul/deep-v-blouse.jpg' },
  { id: 't3', mainCategory: 'Blouses', category: 'Traditional', name_en: 'Kanchi Queen Blouse', name_te: 'కాంచీ క్వీన్ బ్లౌజ్', price: 3200, image: 'https://www.sakhifashions.com/cdn/shop/products/EE-S53120_211130_M-12_fe427041-fd2c-485f-8589-87fa584ed07b_800x.jpg?v=1657018004' },
  { id: 't4', mainCategory: 'Blouses', category: 'Traditional', name_en: 'Traditional Maggam Work', name_te: 'సంప్రదాయ మగ్గం వర్క్', price: 4500, image: 'https://i.etsystatic.com/38070864/r/il/7d6989/4407580953/il_1140xN.4407580953_pbjc.jpg' },
  
  // MAGGAM WORK SPECIALS
  { id: 'mw1', mainCategory: 'Blouses', category: 'Maggam Work', name_en: 'Classic Peacock Maggam', name_te: 'క్లాసిక్ పీకాక్ మగ్గం వర్క్', price: 5500, image: 'https://tse4.mm.bing.net/th/id/OIP.Y2UkvqdqvaHh8KjX047D1wHaEK?pid=Api&P=0&h=180' },
  { id: 'mw2', mainCategory: 'Blouses', category: 'Maggam Work', name_en: 'Luxury Bridal Maggam', name_te: 'లగ్జరీ బ్రైడల్ మగ్గం వర్క్', price: 7500, image: 'https://designerblouse.co/blog/wp-content/uploads/2025/05/Marriage-Bridal-Maggam-Work-Blouse-Designs.jpg' },
  { id: 'mw3', mainCategory: 'Blouses', category: 'Maggam Work', name_en: 'Floral Vines Maggam', name_te: 'ఫ్లోరల్ వైన్స్ మగ్గం వర్క్', price: 4200, image: 'https://i.pinimg.com/originals/6d/a3/4f/6da34f7ba6772a53c6030d391dd218b0.jpg' },

  // SILK SPECIALS
  { id: 'sk1', mainCategory: 'Blouses', category: 'Silk', name_en: 'Royal Banarasi Silk', name_te: 'రాయల్ బనారసి సిల్క్', price: 2800, image: 'https://tse2.mm.bing.net/th/id/OIP.hamG40_BZeLicO0SF74fawHaFj?pid=Api&P=0&h=180' },
  { id: 'sk2', mainCategory: 'Blouses', category: 'Silk', name_en: 'Golden Kanchi Silk', name_te: 'గోల్డెన్ కాంచీ సిల్క్', price: 3200, image: 'https://www.zilikaa.com/cdn/shop/files/I-01_bc60f4ef-5be9-4d25-b48c-3218f52426bb_800x.jpg?v=1709979077' },
  { id: 'sk3', mainCategory: 'Blouses', category: 'Silk', name_en: 'Elegant Tussar Design', name_te: 'ఎలిగెంట్ టస్సర్ డిజైన్', price: 2400, image: 'https://i.pinimg.com/originals/b0/b5/0a/b0b50aeba22064d7d94d4fdf5805f770.jpg' },
  
  // CHUDIDARS
  { id: 'c1', mainCategory: 'Chudidars', category: 'Anarkali', name_en: 'Emerald Silk Anarkali', name_te: 'ఎమరాల్డ్ సిల్క్ అనార్కలి', price: 3500, image: 'https://tse4.mm.bing.net/th/id/OIP.1wLTZ-RJqVvBr8orkFSHmgHaKL?pid=Api&P=0&h=180' },
  { id: 'c2', mainCategory: 'Chudidars', category: 'Punjabi', name_en: 'Floral Punjabi Suit', name_te: 'ఫ్లోరల్ పంజాబీ సూట్', price: 2200, image: 'https://assets2.andaazfashion.com/media/catalog/product/cache/1/image/a12781a7f2ccb3d663f7fd01e1bd2e4e/n/a/navy-blue-indian-wear-cotton-silk-churidar-suit-lstv05982.jpg' },
  { id: 'c3', mainCategory: 'Chudidars', category: 'Modern', name_en: 'Palazzo Set', name_te: 'పలాజో సెట్', price: 2800, image: 'https://i.pinimg.com/originals/1f/d1/be/1fd1be6211155b0402c83514212293c5.jpg' },
  { id: 'c4', mainCategory: 'Chudidars', category: 'Straight Cut', name_en: 'Cotton Office Suit', name_te: 'కాటన్ ఆఫీస్ సూట్', price: 1800, image: 'https://i.pinimg.com/originals/fd/15/1d/fd151dccc26921e3df1ffa9732f38949.jpg' },

  // LEHENGAS
  { id: 'l1', mainCategory: 'Lehengas', category: 'Wedding', name_en: 'Maroon Bridal Lehenga', name_te: 'మెరూన్ బ్రైడల్ లెహంగా', price: 15000, image: 'https://getethnic.com/wp-content/uploads/2021/08/Maroon-Bridal-Lehenga-6.jpg' },
  { id: 'l2', mainCategory: 'Lehengas', category: 'Designer', name_en: 'Golden Glow Lehenga', name_te: 'గోల్డెన్ గ్లో లెహంగా', price: 8500, image: 'https://tse2.mm.bing.net/th/id/OIP.l0T49Q_t9COHBzqF_hMzyQHaJ3?pid=Api&P=0&h=180' },
  { id: 'l3', mainCategory: 'Lehengas', category: 'Simple', name_en: 'Party Wear Lehenga', name_te: 'పార్టీ వేర్ లెహంగా', price: 5500, image: 'https://i.pinimg.com/originals/86/e5/64/86e564020ebc101dd13976a965e4a97c.jpg' },
  { id: 'l4', mainCategory: 'Lehengas', category: 'Wedding', name_en: 'Emerald Queen Lehenga', name_te: 'ఎమరాల్డ్ క్వీన్ లెహంగా', price: 18000, image: 'https://www.k4fashion.com/wp-content/uploads/2022/10/Emerald-Green-Stoned-Studded-Lehenga-819x1024.jpg' },

  // SAREE FINISHING
  { id: 's1', mainCategory: 'Saree Finishing', category: 'Fall & Pico', name_en: 'Premium Fall & Pico', name_te: 'ప్రీమియం ఫాల్ & పికో', price: 150, image: 'https://i.pinimg.com/originals/71/a9/fb/71a9fb1e9df1c3795f6f6987f1b5531e.jpg' },
  { id: 's2', mainCategory: 'Saree Finishing', category: 'Kuchu', name_en: 'Bridal Kuchu Work', name_te: 'బ్రైడల్ కుచ్చు వర్క్', price: 1200, image: 'https://i.pinimg.com/originals/39/73/04/3973043d96da35daefce9bb663342389.jpg' },
  { id: 's3', mainCategory: 'Saree Finishing', category: 'Charu', name_en: 'Saree Charu/Polishing', name_te: 'చీర చారు/పాలిషింగ్', price: 300, image: 'https://tse1.mm.bing.net/th/id/OIP.SpxV8bhIebXpscnypM9iowHaEc?pid=Api&P=0&h=180' },
];

const MAIN_CATEGORIES = ['Blouses', 'Chudidars', 'Lehengas', 'Saree Finishing'] as const;

type MainCategoryType = typeof MAIN_CATEGORIES[number];

const SUB_CATEGORIES: Record<string, string[]> = {
  'Blouses': ['All', 'Custom', 'Bridal', 'Modern', 'Traditional', 'Maggam Work', 'Silk'],
  'Chudidars': ['All', 'Anarkali', 'Punjabi', 'Modern', 'Straight Cut'],
  'Lehengas': ['All', 'Wedding', 'Designer', 'Simple'],
  'Saree Finishing': ['All', 'Fall & Pico', 'Kuchu', 'Charu'],
};

export function DesignGallery() {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [designOverrides, setDesignOverrides] = useState<Record<string, number>>({});
  const [mainCategory, setMainCategory] = useState<MainCategoryType>(
    (searchParams.get('category') as MainCategoryType) || 'Blouses'
  );
  const [activeSubCategory, setActiveSubCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const category = searchParams.get('category') as MainCategoryType;
    if (category && MAIN_CATEGORIES.includes(category)) {
      setMainCategory(category);
    }

    const fetchOverrides = async () => {
      try {
        const snap = await getDocs(collection(db, 'design_overrides'));
        const overrides: Record<string, number> = {};
        snap.docs.forEach(doc => {
          overrides[doc.id] = doc.data().price;
        });
        setDesignOverrides(overrides);
      } catch (err) {
        console.error("Overrides fetch error:", err);
      }
    };
    fetchOverrides();
  }, [searchParams]);

  const handleMainCategoryChange = (cat: MainCategoryType) => {
    setMainCategory(cat);
    setActiveSubCategory('All');
    setSearchParams({ category: cat });
  };

  const filteredDesigns = useMemo(() => {
    return DESIGNS.filter(design => {
      const matchesMain = design.mainCategory === mainCategory;
      const matchesSub = activeSubCategory === 'All' || design.category === activeSubCategory;
      const matchesSearch = 
        design.name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        design.name_te.includes(searchQuery);
      return matchesMain && matchesSub && matchesSearch;
    });
  }, [mainCategory, activeSubCategory, searchQuery]);

  const isTelugu = i18n.language === 'te';

  const getPrice = (design: DesignItem) => {
    return designOverrides[design.id] || design.price;
  };

  return (
    <div className="min-h-screen bg-natural-bg">
      {/* Header Section */}
      <section className="pt-20 pb-0 bg-white border-b border-natural-gold/10">
        <div className="container mx-auto px-6 max-w-6xl">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <span className="text-natural-gold font-serif italic text-xl mb-2 block">Premium Collections</span>
            <h1 className="text-5xl md:text-6xl font-serif font-light text-natural-text mb-6">
              {mainCategory} <span className="text-natural-gold">Gallery</span>
            </h1>
          </motion.div>

          {/* Main Category Tabs */}
          <div className="flex border-b border-natural-gold/10 mb-8 overflow-x-auto scrollbar-hide">
            {MAIN_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleMainCategoryChange(cat)}
                className={cn(
                  "px-8 py-4 font-serif font-bold text-lg transition-all border-b-2 whitespace-nowrap",
                  mainCategory === cat 
                    ? "border-natural-gold text-natural-gold bg-natural-gold/5" 
                    : "border-transparent text-natural-text/40 hover:text-natural-text/60"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search and Sub-Filters */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between pb-12">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-natural-gold/50" />
              <input 
                type="text" 
                placeholder={isTelugu ? "వెతకండి..." : "Search..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-natural-subtle border border-natural-gold/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-natural-gold/20 transition-all text-sm"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full md:w-auto scrollbar-hide">
              <Filter className="w-4 h-4 text-natural-gold mr-1 shrink-0" />
              {SUB_CATEGORIES[mainCategory].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveSubCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] uppercase font-bold tracking-widest whitespace-nowrap transition-all",
                    activeSubCategory === cat 
                      ? "bg-natural-gold text-white shadow-md shadow-natural-gold/20" 
                      : "bg-white text-natural-text/60 border border-natural-gold/10 hover:border-natural-gold/30"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-7xl">
          {filteredDesigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredDesigns.map((design, idx) => (
                  <motion.div
                    layout
                    key={design.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: idx * 0.05 }}
                    className="group bg-white rounded-[32px] overflow-hidden border border-natural-gold/5 shadow-xl shadow-natural-gold/5 hover:translate-y-[-8px] transition-all duration-500"
                  >
                    <div className="relative h-96 overflow-hidden">
                      <img 
                        src={design.image} 
                        alt={design.name_en} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                        <button 
                          onClick={() => setSelectedImage(design.image)}
                          className="p-4 bg-white/90 backdrop-blur rounded-full text-natural-gold hover:bg-white active:scale-95 transition-all shadow-lg"
                        >
                          <ZoomIn className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="absolute top-4 right-4 px-3 py-1 bg-white/80 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-widest text-natural-gold">
                        {design.category}
                      </div>
                    </div>

                    <div className="p-8">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-serif font-bold text-natural-text leading-tight group-hover:text-natural-gold transition-colors">
                            {isTelugu ? design.name_te : design.name_en}
                          </h3>
                          <span className="text-xs text-natural-text/40 font-bold tracking-widest uppercase">
                            {isTelugu ? design.name_en : design.name_te}
                          </span>
                        </div>
                        <span className="text-2xl font-bold text-natural-peach">
                          ₹{getPrice(design)}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <Link 
                          to={`/booking?design=${design.id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-natural-gold text-white rounded-xl font-bold text-sm shadow-lg shadow-natural-gold/10 hover:bg-natural-gold/90 transition-all active:scale-95"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          {isTelugu ? "బుక్ చేయండి" : "Book Now"}
                        </Link>
                        <button 
                          onClick={() => setSelectedImage(design.image)}
                          className="px-4 py-3 border border-natural-gold/20 text-natural-gold rounded-xl font-bold text-sm hover:bg-natural-subtle transition-all active:scale-95"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="py-40 text-center">
              <div className="text-6xl mb-6 opacity-20">🧵</div>
              <h3 className="text-2xl font-serif font-bold text-natural-text opacity-40 italic">
                No designs found matching your search.
              </h3>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-natural-text/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setSelectedImage(null)}
          >
            <button className="absolute top-8 right-8 text-white p-2 hover:bg-white/10 rounded-full transition-all">
              <X className="w-8 h-8" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border-4 border-white/10"
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
