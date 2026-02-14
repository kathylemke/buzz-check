import React, { useEffect, useState, useCallback } from 'react';
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

function MapInner({ cityData, onPinClick, colors }: { cityData: CityData[]; onPinClick: (city: CityData) => void; colors: any }) {
  if (Platform.OS !== 'web') {
    return <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Map is only available on web</Text>;
  }

  // Dynamic imports for web only
  const [MapComponents, setMapComponents] = useState<any>(null);

  useEffect(() => {
    // Inject leaflet CSS
    if (typeof document !== 'undefined' && !document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamic import
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
    ]).then(([rl, L]) => {
      setMapComponents({ ...rl, L: L.default || L });
    }).catch(err => console.error('Failed to load map:', err));
  }, []);

  if (!MapComponents) {
    return <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40 }}>Loading map...</Text>;
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip } = MapComponents;
  const maxCount = Math.max(...cityData.map(c => c.count), 1);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ width: '100%', height: '100%', borderRadius: 16 }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        {cityData.map(city => {
          const radius = 10 + (city.count / maxCount) * 30;
          return (
            <CircleMarker
              key={city.city}
              center={[city.lat, city.lng]}
              radius={radius}
              pathOptions={{
                fillColor: colors.neonGreen,
                fillOpacity: 0.6,
                color: colors.neonGreen,
                weight: 2,
              }}
              eventHandlers={{ click: () => onPinClick(city) }}
            >
              <Tooltip direction="top" offset={[0, -radius]} opacity={0.95}>
                <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {city.city}<br />{city.count} drink{city.count !== 1 ? 's' : ''}
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default function MapScreen() {
  const { colors } = useTheme();
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // Get all posts with city
    const { data: posts } = await supabase
      .from('bc_posts')
      .select('drink_name, city, created_at, rating, user_id')
      .not('city', 'is', null);

    if (!posts || posts.length === 0) {
      setCityData([]);
      setLoading(false);
      return;
    }

    // Get usernames
    const userIds = [...new Set(posts.map(p => p.user_id))];
    const { data: users } = await supabase.from('bc_users').select('id, username').in('id', userIds);
    const userMap: Record<string, string> = {};
    (users || []).forEach(u => { userMap[u.id] = u.username; });

    // Group by city
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

    // Sort drinks within each city by most recent
    for (const city of Object.values(grouped)) {
      city.drinks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setCityData(Object.values(grouped).sort((a, b) => b.count - a.count));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <View style={[s.container, { backgroundColor: colors.bg }]}>
      <Text style={[s.title, { color: colors.neonGreen }]}>🗺️ Buzz Map</Text>

      {loading ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 60 }}>Loading...</Text>
      ) : cityData.length === 0 ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 60 }}>No location data yet</Text>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ flex: selectedCity ? 0.55 : 1, borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
            <MapInner cityData={cityData} onPinClick={setSelectedCity} colors={colors} />
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
