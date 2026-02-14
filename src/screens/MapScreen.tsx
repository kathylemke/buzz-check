import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { CITY_COORDINATES, CAMPUS_TO_CITY, CAMPUS_ABBREV, CITY_ABBREV } from '../data/cities';

type PinData = {
  name: string;
  abbrev: string;
  lat: number;
  lng: number;
  count: number;
  drinks: { drink_name: string; username: string; created_at: string; rating: number | null }[];
};

type MapMode = 'campus';

function WebMap({ pinData, onPinClick, colors }: { pinData: PinData[]; onPinClick: (pin: PinData) => void; colors: any }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const loadLeaflet = (): Promise<any> => {
      if ((window as any).L) return Promise.resolve((window as any).L);
      return new Promise((resolve, reject) => {
        if (document.getElementById('leaflet-js')) {
          const check = setInterval(() => {
            if ((window as any).L) { clearInterval(check); resolve((window as any).L); }
          }, 100);
          setTimeout(() => { clearInterval(check); reject('timeout'); }, 10000);
          return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve((window as any).L);
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    let cancelled = false;
    loadLeaflet().then(L => {
      if (cancelled || !containerRef.current) return;

      // Initialize map only once
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current).setView([39.5, -98.35], 4);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; OSM',
        }).addTo(mapRef.current);
      }

      // Clear old markers
      markersRef.current.forEach(m => mapRef.current.removeLayer(m));
      markersRef.current = [];

      const maxCount = Math.max(...pinData.map(c => c.count), 1);

      pinData.forEach(pin => {
        const pinSize = Math.max(28, Math.min(50, 28 + (pin.count / maxCount) * 22));
        const pinColor = colors.neonGreen;

        const iconHtml = `
          <div style="position:relative;width:${pinSize}px;display:flex;flex-direction:column;align-items:center;">
            <div style="
              background:${pinColor};
              color:#000;
              font-weight:900;
              font-size:${Math.max(9, pinSize * 0.28)}px;
              padding:${pinSize*0.1}px ${pinSize*0.15}px;
              border-radius:6px;
              text-align:center;
              white-space:nowrap;
              box-shadow:0 2px 6px rgba(0,0,0,0.4);
              border:2px solid rgba(0,0,0,0.2);
              line-height:1.2;
            ">
              ${pin.abbrev}
              <div style="font-size:${Math.max(7, pinSize * 0.2)}px;font-weight:700;opacity:0.7;">${pin.count}</div>
            </div>
            <div style="
              width:0;height:0;
              border-left:6px solid transparent;
              border-right:6px solid transparent;
              border-top:8px solid ${pinColor};
              margin-top:-1px;
            "></div>
          </div>
        `;

        const icon = L.divIcon({
          html: iconHtml,
          className: '',
          iconSize: [pinSize, pinSize + 10],
          iconAnchor: [pinSize / 2, pinSize + 8],
        });

        const marker = L.marker([pin.lat, pin.lng], { icon }).addTo(mapRef.current);
        marker.on('click', () => onPinClick(pin));
        markersRef.current.push(marker);
      });

      setTimeout(() => mapRef.current?.invalidateSize(), 100);
    }).catch(err => console.error('Leaflet load failed:', err));

    return () => { cancelled = true; };
  }, [pinData, colors.neonGreen]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 16 }}
    />
  );
}

export default function MapScreen() {
  const { colors } = useTheme();
  const [pinData, setPinData] = useState<PinData[]>([]);
  const [selectedPin, setSelectedPin] = useState<PinData | null>(null);
  const [loading, setLoading] = useState(true);
  const mapMode: MapMode = 'campus';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setSelectedPin(null);

    const { data: posts } = await supabase
      .from('bc_posts')
      .select('drink_name, city, created_at, rating, user_id')
      .not('city', 'is', null);

    if (!posts || posts.length === 0) {
      setPinData([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: users } = await supabase.from('bc_users').select('id, username, campus, city').in('id', userIds);
    const userMap: Record<string, string> = {};
    const userCampus: Record<string, string> = {};
    (users || []).forEach(u => {
      userMap[u.id] = u.username;
      if (u.campus) userCampus[u.id] = u.campus;
    });

    if (mapMode === 'campus') {
      // Group by campus
      const grouped: Record<string, PinData> = {};
      for (const p of posts) {
        const campus = userCampus[p.user_id];
        if (!campus) continue;
        const city = CAMPUS_TO_CITY[campus];
        if (!city) continue;
        const coords = CITY_COORDINATES[city];
        if (!coords) continue;
        const abbrev = CAMPUS_ABBREV[campus] || campus.substring(0, 3).toUpperCase();
        if (!grouped[campus]) {
          grouped[campus] = { name: campus, abbrev, lat: coords.lat, lng: coords.lng, count: 0, drinks: [] };
        }
        grouped[campus].count++;
        grouped[campus].drinks.push({
          drink_name: p.drink_name,
          username: userMap[p.user_id] || '?',
          created_at: p.created_at,
          rating: p.rating,
        });
      }
      for (const pin of Object.values(grouped)) {
        pin.drinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      setPinData(Object.values(grouped).sort((a, b) => b.count - a.count));
    } else {
      // Group by city
      const grouped: Record<string, PinData> = {};
      for (const p of posts) {
        if (!p.city) continue;
        const coords = CITY_COORDINATES[p.city];
        if (!coords) continue;
        const abbrev = CITY_ABBREV[p.city] || p.city.split(',')[0].substring(0, 3).toUpperCase();
        if (!grouped[p.city]) {
          grouped[p.city] = { name: p.city, abbrev, lat: coords.lat, lng: coords.lng, count: 0, drinks: [] };
        }
        grouped[p.city].count++;
        grouped[p.city].drinks.push({
          drink_name: p.drink_name,
          username: userMap[p.user_id] || '?',
          created_at: p.created_at,
          rating: p.rating,
        });
      }
      for (const pin of Object.values(grouped)) {
        pin.drinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }
      setPinData(Object.values(grouped).sort((a, b) => b.count - a.count));
    }

    setLoading(false);
  }, [mapMode]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.neonGreen }]}>🗺️ L.I.D. Map</Text>


      {loading ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 60 }}>Loading...</Text>
      ) : pinData.length === 0 ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 60 }}>No location data yet</Text>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ flex: selectedPin ? 0.55 : 1, borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
            {Platform.OS === 'web' ? (
              <WebMap pinData={pinData} onPinClick={setSelectedPin} colors={colors} />
            ) : (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Map is only available on web</Text>
            )}
          </View>

          {selectedPin && (
            <View style={{ flex: 0.45 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: colors.text, fontSize: fonts.sizes.lg, fontWeight: '800' }}>
                  📍 {selectedPin.name}
                </Text>
                <TouchableOpacity onPress={() => setSelectedPin(null)}>
                  <Text style={{ color: colors.textSecondary, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.neonGreen, fontWeight: '700', marginBottom: 8 }}>
                {selectedPin.count} drink{selectedPin.count !== 1 ? 's' : ''} checked in
              </Text>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {selectedPin.drinks.map((d, i) => (
                  <View key={i} style={[s.drinkRow, { backgroundColor: colors.surface, borderColor: colors.cardBorder }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '600', fontSize: fonts.sizes.md }}>{d.drink_name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: fonts.sizes.xs }}>by {d.username}</Text>
                    </View>
                    {d.rating && (
                      <Text style={{ color: colors.electricBlue, fontWeight: '700', fontSize: fonts.sizes.sm }}>
                        {d.rating}/10
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', padding: 16, paddingTop: 60, paddingBottom: 8 },
  toggleRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, borderRadius: 10, padding: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  toggleText: { fontWeight: '700', fontSize: fonts.sizes.xs },
  drinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
});
