import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCw,
  Store as StoreIcon,
  Crosshair,
  ExternalLink,
  MapPin,
  AlertCircle,
  Tag
} from 'lucide-react';
import { ProductService } from '../../services/productService';
import type { Product } from '@insightz/shared';

declare global {
  interface Window {
    L?: any;
  }
}

interface NearbyShop {
  id: string;
  storeId: string;
  name: string;
  branch: string;
  address: string;
  lat: number;
  lng: number;
  discountBadge: string;
  phone: string;
  openingHours: string;
  offerTitle: string;
  image: string;
}

const NEARBY_SHOPS_DATA: NearbyShop[] = [
  {
    id: 'ham-col3',
    storeId: 'hameedia',
    name: 'Hameedia Luxury Boutique',
    branch: 'Kollupitiya Branch',
    address: '123 Galle Road, Colombo 03',
    lat: 6.9085,
    lng: 79.8512,
    discountBadge: '38% OFF',
    phone: '+94 11 234 5678',
    openingHours: '9:30 AM – 8:30 PM',
    offerTitle: 'Envoy London Luxury Collection',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'ham-wella',
    storeId: 'hameedia',
    name: 'Hameedia Flagship Store',
    branch: 'Wellawatte Store',
    address: '503 Galle Road, Colombo 06',
    lat: 6.8732,
    lng: 79.8606,
    discountBadge: '44% OFF',
    phone: '+94 11 258 1111',
    openingHours: '9:00 AM – 9:00 PM',
    offerTitle: 'Signature Formal Suits & Linen Shirts',
    image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cp-havelock',
    storeId: 'coolplanet',
    name: 'Cool Planet Havelock',
    branch: 'Havelock Town Outlet',
    address: '30 Havelock Road, Colombo 05',
    lat: 6.8850,
    lng: 79.8650,
    discountBadge: '38% OFF',
    phone: '+94 11 250 8888',
    openingHours: '9:30 AM – 9:00 PM',
    offerTitle: 'Footwear & Fashion Accessories Racks',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'day-col7',
    storeId: 'daydream',
    name: 'Daydream Designer Studio',
    branch: 'Colombo 07 Studio',
    address: 'Ward Place, Colombo 07',
    lat: 6.9167,
    lng: 79.8667,
    discountBadge: '38% OFF',
    phone: '+94 11 268 7777',
    openingHours: '10:00 AM – 8:00 PM',
    offerTitle: 'Designer Linens & Silks Special Drops',
    image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cp-nugegoda',
    storeId: 'coolplanet',
    name: 'Cool Planet Nugegoda',
    branch: 'Nugegoda Outlet',
    address: 'Stanley Thilakarathne Mw, Nugegoda',
    lat: 6.8722,
    lng: 79.8967,
    discountBadge: '38% OFF',
    phone: '+94 11 282 9999',
    openingHours: '9:30 AM – 9:00 PM',
    offerTitle: 'Buy 1 Get 1 Deals on Tops',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'cp-pela',
    storeId: 'coolplanet',
    name: 'Cool Planet Mega Mall',
    branch: 'Pelawatta Branch',
    address: 'Pannipitiya Road, Pelawatta, Battaramulla',
    lat: 6.8912,
    lng: 79.9275,
    discountBadge: '44% OFF',
    phone: '+94 11 278 6786',
    openingHours: '9:30 AM – 9:30 PM',
    offerTitle: 'Urban Casuals & Summer Wear Discounts',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'thila-kiri',
    storeId: 'thilakawardhana',
    name: 'Thilakawardhana Store',
    branch: 'Kiribathgoda Complex',
    address: 'Kandy Road, Kiribathgoda',
    lat: 6.9808,
    lng: 79.9287,
    discountBadge: '44% OFF',
    phone: '+94 11 291 5555',
    openingHours: '9:00 AM – 9:30 PM',
    offerTitle: 'City Men Deodorant & Apparel Sale',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'thila-jaela',
    storeId: 'thilakawardhana',
    name: 'Thilakawardhana Ja-Ela',
    branch: 'Ja-Ela Branch',
    address: 'Colombo - Negombo Road, Ja-Ela',
    lat: 7.0764,
    lng: 79.8928,
    discountBadge: '44% OFF',
    phone: '+94 11 224 8888',
    openingHours: '9:00 AM – 9:00 PM',
    offerTitle: 'Kids & Teens Seasonal Clearance',
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=400&q=80',
  },
];

export const NearMe: React.FC = () => {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const routeLineRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);

  // User Real GPS Location
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
    isRealGps: boolean;
  }>({
    lat: 6.9085,
    lng: 79.8512,
    address: 'Detecting live GPS location...',
    isRealGps: false,
  });

  const [locating, setLocating] = useState(false);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [liveProducts, setLiveProducts] = useState<Product[]>([]);

  // Haversine distance in KM
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
  };

  const fetchUserLiveLocation = () => {
    if (!navigator.geolocation) {
      setUserLocation({
        lat: 6.9085,
        lng: 79.8512,
        address: 'Galle Road, Colombo 03',
        isRealGps: false,
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let address = `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14`,
            { headers: { 'Accept-Language': 'en' } }
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const parts = data.display_name.split(',');
              address = parts.slice(0, 2).join(', ') + ' (Live GPS)';
            }
          }
        } catch {
          address = `Live GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        }

        setUserLocation({
          lat,
          lng,
          address,
          isRealGps: true,
        });
        setLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 13, { duration: 1 });
        }
      },
      () => {
        // Fallback if user denied geolocation or unavailable
        setUserLocation({
          lat: 6.9085,
          lng: 79.8512,
          address: 'Galle Road, Colombo 03 (Default GPS)',
          isRealGps: false,
        });
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Get real location on mount
  useEffect(() => {
    fetchUserLiveLocation();
  }, []);

  // Fetch real offers products
  useEffect(() => {
    ProductService.getProducts({ offer: true, limit: 10 })
      .then((res) => {
        if (Array.isArray(res?.products)) setLiveProducts(res.products);
      })
      .catch(() => {});
  }, []);

  // Filter: ONLY stores with distance <= 5.0 km (Strict 5km cutoff)
  const shopsWithin5km = useMemo(() => {
    return NEARBY_SHOPS_DATA
      .map((s, idx) => {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);
        const realProd = liveProducts[idx % (liveProducts.length || 1)];
        return {
          ...s,
          distanceKm: dist,
          image: realProd?.image_url || s.image,
          offerTitle: realProd?.title || s.offerTitle,
        };
      })
      .filter((s) => s.distanceKm <= 5.0) // ONLY within 5km!
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userLocation, liveProducts]);

  const selectedShop = useMemo(() => {
    return (
      shopsWithin5km.find((s) => s.id === selectedShopId) ||
      shopsWithin5km[0] ||
      null
    );
  }, [shopsWithin5km, selectedShopId]);

  // Leaflet Real Map & Strictly <= 5km Markers
  useEffect(() => {
    const L = window.L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.lat, userLocation.lng],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // 1. User Real Location Marker
    const userIconHtml = `
      <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -50%);">
        <div style="width:36px; height:36px; border-radius:50%; background:white; border:4px solid #0f172a; box-shadow:0 4px 14px rgba(0,0,0,0.25); display:flex; align-items:center; justify-content:center;">
          <div style="width:12px; height:12px; border-radius:50%; background:#0f172a;"></div>
        </div>
        <div style="margin-top:4px; padding:2px 8px; background:#0f172a; color:white; font-size:10px; font-weight:800; border-radius:999px; box-shadow:0 2px 6px rgba(0,0,0,0.2); white-space:nowrap;">
          Your Location
        </div>
      </div>
    `;

    const userDivIcon = L.divIcon({
      className: 'custom-user-marker',
      html: userIconHtml,
      iconSize: [0, 0],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userDivIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    // 2. Exact 5000m (5km) Shopping Radius Circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      radiusCircleRef.current.setRadius(5000);
    } else {
      radiusCircleRef.current = L.circle([userLocation.lat, userLocation.lng], {
        radius: 5000, // 5km strict
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.04,
        weight: 1.5,
        dashArray: '6, 6',
      }).addTo(map);
    }

    // 3. Clear & Render ONLY <= 5km Store Markers
    Object.values(markersRef.current).forEach((m: any) => m.remove());
    markersRef.current = {};

    shopsWithin5km.forEach((shop) => {
      const isSelected = selectedShop?.id === shop.id;

      const storeIconHtml = `
        <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); cursor:pointer; transition:all 0.2s ease;">
          <div style="padding:2px 8px; border-radius:999px; background:${isSelected ? '#dc2626' : '#ef4444'}; color:white; font-size:10px; font-weight:900; letter-spacing:0.5px; box-shadow:0 3px 8px rgba(239,68,68,0.4); text-transform:uppercase; transform:${isSelected ? 'scale(1.1)' : 'scale(1)'}; transition:all 0.2s;">
            ${shop.discountBadge}
          </div>
          <div style="width:36px; height:36px; border-radius:50%; background:white; border:${isSelected ? '3px solid #0f172a' : '2px solid #cbd5e1'}; box-shadow:0 4px 12px rgba(0,0,0,0.18); display:flex; align-items:center; justify-content:center; margin-top:2px; transform:${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition:all 0.2s;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? '#0f172a' : '#475569'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
              <path d="M2 7h20"/>
            </svg>
          </div>
        </div>
      `;

      const storeDivIcon = L.divIcon({
        className: `custom-store-marker-${shop.id}`,
        html: storeIconHtml,
        iconSize: [0, 0],
      });

      const marker = L.marker([shop.lat, shop.lng], {
        icon: storeDivIcon,
        zIndexOffset: isSelected ? 500 : 100,
      }).addTo(map);

      marker.on('click', () => {
        setSelectedShopId(shop.id);
        const cardEl = document.getElementById(`shop-card-${shop.id}`);
        cardEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });

      markersRef.current[shop.id] = marker;
    });

    // 4. Route line to selected store (only if within 5km)
    if (selectedShop) {
      if (routeLineRef.current) {
        routeLineRef.current.setLatLngs([
          [userLocation.lat, userLocation.lng],
          [selectedShop.lat, selectedShop.lng],
        ]);
      } else {
        routeLineRef.current = L.polyline(
          [
            [userLocation.lat, userLocation.lng],
            [selectedShop.lat, selectedShop.lng],
          ],
          {
            color: '#0f172a',
            weight: 3,
            dashArray: '6, 6',
            opacity: 0.85,
          }
        ).addTo(map);
      }
    } else if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
  }, [userLocation, shopsWithin5km, selectedShop]);

  const handleSelectShopCard = (shop: NearbyShop) => {
    setSelectedShopId(shop.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([shop.lat, shop.lng], 14, { duration: 0.8 });
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([userLocation.lat, userLocation.lng], 13, { duration: 0.8 });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-70px)] min-h-[580px] bg-[#eef3f9] overflow-hidden flex flex-col justify-between font-sans select-none">
      {/* ── Top Floating Location Capsule ── */}
      <div className="absolute top-4 inset-x-4 z-[500] max-w-xl mx-auto flex items-center gap-2 pointer-events-auto">
        <button
          onClick={() => navigate(-1)}
          className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer border border-slate-100"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex-1 bg-white rounded-full px-4 py-2.5 shadow-lg flex items-center gap-3 min-w-0 border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
            <MapPin size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {userLocation.address}
            </h2>
            <p className="text-[11px] text-slate-500 truncate">
              {shopsWithin5km.length} stores with offers within 5km radius
            </p>
          </div>
        </div>

        <button
          onClick={fetchUserLiveLocation}
          className="w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-800 hover:bg-slate-50 transition-colors shrink-0 cursor-pointer border border-slate-100"
          title="Refresh location"
        >
          <RotateCw size={18} className={locating ? 'animate-spin text-blue-600' : ''} />
        </button>
      </div>

      {/* ── Real Leaflet Map Container ── */}
      <div className="relative flex-1 w-full h-full z-10">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Radius Badge */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] bg-white/95 px-3.5 py-1 rounded-full shadow-md border border-slate-200 text-[11px] font-bold text-slate-700 pointer-events-none flex items-center gap-1.5">
          <Tag size={12} className="text-red-500" />
          <span>Strict 5km Offer Radius</span>
        </div>

        {/* Recenter Floating Button on Bottom-Right */}
        <button
          onClick={handleRecenter}
          className="absolute bottom-48 right-5 z-[400] w-12 h-12 rounded-full bg-white text-slate-900 shadow-xl flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90 cursor-pointer border border-slate-200"
          title="Recenter Map"
        >
          <Crosshair size={22} />
        </button>
      </div>

      {/* ── Bottom Floating Carousel Sheet of In-Store Offer Cards ── */}
      <div className="relative z-[500] bg-white/95 backdrop-blur-md pt-3 pb-4 px-4 border-t border-slate-200/90 shadow-2xl">
        {/* Handle Bar */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3" />

        {shopsWithin5km.length > 0 ? (
          /* Horizontal Scrollable Shop Cards (Strictly <= 5km) */
          <div className="flex items-stretch gap-3 overflow-x-auto pb-1 scrollbar-none snap-x">
            {shopsWithin5km.map((shop) => {
              const isSelected = selectedShop?.id === shop.id;

              return (
                <div
                  key={shop.id}
                  id={`shop-card-${shop.id}`}
                  onClick={() => handleSelectShopCard(shop)}
                  className={`snap-start w-56 sm:w-64 bg-white rounded-2xl p-3.5 border transition-all shrink-0 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-lg scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Top Discount Tag & Image Frame */}
                    <div className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden mb-2.5 flex items-center justify-center">
                      {/* Red Pill Discount Badge */}
                      <div className="absolute top-2 left-2 z-10">
                        <span className="px-2 py-0.5 bg-[#ef4444] text-white text-[10px] font-black rounded-md shadow-xs">
                          {shop.discountBadge}
                        </span>
                      </div>

                      <img
                        src={shop.image}
                        alt={shop.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>

                    {/* Store Name */}
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {shop.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{shop.branch}</p>
                  </div>

                  {/* Distance & Action Footer */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-bold flex items-center gap-1.5 text-[11px]">
                      <StoreIcon size={13} className="text-slate-400" />
                      {shop.distanceKm} km
                    </span>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-800 text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <span>Directions</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State if No Store <= 5km */
          <div className="py-6 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-2">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-900">No Offers Found Within 5km</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              There are currently no partner stores with active in-store discounts within 5.0 km of your live GPS coordinates.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearMe;
