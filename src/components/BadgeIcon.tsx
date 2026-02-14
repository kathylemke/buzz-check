import React, { useRef, useEffect } from 'react';
import { View, Platform } from 'react-native';

type Props = {
  badgeName: string;
  size?: number;
  locked?: boolean;
};

// Each badge: shape + inner icon, all SVG
const badgeConfigs: Record<string, { shape: (s: number) => string; icon: (s: number) => string; bg: string; fg: string }> = {
  'First Energy': {
    bg: '#FFD700',
    fg: '#FFA500',
    shape: (s) => { const c = s/2; const r = s*0.45; return Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return`${c+r*Math.cos(a)},${c+r*Math.sin(a)}`}).join(' '); },
    icon: (s) => `<path d="${s*0.5},${s*0.22} ${s*0.58},${s*0.42} ${s*0.68},${s*0.42} ${s*0.55},${s*0.55} ${s*0.6},${s*0.75} ${s*0.5},${s*0.65} ${s*0.4},${s*0.75} ${s*0.45},${s*0.55} ${s*0.32},${s*0.42} ${s*0.42},${s*0.42}Z" fill="#FFF" opacity="0.95"/>`,
  },
  'First Protein': {
    bg: '#E53E3E',
    fg: '#C53030',
    shape: (s) => `circle:${s/2},${s/2},${s*0.43}`,
    icon: (s) => `<path d="M${s*0.38},${s*0.65} Q${s*0.35},${s*0.45} ${s*0.42},${s*0.35} Q${s*0.48},${s*0.25} ${s*0.52},${s*0.28} L${s*0.55},${s*0.35} Q${s*0.62},${s*0.28} ${s*0.68},${s*0.32} Q${s*0.72},${s*0.38} ${s*0.65},${s*0.42} L${s*0.58},${s*0.48} Q${s*0.65},${s*0.55} ${s*0.62},${s*0.65} Z" fill="#FFF" opacity="0.95"/>`,
  },
  'First Coffee': {
    bg: '#8B6914',
    fg: '#6B4F12',
    shape: (s) => `diamond:${s/2},${s*0.1},${s*0.9},${s/2},${s/2},${s*0.9},${s*0.1},${s/2}`,
    icon: (s) => `<rect x="${s*0.35}" y="${s*0.42}" width="${s*0.22}" height="${s*0.22}" rx="${s*0.03}" fill="#FFF" opacity="0.95"/><path d="M${s*0.57},${s*0.47} Q${s*0.65},${s*0.47} ${s*0.65},${s*0.53} Q${s*0.65},${s*0.59} ${s*0.57},${s*0.59}" fill="none" stroke="#FFF" stroke-width="${s*0.025}" opacity="0.95"/><path d="M${s*0.40},${s*0.35} Q${s*0.43},${s*0.28} ${s*0.46},${s*0.35}" fill="none" stroke="#FFF" stroke-width="${s*0.02}" opacity="0.7"/><path d="M${s*0.47},${s*0.33} Q${s*0.50},${s*0.26} ${s*0.53},${s*0.33}" fill="none" stroke="#FFF" stroke-width="${s*0.02}" opacity="0.7"/>`,
  },
  'First Pre-Workout': {
    bg: '#FF6B00',
    fg: '#E55A00',
    shape: (s) => { const c=s/2; const r1=s*0.45; const r2=s*0.25; return Array.from({length:10},(_,i)=>{const a=Math.PI/5*i-Math.PI/2;const r=i%2===0?r1:r2;return`${c+r*Math.cos(a)},${c+r*Math.sin(a)}`}).join(' '); },
    icon: (s) => `<path d="M${s*0.5},${s*0.25} Q${s*0.55},${s*0.35} ${s*0.58},${s*0.45} Q${s*0.62},${s*0.55} ${s*0.55},${s*0.65} Q${s*0.53},${s*0.58} ${s*0.52},${s*0.55} Q${s*0.50},${s*0.65} ${s*0.45},${s*0.65} Q${s*0.38},${s*0.55} ${s*0.42},${s*0.45} Q${s*0.45},${s*0.35} ${s*0.5},${s*0.25}Z" fill="#FFF" opacity="0.95"/>`,
  },
  'First Supplements': {
    bg: '#805AD5',
    fg: '#6B46C1',
    shape: (s) => `shield:${s*0.15},${s*0.15},${s*0.7},${s*0.75}`,
    icon: (s) => `<rect x="${s*0.35}" y="${s*0.35}" width="${s*0.3}" height="${s*0.15}" rx="${s*0.075}" fill="#FFF" opacity="0.95"/><line x1="${s*0.5}" y1="${s*0.35}" x2="${s*0.5}" y2="${s*0.5}" stroke="${'#805AD5'}" stroke-width="${s*0.01}"/>`,
  },
  'First Electrolytes': {
    bg: '#3182CE',
    fg: '#2B6CB0',
    shape: (s) => { const c=s/2; const r=s*0.45; return Array.from({length:6},(_,i)=>{const a=Math.PI/3*i-Math.PI/6;return`${c+r*Math.cos(a)},${c+r*Math.sin(a)}`}).join(' '); },
    icon: (s) => `<path d="M${s*0.5},${s*0.28} Q${s*0.58},${s*0.42} ${s*0.58},${s*0.52} Q${s*0.58},${s*0.65} ${s*0.5},${s*0.68} Q${s*0.42},${s*0.65} ${s*0.42},${s*0.52} Q${s*0.42},${s*0.42} ${s*0.5},${s*0.28}Z" fill="#FFF" opacity="0.95"/>`,
  },
  'First Other': {
    bg: '#38A169',
    fg: '#2F855A',
    shape: (s) => `roundrect:${s*0.1},${s*0.1},${s*0.8},${s*0.8},${s*0.15}`,
    icon: (s) => `<rect x="${s*0.38}" y="${s*0.35}" width="${s*0.18}" height="${s*0.28}" rx="${s*0.03}" fill="#FFF" opacity="0.95"/><rect x="${s*0.35}" y="${s*0.32}" width="${s*0.24}" height="${s*0.06}" rx="${s*0.03}" fill="#FFF" opacity="0.95"/>`,
  },
  'Brand Explorer': {
    bg: '#319795',
    fg: '#2C7A7B',
    shape: (s) => `shield:${s*0.15},${s*0.15},${s*0.7},${s*0.75}`,
    icon: (s) => `<circle cx="${s*0.5}" cy="${s*0.48}" r="${s*0.14}" fill="none" stroke="#FFF" stroke-width="${s*0.025}" opacity="0.95"/><line x1="${s*0.5}" y1="${s*0.34}" x2="${s*0.5}" y2="${s*0.62}" stroke="#FFF" stroke-width="${s*0.02}" opacity="0.9"/><line x1="${s*0.36}" y1="${s*0.48}" x2="${s*0.64}" y2="${s*0.48}" stroke="#FFF" stroke-width="${s*0.02}" opacity="0.9"/><path d="M${s*0.5},${s*0.32} L${s*0.53},${s*0.36} L${s*0.47},${s*0.36}Z" fill="#FFF" opacity="0.95"/>`,
  },
  'Flavor Master': {
    bg: '#E53E3E',
    fg: '#DD6B20',
    shape: (s) => { const c=s/2; const r1=s*0.45; const r2=s*0.25; return Array.from({length:10},(_,i)=>{const a=Math.PI/5*i-Math.PI/2;const r=i%2===0?r1:r2;return`${c+r*Math.cos(a)},${c+r*Math.sin(a)}`}).join(' '); },
    icon: (s) => `<circle cx="${s*0.42}" cy="${s*0.42}" r="${s*0.06}" fill="#FF6B6B"/><circle cx="${s*0.55}" cy="${s*0.38}" r="${s*0.06}" fill="#FBBF24"/><circle cx="${s*0.48}" cy="${s*0.52}" r="${s*0.06}" fill="#48BB78"/><circle cx="${s*0.58}" cy="${s*0.50}" r="${s*0.06}" fill="#63B3ED"/><circle cx="${s*0.38}" cy="${s*0.55}" r="${s*0.05}" fill="#D53F8C"/>`,
  },
  'Early Bird': {
    bg: '#ED8936',
    fg: '#DD6B20',
    shape: (s) => `circle:${s/2},${s/2},${s*0.43}`,
    icon: (s) => `<path d="M${s*0.3},${s*0.55} Q${s*0.5},${s*0.28} ${s*0.7},${s*0.55}" fill="#FFF" opacity="0.3"/><circle cx="${s*0.5}" cy="${s*0.55}" r="${s*0.1}" fill="#FBBF24"/><line x1="${s*0.5}" y1="${s*0.38}" x2="${s*0.5}" y2="${s*0.42}" stroke="#FBBF24" stroke-width="${s*0.025}"/><line x1="${s*0.38}" y1="${s*0.45}" x2="${s*0.41}" y2="${s*0.48}" stroke="#FBBF24" stroke-width="${s*0.025}"/><line x1="${s*0.62}" y1="${s*0.45}" x2="${s*0.59}" y2="${s*0.48}" stroke="#FBBF24" stroke-width="${s*0.025}"/>`,
  },
  'Night Owl': {
    bg: '#6B46C1',
    fg: '#553C9A',
    shape: (s) => `crescent:${s}`,
    icon: (s) => `<circle cx="${s*0.42}" cy="${s*0.45}" r="${s*0.06}" fill="#FBBF24"/><circle cx="${s*0.58}" cy="${s*0.45}" r="${s*0.06}" fill="#FBBF24"/><circle cx="${s*0.42}" cy="${s*0.45}" r="${s*0.03}" fill="#1A202C"/><circle cx="${s*0.58}" cy="${s*0.45}" r="${s*0.03}" fill="#1A202C"/><path d="M${s*0.45},${s*0.56} Q${s*0.5},${s*0.6} ${s*0.55},${s*0.56}" fill="none" stroke="#FBBF24" stroke-width="${s*0.015}"/>`,
  },
  '3-Day Streak': {
    bg: '#CD7F32',
    fg: '#A0522D',
    shape: (s) => `roundrect:${s*0.12},${s*0.08},${s*0.76},${s*0.84},${s*0.12}`,
    icon: (s) => `<path d="M${s*0.5},${s*0.32} Q${s*0.54},${s*0.40} ${s*0.56},${s*0.48} Q${s*0.58},${s*0.56} ${s*0.53},${s*0.62} Q${s*0.50},${s*0.56} ${s*0.48},${s*0.55} Q${s*0.46},${s*0.62} ${s*0.44},${s*0.62} Q${s*0.40},${s*0.55} ${s*0.44},${s*0.48} Q${s*0.46},${s*0.40} ${s*0.5},${s*0.32}Z" fill="#FF6B35" opacity="0.95"/>`,
  },
  '7-Day Streak': {
    bg: '#C0C0C0',
    fg: '#A0A0A0',
    shape: (s) => `roundrect:${s*0.12},${s*0.08},${s*0.76},${s*0.84},${s*0.12}`,
    icon: (s) => `<path d="M${s*0.5},${s*0.26} Q${s*0.56},${s*0.36} ${s*0.60},${s*0.46} Q${s*0.64},${s*0.56} ${s*0.56},${s*0.66} Q${s*0.52},${s*0.58} ${s*0.50},${s*0.55} Q${s*0.48},${s*0.66} ${s*0.42},${s*0.66} Q${s*0.36},${s*0.56} ${s*0.40},${s*0.46} Q${s*0.44},${s*0.36} ${s*0.5},${s*0.26}Z" fill="#FF4500" opacity="0.95"/>`,
  },
  '30-Day Streak': {
    bg: '#FFD700',
    fg: '#DAA520',
    shape: (s) => `roundrect:${s*0.12},${s*0.08},${s*0.76},${s*0.84},${s*0.12}`,
    icon: (s) => `<path d="M${s*0.5},${s*0.30} L${s*0.55},${s*0.42} L${s*0.65},${s*0.42} L${s*0.57},${s*0.50} L${s*0.60},${s*0.62} L${s*0.5},${s*0.55} L${s*0.40},${s*0.62} L${s*0.43},${s*0.50} L${s*0.35},${s*0.42} L${s*0.45},${s*0.42}Z" fill="#FFF" opacity="0.95"/><path d="M${s*0.38},${s*0.42} L${s*0.5},${s*0.32} L${s*0.62},${s*0.42}" fill="none" stroke="#FFF" stroke-width="${s*0.02}" opacity="0.8"/>`,
  },
  'Social Butterfly': {
    bg: '#ED64A6',
    fg: '#D53F8C',
    shape: (s) => `heart:${s}`,
    icon: (s) => `<path d="M${s*0.5},${s*0.40} Q${s*0.42},${s*0.36} ${s*0.38},${s*0.42} Q${s*0.34},${s*0.50} ${s*0.42},${s*0.56} L${s*0.5},${s*0.52}" fill="#FFF" opacity="0.85"/><path d="M${s*0.5},${s*0.40} Q${s*0.58},${s*0.36} ${s*0.62},${s*0.42} Q${s*0.66},${s*0.50} ${s*0.58},${s*0.56} L${s*0.5},${s*0.52}" fill="#FFF" opacity="0.85"/>`,
  },
  'Trendsetter': {
    bg: '#D69E2E',
    fg: '#B7791F',
    shape: (s) => `shield:${s*0.15},${s*0.15},${s*0.7},${s*0.75}`,
    icon: (s) => { const c=s*0.5; const y=s*0.46; return `<polygon points="${c},${y-s*0.14} ${c+s*0.04},${y-s*0.04} ${c+s*0.14},${y-s*0.02} ${c+s*0.06},${y+s*0.05} ${c+s*0.09},${y+s*0.14} ${c},${y+s*0.08} ${c-s*0.09},${y+s*0.14} ${c-s*0.06},${y+s*0.05} ${c-s*0.14},${y-s*0.02} ${c-s*0.04},${y-s*0.04}" fill="#FFF" opacity="0.95"/>`; },
  },
  'Top Reviewer': {
    bg: '#38A169',
    fg: '#2F855A',
    shape: (s) => `roundrect:${s*0.12},${s*0.08},${s*0.76},${s*0.84},${s*0.12}`,
    icon: (s) => `<rect x="${s*0.38}" y="${s*0.32}" width="${s*0.22}" height="${s*0.30}" rx="${s*0.02}" fill="#FFF" opacity="0.95"/><line x1="${s*0.42}" y1="${s*0.40}" x2="${s*0.56}" y2="${s*0.40}" stroke="${'#38A169'}" stroke-width="${s*0.015}"/><line x1="${s*0.42}" y1="${s*0.46}" x2="${s*0.54}" y2="${s*0.46}" stroke="${'#38A169'}" stroke-width="${s*0.015}"/><line x1="${s*0.42}" y1="${s*0.52}" x2="${s*0.50}" y2="${s*0.52}" stroke="${'#38A169'}" stroke-width="${s*0.015}"/><path d="M${s*0.54},${s*0.56} L${s*0.58},${s*0.60} L${s*0.54},${s*0.64} L${s*0.58},${s*0.60}" fill="none" stroke="#FFF" stroke-width="${s*0.02}"/>`,
  },
};

function renderShape(shapeStr: string, s: number, fillColor: string, strokeColor: string): string {
  if (shapeStr.startsWith('circle:')) {
    const [cx, cy, r] = shapeStr.replace('circle:', '').split(',').map(Number);
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${s*0.03}"/>`;
  }
  if (shapeStr.startsWith('shield:')) {
    const [x, y, w, h] = shapeStr.replace('shield:', '').split(',').map(Number);
    const cx = x + w/2;
    return `<path d="M${x},${y+h*0.15} Q${x},${y} ${cx},${y} Q${x+w},${y} ${x+w},${y+h*0.15} L${x+w},${y+h*0.55} Q${x+w},${y+h*0.8} ${cx},${y+h} Q${x},${y+h*0.8} ${x},${y+h*0.55}Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${s*0.03}"/>`;
  }
  if (shapeStr.startsWith('diamond:')) {
    const pts = shapeStr.replace('diamond:', '');
    return `<polygon points="${pts}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${s*0.03}"/>`;
  }
  if (shapeStr.startsWith('roundrect:')) {
    const [x, y, w, h, r] = shapeStr.replace('roundrect:', '').split(',').map(Number);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${s*0.03}"/>`;
  }
  if (shapeStr.startsWith('crescent:')) {
    const sz = Number(shapeStr.replace('crescent:', ''));
    const cx = sz/2, cy = sz/2, r = sz*0.42;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sz*0.03}"/><circle cx="${cx+sz*0.12}" cy="${cy-sz*0.08}" r="${r*0.7}" fill="${fillColor}" opacity="0.3"/>`;
  }
  if (shapeStr.startsWith('heart:')) {
    const sz = Number(shapeStr.replace('heart:', ''));
    const cx = sz/2;
    return `<path d="M${cx},${sz*0.75} Q${sz*0.15},${sz*0.55} ${sz*0.15},${sz*0.38} Q${sz*0.15},${sz*0.2} ${cx},${sz*0.3} Q${sz*0.85},${sz*0.2} ${sz*0.85},${sz*0.38} Q${sz*0.85},${sz*0.55} ${cx},${sz*0.75}Z" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sz*0.03}"/>`;
  }
  // polygon (hexagon, star, etc.)
  return `<polygon points="${shapeStr}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${s*0.03}"/>`;
}

export default function BadgeIcon({ badgeName, size = 48, locked = false }: Props) {
  const config = badgeConfigs[badgeName];
  const containerRef = useRef<any>(null);

  if (!config) {
    // fallback
    const fallbackRef = useRef<any>(null);
    useEffect(() => {
      if (Platform.OS === 'web' && fallbackRef.current) {
        const el = fallbackRef.current as unknown as HTMLElement;
        el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size/2}" cy="${size/2}" r="${size*0.4}" fill="${locked ? '#555' : '#718096'}" stroke="${locked ? '#444' : '#5A6577'}" stroke-width="${size*0.03}"/><text x="${size/2}" y="${size*0.58}" text-anchor="middle" fill="white" font-size="${size*0.35}" font-weight="bold">?</text></svg>`;
      }
    }, [size, locked]);
    return <View ref={fallbackRef} style={{ width: size, height: size }} />;
  }

  const s = size;
  const bg = locked ? '#555' : config.bg;
  const stroke = locked ? '#444' : config.fg;

  const shapeStr = typeof config.shape === 'function' ? config.shape(s) : config.shape;
  const shapeSvg = renderShape(shapeStr, s, bg, stroke);
  const iconSvg = locked ? '' : config.icon(s);

  // Lock overlay for locked badges
  const lockSvg = locked ? `
    <rect x="${s*0.35}" y="${s*0.45}" width="${s*0.3}" height="${s*0.22}" rx="${s*0.04}" fill="#333" stroke="#666" stroke-width="${s*0.015}"/>
    <path d="M${s*0.40},${s*0.45} L${s*0.40},${s*0.38} Q${s*0.40},${s*0.28} ${s*0.50},${s*0.28} Q${s*0.60},${s*0.28} ${s*0.60},${s*0.38} L${s*0.60},${s*0.45}" fill="none" stroke="#666" stroke-width="${s*0.025}"/>
    <circle cx="${s*0.50}" cy="${s*0.54}" r="${s*0.025}" fill="#999"/>
  ` : '';

  // Drop shadow + glow for unlocked
  const glowFilter = locked ? '' : `
    <defs>
      <filter id="glow-${badgeName.replace(/\s/g,'')}" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="${s*0.02}" stdDeviation="${s*0.03}" flood-color="${config.bg}" flood-opacity="0.4"/>
      </filter>
    </defs>
  `;
  const filterAttr = locked ? '' : `filter="url(#glow-${badgeName.replace(/\s/g,'')})"`;

  const svgContent = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">
    ${glowFilter}
    <g ${filterAttr}>
      ${shapeSvg}
      ${iconSvg}
    </g>
    ${lockSvg}
  </svg>`;

  useEffect(() => {
    if (Platform.OS === 'web' && containerRef.current) {
      const el = containerRef.current as unknown as HTMLElement;
      el.innerHTML = svgContent;
    }
  }, [svgContent]);

  return <View ref={containerRef} style={{ width: size, height: size }} />;
}
