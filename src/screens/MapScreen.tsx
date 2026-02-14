import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fonts } from '../theme';
import { supabase } from '../lib/supabase';
import { CITY_COORDINATES } from '../data/cities';

type CityData = {
  city: string;
  lat: number;
  lng: number;
  count: number;
  drinks: { drink_name: string; username: string; created_at: string; rating: number | null }[];
};

function WebMap({ cityData, onPinClick, colors }: { cityData: CityData[]; onPinClick: (city: CityData) => void; colors: any }) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Load leaflet JS
    const loadLeaflet = (): Promise<any> => {
      if ((window as any).L) return Promise.resolve((window as any).L);
      return new Promise((resolve, reject) => {
        if (document.getElementById('leaflet-js')) {
          // Already loading, wait for it
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

      // Clean up existing map
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current).setView([39.5, -98.35], 4);
      mapRef.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM',
      }).addTo(map);

      const maxCount = Math.max(...cityData.map(c => c.count), 1);

      cityData.forEach(city => {
        const radius = 10 + (city.count / maxCount) * 30;
        const marker = L.circleMarker([city.lat, city.lng], {
          radius,
          fillColor: colors.neonGreen,
          fillOpacity: 0.6,
          color: colors.neonGreen,
          weight: 2,
        }).addTo(map);

        marker.bindTooltip(`<div style="text-align:center;font-weight:bold">${city.city}<br/>${city.count} drink${city.count !== 1 ? 's' : ''}</div>`, {
          direction: 'top',
          offset: [0, -radius],
        });

        marker.on('click', () => onPinClick(city));
      });

      // Force a resize after render
      setTimeout(() => map.invalidateSize(), 100);
    }).catch(err => console.error('Leaflet load failed:', err));

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [cityData, colors.neonGreen]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', borderRadius: 16 }}
    />
  );
}

export default function MapScreen() {
  const { colors } = useTheme();
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: posts } = await supabase
      .from('bc_posts')
      .select('drink_name, city, created_at, rating, user_id')
      .not('city', 'is', null);

    if (!posts || posts.length === 0) {
      setCityData([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: users } = await supabase.from('bc_users').select('id, username').in('id', userIds);
    const userMap: Record<string, string> = {};
    (users || []).forEach(u => { userMap[u.id] = u.username; });

    const grouped: Record<string, CityData> = {};
    for (const p of posts) {
      if (!p.city) continue;
      const coords = CITY_COORDINATES[p.city];
      if (!coords) continue;
      if (!grouped[p.city]) {
        grouped[p.city] = { city: p.city, lat: coords.lat, lng: coords.lng, count: 0, drinks: [] };
      }
      grouped[p.city].count++;
      grouped[p.city].drinks.push({
        drink_name: p.drink_name,
        username: userMap[p.user_id] || '?',
        created_at: p.created_at,
        rating: p.rating,
      });
    }

    for (const city of Object.values(grouped)) {
      city.drinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setCityData(Object.values(grouped).sort((a, b) => b.count - a.count));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.neonGreen }]}>🗺️ L.I.D. Map</Text>

      {loading ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 60 }}>Loading...</Text>
      ) : cityData.length === 0 ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 60 }}>No location data yet</Text>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ flex: selectedCity ? 0.55 : 1, borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
            {Platform.OS === 'web' ? (
              <WebMap cityData={cityData} onPinClick={setSelectedCity} colors={colors} />
            ) : (
              <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Map is only available on web</Text>
            )}
          </View>

          {selectedCity && (
            <View style={{ flex: 0.45 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: colors.text, fontSize: fonts.sizes.lg, fontWeight: '800' }}>
                  📍 {selectedCity.city}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCity(null)}>
                  <Text style={{ color: colors.textSecondary, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.neonGreen, fontWeight: '700', marginBottom: 8 }}>
                {selectedCity.count} drink{selectedCity.count !== 1 ? 's' : ''} checked in
              </Text>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {selectedCity.drinks.map((d, i) => (
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
  title: { fontSize: fonts.sizes.xl, fontWeight: '800', padding: 16, paddingTop: 60 },
  drinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
});
