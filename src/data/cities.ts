// ACC schools (excluding UVA and UNC)
export const CAMPUS_TO_CITY: Record<string, string> = {
  'Boston College': 'Chestnut Hill, MA',
  'Clemson': 'Clemson, SC',
  'Duke': 'Durham, NC',
  'Florida State': 'Tallahassee, FL',
  'FSU': 'Tallahassee, FL',
  'Georgia Tech': 'Atlanta, GA',
  'Louisville': 'Louisville, KY',
  'Miami': 'Coral Gables, FL',
  'NC State': 'Raleigh, NC',
  'Notre Dame': 'South Bend, IN',
  'Pitt': 'Pittsburgh, PA',
  'Syracuse': 'Syracuse, NY',
  'Virginia Tech': 'Blacksburg, VA',
  'VT': 'Blacksburg, VA',
  'Wake Forest': 'Winston-Salem, NC',
  'Cal': 'Berkeley, CA',
  'SMU': 'Dallas, TX',
  'Stanford': 'Stanford, CA',
};

// Lat/lng for each city (for map pins)
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Chestnut Hill, MA': { lat: 42.3355, lng: -71.1685 },
  'Clemson, SC': { lat: 34.6834, lng: -82.8374 },
  'Durham, NC': { lat: 35.9940, lng: -78.8986 },
  'Tallahassee, FL': { lat: 30.4383, lng: -84.2807 },
  'Atlanta, GA': { lat: 33.7490, lng: -84.3880 },
  'Louisville, KY': { lat: 38.2527, lng: -85.7585 },
  'Coral Gables, FL': { lat: 25.7215, lng: -80.2684 },
  'Raleigh, NC': { lat: 35.7796, lng: -78.6382 },
  'South Bend, IN': { lat: 41.6764, lng: -86.2520 },
  'Pittsburgh, PA': { lat: 40.4406, lng: -79.9959 },
  'Syracuse, NY': { lat: 43.0481, lng: -76.1474 },
  'Blacksburg, VA': { lat: 37.2296, lng: -80.4139 },
  'Winston-Salem, NC': { lat: 36.0999, lng: -80.2442 },
  'Berkeley, CA': { lat: 37.8716, lng: -122.2727 },
  'Dallas, TX': { lat: 32.7767, lng: -96.7970 },
  'Stanford, CA': { lat: 37.4275, lng: -122.1697 },
  'San Francisco, CA': { lat: 37.7749, lng: -122.4194 },
  'Chicago, IL': { lat: 41.8781, lng: -87.6298 },
  'Washington, DC': { lat: 38.9072, lng: -77.0369 },
};

export function cityFromCampus(campus: string): string | null {
  if (!campus) return null;
  if (CAMPUS_TO_CITY[campus]) return CAMPUS_TO_CITY[campus];
  const lower = campus.toLowerCase().trim();
  for (const [key, city] of Object.entries(CAMPUS_TO_CITY)) {
    if (lower === key.toLowerCase()) return city;
  }
  for (const [key, city] of Object.entries(CAMPUS_TO_CITY)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return city;
  }
  return null;
}

// Get unique cities for leaderboard filtering
export function getAllCities(): string[] {
  return [...new Set(Object.values(CAMPUS_TO_CITY))].sort();
}

// Featured cities always shown in leaderboard
export const FEATURED_CITIES = ['San Francisco, CA', 'Chicago, IL', 'Washington, DC'];

// All selectable cities for non-university users
export function getSelectableCities(): string[] {
  return [...new Set([...FEATURED_CITIES, ...Object.values(CAMPUS_TO_CITY)])].sort();
}
