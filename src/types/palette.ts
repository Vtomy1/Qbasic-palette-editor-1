/**
 * QBasic Palette Editor - Types and VGA Color Math
 * 
 * VGA DAC specifications:
 * - 18-bit color depth (6 bits per channel: Red 0-63, Green 0-63, Blue 0-63)
 * - 262,144 total possible hardware colors
 * - SCREEN 13 allows 256 simultaneous colors from this 262,144 color palette
 * - In QBasic:
 *     OUT &H3C8, index
 *     OUT &H3C9, red (0-63)
 *     OUT &H3C9, green (0-63)
 *     OUT &H3C9, blue (0-63)
 */

export interface RGB6 {
  r: number; // 0 - 63
  g: number; // 0 - 63
  b: number; // 0 - 63
}

export interface RGB24 {
  r: number; // 0 - 255
  g: number; // 0 - 255
  b: number; // 0 - 255
}

export interface HSL {
  h: number; // 0 - 360
  s: number; // 0 - 100
  l: number; // 0 - 100
}

export interface HSV {
  h: number; // 0 - 360
  s: number; // 0 - 100
  v: number; // 0 - 100
}

export type ScreenMode = 'SCREEN 13' | 'SCREEN 12' | 'SCREEN 9' | 'SCREEN 1';

export interface PalettePreset {
  id: string;
  name: string;
  mode: ScreenMode;
  description: string;
  colors: RGB6[];
}

// Convert 6-bit DAC (0-63) to 8-bit (0-255)
export function dac6ToRgb8(c6?: number): number {
  if (c6 === undefined || c6 === null || isNaN(c6)) return 0;
  const clamped = Math.max(0, Math.min(63, Math.round(c6)));
  return Math.round((clamped * 255) / 63);
}

// Convert 8-bit (0-255) to 6-bit DAC (0-63)
export function rgb8ToDac6(c8?: number): number {
  if (c8 === undefined || c8 === null || isNaN(c8)) return 0;
  const clamped = Math.max(0, Math.min(255, Math.round(c8)));
  return Math.round((clamped * 63) / 255);
}

// Convert RGB6 to hex string "#RRGGBB"
export function rgb6ToHex(color?: RGB6 | null): string {
  if (!color) return '#000000';
  const r8 = dac6ToRgb8(color.r);
  const g8 = dac6ToRgb8(color.g);
  const b8 = dac6ToRgb8(color.b);
  const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${toHex(r8)}${toHex(g8)}${toHex(b8)}`;
}

// Parse hex string "#RRGGBB" or "RRGGBB" to RGB6
export function hexToRgb6(hex: string): RGB6 {
  let clean = (hex || '').replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) {
    return { r: 0, g: 0, b: 0 };
  }
  const r8 = parseInt(clean.substring(0, 2), 16) || 0;
  const g8 = parseInt(clean.substring(2, 4), 16) || 0;
  const b8 = parseInt(clean.substring(4, 6), 16) || 0;
  return {
    r: rgb8ToDac6(r8),
    g: rgb8ToDac6(g8),
    b: rgb8ToDac6(b8),
  };
}

// Convert RGB6 to HSL
export function rgb6ToHsl(color?: RGB6 | null): HSL {
  if (!color) return { h: 0, s: 0, l: 0 };
  const r = dac6ToRgb8(color.r) / 255;
  const g = dac6ToRgb8(color.g) / 255;
  const b = dac6ToRgb8(color.b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Convert HSL to RGB6
export function hslToRgb6(hsl: HSL): RGB6 {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tNorm = t;
      if (tNorm < 0) tNorm += 1;
      if (tNorm > 1) tNorm -= 1;
      if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
      if (tNorm < 1 / 2) return q;
      if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: rgb8ToDac6(Math.round(r * 255)),
    g: rgb8ToDac6(Math.round(g * 255)),
    b: rgb8ToDac6(Math.round(b * 255)),
  };
}

// Convert RGB6 to HSV
export function rgb6ToHsv(color?: RGB6 | null): HSV {
  if (!color) return { h: 0, s: 0, v: 0 };
  const r = dac6ToRgb8(color.r) / 255;
  const g = dac6ToRgb8(color.g) / 255;
  const b = dac6ToRgb8(color.b) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

// Convert HSV to RGB6
export function hsvToRgb6(hsv: HSV): RGB6 {
  const h = ((hsv.h % 360) + 360) % 360 / 60;
  const s = Math.max(0, Math.min(100, hsv.s)) / 100;
  const v = Math.max(0, Math.min(100, hsv.v)) / 100;

  const c = v * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = v - c;

  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 1) {
    r = c; g = x; b = 0;
  } else if (h >= 1 && h < 2) {
    r = x; g = c; b = 0;
  } else if (h >= 2 && h < 3) {
    r = 0; g = c; b = x;
  } else if (h >= 3 && h < 4) {
    r = 0; g = x; b = c;
  } else if (h >= 4 && h < 5) {
    r = x; g = 0; b = c;
  } else if (h >= 5 && h < 6) {
    r = c; g = 0; b = x;
  }

  return {
    r: rgb8ToDac6(Math.round((r + m) * 255)),
    g: rgb8ToDac6(Math.round((g + m) * 255)),
    b: rgb8ToDac6(Math.round((b + m) * 255)),
  };
}

// QBasic Color Attribute Calculation:
// In QBasic SCREEN 12 & SCREEN 13:
// PALETTE index, B * 65536 + G * 256 + R
export function rgb6ToQbasicLong(color?: RGB6 | null): number {
  if (!color) return 0;
  return (color.b ?? 0) * 65536 + (color.g ?? 0) * 256 + (color.r ?? 0);
}

// Standard 16 EGA / VGA colors (indices 0-15)
export const STANDARD_16_VGA: RGB6[] = [
  { r: 0, g: 0, b: 0 },    // 0: Black
  { r: 0, g: 0, b: 42 },   // 1: Blue
  { r: 0, g: 42, b: 0 },   // 2: Green
  { r: 0, g: 42, b: 42 },  // 3: Cyan
  { r: 42, g: 0, b: 0 },   // 4: Red
  { r: 42, g: 0, b: 42 },  // 5: Magenta
  { r: 42, g: 21, b: 0 },  // 6: Brown
  { r: 42, g: 42, b: 42 }, // 7: Light Gray
  { r: 21, g: 21, b: 21 }, // 8: Dark Gray
  { r: 21, g: 21, b: 63 }, // 9: Light Blue
  { r: 21, g: 63, b: 21 }, // 10: Light Green
  { r: 21, g: 63, b: 63 }, // 11: Light Cyan
  { r: 63, g: 21, b: 21 }, // 12: Light Red
  { r: 63, g: 21, b: 63 }, // 13: Light Magenta
  { r: 63, g: 63, b: 21 }, // 14: Yellow
  { r: 63, g: 63, b: 63 }, // 15: Bright White
];

// Generate exact 256-color VGA BIOS default palette (SCREEN 13)
export function generateVgaDefaultPalette(): RGB6[] {
  const palette: RGB6[] = new Array(256);

  // 0 - 15: Standard 16 colors
  for (let i = 0; i < 16; i++) {
    palette[i] = { ...STANDARD_16_VGA[i] };
  }

  // 16 - 31: 16 shades of gray ramp
  for (let i = 0; i < 16; i++) {
    // DAC values approx 0, 4, 8, 12 ... 60
    const v = Math.round((i * 63) / 15);
    palette[16 + i] = { r: v, g: v, b: v };
  }

  // 32 - 247: 216 colors in 3 groups of 72 colors
  // VGA ROM generates these with 24 hues x 3 saturation/intensity bands
  // Group 1: 72 high-intensity colors (32-103)
  // Group 2: 72 medium-intensity colors (104-175)
  // Group 3: 72 low-intensity colors (176-247)
  const intensities = [
    { max: 63, med: 31, min: 0 },   // High
    { max: 48, med: 24, min: 0 },   // Medium
    { max: 32, med: 16, min: 0 }    // Low
  ];

  let colorIdx = 32;
  for (let g = 0; g < 3; g++) {
    const { max, med, min } = intensities[g];
    // 24 hues around the circle
    const hues: RGB6[] = [
      { r: max, g: min, b: min },
      { r: max, g: med, b: min },
      { r: max, g: max, b: min },
      { r: med, g: max, b: min },
      { r: min, g: max, b: min },
      { r: min, g: max, b: med },
      { r: min, g: max, b: max },
      { r: min, g: med, b: max },
      { r: min, g: min, b: max },
      { r: med, g: min, b: max },
      { r: max, g: min, b: max },
      { r: max, g: min, b: med },
      // Halfway hues
      { r: max, g: Math.round(med / 2), b: min },
      { r: max, g: Math.round((max + med) / 2), b: min },
      { r: Math.round((max + med) / 2), g: max, b: min },
      { r: Math.round(med / 2), g: max, b: min },
      { r: min, g: max, b: Math.round(med / 2) },
      { r: min, g: max, b: Math.round((max + med) / 2) },
      { r: min, g: Math.round((max + med) / 2), b: max },
      { r: min, g: Math.round(med / 2), b: max },
      { r: Math.round(med / 2), g: min, b: max },
      { r: Math.round((max + med) / 2), g: min, b: max },
      { r: max, g: min, b: Math.round((max + med) / 2) },
      { r: max, g: min, b: Math.round(med / 2) },
    ];

    for (let h = 0; h < 24 && colorIdx < 248; h++) {
      palette[colorIdx++] = hues[h];
    }
  }

  // 248 - 255: Default black padding
  for (let i = 248; i < 256; i++) {
    palette[i] = { r: 0, g: 0, b: 0 };
  }

  return palette;
}

// Generate Demoscene Fire 256-Color Palette
export function generateFirePalette(): RGB6[] {
  const p: RGB6[] = new Array(256);
  // Keep first 16 standard VGA for text/UI
  for (let i = 0; i < 16; i++) p[i] = { ...STANDARD_16_VGA[i] };

  // 16 to 255: Smooth 240-step fire ramp
  // 16-75: Black to Deep Red
  // 76-135: Red to Bright Orange
  // 136-195: Orange to Bright Yellow
  // 196-255: Yellow to Pure White
  for (let i = 16; i < 256; i++) {
    const step = i - 16;
    let r = 0, g = 0, b = 0;
    if (step < 60) {
      r = Math.round((step / 60) * 63);
      g = 0;
      b = 0;
    } else if (step < 120) {
      r = 63;
      g = Math.round(((step - 60) / 60) * 35);
      b = 0;
    } else if (step < 180) {
      r = 63;
      g = 35 + Math.round(((step - 120) / 60) * 28);
      b = Math.round(((step - 120) / 60) * 15);
    } else {
      r = 63;
      g = 63;
      b = 15 + Math.round(((step - 180) / 60) * 48);
    }
    p[i] = {
      r: Math.min(63, Math.max(0, r)),
      g: Math.min(63, Math.max(0, g)),
      b: Math.min(63, Math.max(0, b)),
    };
  }
  return p;
}

// Generate Cyberpunk / Synthwave 256-Color Palette
export function generateCyberpunkPalette(): RGB6[] {
  const p: RGB6[] = new Array(256);
  for (let i = 0; i < 16; i++) p[i] = { ...STANDARD_16_VGA[i] };

  // Ramps: Neon Pink/Purple (16-75), Cyan/Teal (76-135), Electric Amber/Yellow (136-195), Deep Matrix Green (196-255)
  for (let i = 16; i < 76; i++) {
    const t = (i - 16) / 59;
    p[i] = { r: Math.round(t * 63), g: 0, b: Math.round(t * 60 + 3) };
  }
  for (let i = 76; i < 136; i++) {
    const t = (i - 76) / 59;
    p[i] = { r: 0, g: Math.round(t * 63), b: Math.round(t * 63) };
  }
  for (let i = 136; i < 196; i++) {
    const t = (i - 136) / 59;
    p[i] = { r: Math.round(t * 63), g: Math.round(t * 45), b: 0 };
  }
  for (let i = 196; i < 256; i++) {
    const t = (i - 196) / 59;
    p[i] = { r: Math.round(t * 10), g: Math.round(t * 63), b: Math.round(t * 20) };
  }
  return p;
}

// Generate DOOM (1993) Playpal approximation for QBasic
export function generateDoomPalette(): RGB6[] {
  const p: RGB6[] = generateVgaDefaultPalette();
  // DOOM has characteristic flesh tones, steel grays, sludge greens, bloody reds
  for (let i = 16; i < 48; i++) {
    const t = (i - 16) / 31;
    p[i] = { r: Math.round(t * 60), g: Math.round(t * 12), b: Math.round(t * 12) }; // blood red ramp
  }
  for (let i = 48; i < 80; i++) {
    const t = (i - 48) / 31;
    p[i] = { r: Math.round(t * 50), g: Math.round(t * 52), b: Math.round(t * 20) }; // toxic nukage yellow-green
  }
  for (let i = 80; i < 112; i++) {
    const t = (i - 80) / 31;
    p[i] = { r: Math.round(t * 48), g: Math.round(t * 36), b: Math.round(t * 24) }; // rusty metal brown
  }
  for (let i = 112; i < 144; i++) {
    const t = (i - 112) / 31;
    p[i] = { r: Math.round(t * 55), g: Math.round(t * 42), b: Math.round(t * 36) }; // marine skin flesh tones
  }
  return p;
}

// Built-in presets
export const PALETTE_PRESETS: PalettePreset[] = [
  {
    id: 'vga-default',
    name: 'VGA Default (SCREEN 13)',
    mode: 'SCREEN 13',
    description: 'The authentic 256-color BIOS ROM palette for IBM VGA mode 13h.',
    colors: generateVgaDefaultPalette(),
  },
  {
    id: 'fire-plasma',
    name: 'Demoscene Fire & Plasma',
    mode: 'SCREEN 13',
    description: 'Smooth fire and incandescent heat gradient ramp for retro particle effects.',
    colors: generateFirePalette(),
  },
  {
    id: 'cyberpunk',
    name: 'Retro Synthwave / Cyber',
    mode: 'SCREEN 13',
    description: 'Vibrant neon fuchsias, electric cyans, acid yellows, and deep darks.',
    colors: generateCyberpunkPalette(),
  },
  {
    id: 'doom-vga',
    name: 'DOOM 1993 Colormap',
    mode: 'SCREEN 13',
    description: 'Gritty industrial palette inspired by id Software classic DOS engine.',
    colors: generateDoomPalette(),
  },
  {
    id: 'screen-12-ega',
    name: 'EGA 16-Color (SCREEN 12 / 9)',
    mode: 'SCREEN 12',
    description: 'Standard 16-color high-resolution EGA/VGA palette for QBasic SCREEN 12.',
    colors: STANDARD_16_VGA.slice(0, 16),
  },
  {
    id: 'cga-palette-1',
    name: 'CGA Mode 4 (Palette 1 High)',
    mode: 'SCREEN 1',
    description: 'Iconic 4-color CGA palette: Black, Cyan, Magenta, White.',
    colors: [
      { r: 0, g: 0, b: 0 },
      { r: 21, g: 63, b: 63 },
      { r: 63, g: 21, b: 63 },
      { r: 63, g: 63, b: 63 },
    ],
  },
  {
    id: 'cga-palette-0',
    name: 'CGA Mode 4 (Palette 0 High)',
    mode: 'SCREEN 1',
    description: 'Iconic 4-color CGA palette: Black, Green, Red, Yellow.',
    colors: [
      { r: 0, g: 0, b: 0 },
      { r: 21, g: 63, b: 21 },
      { r: 63, g: 21, b: 21 },
      { r: 63, g: 63, b: 21 },
    ],
  },
  {
    id: 'gameboy-classic',
    name: 'GameBoy Classic 4-Color',
    mode: 'SCREEN 1',
    description: 'Original 1989 pea-soup monochrome LCD 4-shade green palette.',
    colors: [
      { r: 3, g: 6, b: 3 },
      { r: 12, g: 25, b: 12 },
      { r: 34, g: 47, b: 12 },
      { r: 55, g: 63, b: 20 },
    ],
  },
];
