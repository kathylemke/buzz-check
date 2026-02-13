export const CITIES = ['San Francisco', 'Chicago', 'Washington DC'] as const;
export type City = typeof CITIES[number];

export const CAMPUS_TO_CITY: Record<string, City> = {
  // SF
  'Stanford': 'San Francisco', 'USF': 'San Francisco', 'SFSU': 'San Francisco', 'Berkeley': 'San Francisco', 'UC Berkeley': 'San Francisco',
  // Chicago
  'Northwestern': 'Chicago', 'UChicago': 'Chicago', 'DePaul': 'Chicago', 'Loyola Chicago': 'Chicago', 'UIC': 'Chicago', 'IIT': 'Chicago',
  // DC
  'Georgetown': 'Washington DC', 'GWU': 'Washington DC', 'American': 'Washington DC', 'Howard': 'Washington DC', 'Catholic': 'Washington DC',
};

export function cityFromCampus(campus: string): City | null {
  // Direct match
  if (CAMPUS_TO_CITY[campus]) return CAMPUS_TO_CITY[campus];
  // Fuzzy match
  const lower = campus.toLowerCase();
  for (const [key, city] of Object.entries(CAMPUS_TO_CITY)) {
    if (lower.includes(key.toLowerCase())) return city;
  }
  return null;
}
