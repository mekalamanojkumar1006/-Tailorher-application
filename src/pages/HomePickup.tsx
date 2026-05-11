import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { APIProvider, Map, AdvancedMarker, Pin, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Truck, AlertCircle, CheckCircle2, Home, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';

const STORE_LOCATION = { lat: 17.3787, lng: 82.5290 }; // Nookalama Temple Backside, S.Suravaram, Tuni
const PICKUP_RADIUS_KM = 15;

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY);

function RadiusCircle({ radius }: { radius: number }) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    const circle = new google.maps.Circle({
      strokeColor: '#D4AF37',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#D4AF37',
      fillOpacity: 0.15,
      map,
      center: STORE_LOCATION,
      radius: radius * 1000, // meters
    });

    return () => circle.setMap(null);
  }, [map, mapsLib, radius]);

  return null;
}

export function HomePickup() {
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'eligible' | 'too-far' | 'error'>('idle');
  const navigate = useNavigate();

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleCheckLocation = () => {
    setStatus('checking');
    if (!navigator.geolocation) {
      setStatus('error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setUserLocation(location);
        
        const dist = calculateDistance(STORE_LOCATION.lat, STORE_LOCATION.lng, latitude, longitude);
        setDistance(dist);
        
        if (dist <= PICKUP_RADIUS_KM) {
          setStatus('eligible');
        } else {
          setStatus('too-far');
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatus('error');
      }
    );
  };

  if (!hasValidKey) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white p-10 rounded-[40px] shadow-xl border border-natural-gold/10">
          <AlertCircle className="w-16 h-16 text-natural-gold mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold text-natural-text mb-4">Maps Setup Required</h2>
          <p className="text-natural-text/60 mb-8">Please add your GOOGLE_MAPS_PLATFORM_KEY to continue with Home Pickup service.</p>
          <Link to="/" className="px-8 py-3 bg-natural-gold text-white rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-natural-gold/20">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-subtle flex flex-col">
      <div className="container mx-auto px-6 py-12 flex-1 flex flex-col">
        <Link to="/" className="flex items-center gap-2 text-natural-text/40 hover:text-natural-gold transition-colors mb-8 group w-fit">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-xs uppercase tracking-widest">Back to Home</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-1">
          {/* Info Side */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-natural-gold/10 text-natural-gold rounded-full">
              <Truck className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Premium Service</span>
            </div>
            
            <h1 className="text-5xl font-serif font-bold text-natural-text leading-tight">
              Home Pickup & <br /><span className="text-natural-gold italic">Doorstep Delivery</span>
            </h1>
            
            <p className="text-lg text-natural-text/60 leading-relaxed max-w-lg">
              Enjoy the luxury of bespoke tailoring from the comfort of your home. 
              We offer doorstep pickup within a 15km radius of our Suravaram boutique.
            </p>

            <div className="bg-white p-8 rounded-[40px] border border-natural-gold/10 shadow-xl shadow-natural-gold/5 space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-natural-gold/5 rounded-2xl text-natural-gold">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-natural-text/40 uppercase tracking-widest mb-1">Our Location</p>
                  <p className="font-medium text-natural-text">Nookalama Temple Backside, S.Suravaram, Tuni</p>
                </div>
              </div>

              {status === 'idle' && (
                <button 
                  onClick={handleCheckLocation}
                  className="w-full py-5 bg-natural-gold text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-natural-gold/20 hover:bg-natural-gold/90 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Navigation className="w-5 h-5" />
                  Check My Location
                </button>
              )}

              <AnimatePresence mode="wait">
                {status === 'checking' && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="py-6 text-center text-natural-gold font-bold uppercase text-xs tracking-widest animate-pulse"
                  >
                    Locating you...
                  </motion.div>
                )}

                {status === 'eligible' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-green-50 border border-green-100 rounded-3xl"
                  >
                    <div className="flex items-center gap-3 text-green-700 font-bold mb-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Eligible for Pickup!
                    </div>
                    <p className="text-sm text-green-600/70 mb-6">
                      You are approx {distance?.toFixed(1)}km away. Our executive can reach you.
                    </p>
                    <Link 
                      to="/booking?pickup=true" 
                      className="w-full block py-4 bg-green-600 text-white text-center rounded-2xl font-bold uppercase tracking-widest shadow-lg shadow-green-600/20"
                    >
                      Book a Pickup Now
                    </Link>
                  </motion.div>
                )}

                {status === 'too-far' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-red-50 border border-red-100 rounded-3xl"
                  >
                    <div className="flex items-center gap-3 text-red-700 font-bold mb-2">
                      <AlertCircle className="w-5 h-5" />
                      Outside Service Area
                    </div>
                    <p className="text-sm text-red-600/70 mb-6">
                      You are approx {distance?.toFixed(1)}km away. Currently we only serve within {PICKUP_RADIUS_KM}km.
                    </p>
                    <Link to="/booking" className="text-xs font-bold text-red-700 hover:underline uppercase tracking-widest">
                      Book an In-Store Appointment Instead
                    </Link>
                  </motion.div>
                )}

                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-orange-50 border border-orange-100 rounded-3xl"
                  >
                    <p className="text-sm text-orange-700 font-bold mb-4">Could not verify location. Please enable GPS permissions and try again.</p>
                    <button onClick={handleCheckLocation} className="text-xs font-bold text-orange-700 uppercase tracking-widest hover:underline">Retry</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Map Side */}
          <div className="h-[500px] lg:h-full min-h-[500px] bg-white rounded-[40px] border border-natural-gold/10 shadow-2xl relative overflow-hidden">
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                defaultCenter={STORE_LOCATION}
                defaultZoom={11}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                className="w-full h-full"
              >
                <AdvancedMarker position={STORE_LOCATION} title="TailorHer Boutique">
                  <div className="w-10 h-10 bg-natural-gold rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-serif font-bold text-lg">
                    T
                  </div>
                </AdvancedMarker>

                {userLocation && (
                  <AdvancedMarker position={userLocation} title="Your Location">
                    <Pin background="#FF70AB" glyphColor="#fff" />
                  </AdvancedMarker>
                )}

                <RadiusCircle radius={PICKUP_RADIUS_KM} />
              </Map>
            </APIProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
