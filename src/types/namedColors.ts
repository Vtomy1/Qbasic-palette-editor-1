/**
 * Named Standard VGA and Retro Preset Colors
 * Allows fast search, autocomplete, and selection of named shades in the ColorEditor.
 */

import { RGB6 } from './palette';

export interface NamedColor {
  name: string;
  category: 'Standard VGA' | 'Retro Tones' | 'Grayscale' | 'Gaming / Demoscene';
  color: RGB6;
  vgaIndex?: number;
}

export const NAMED_VGA_COLORS: NamedColor[] = [
  // 16 Standard IBM EGA / VGA Colors (SCREEN 12 & SCREEN 13 Base)
  { name: 'Black', category: 'Standard VGA', color: { r: 0, g: 0, b: 0 }, vgaIndex: 0 },
  { name: 'Dark Blue', category: 'Standard VGA', color: { r: 0, g: 0, b: 42 }, vgaIndex: 1 },
  { name: 'Dark Green', category: 'Standard VGA', color: { r: 0, g: 42, b: 0 }, vgaIndex: 2 },
  { name: 'Dark Cyan', category: 'Standard VGA', color: { r: 0, g: 42, b: 42 }, vgaIndex: 3 },
  { name: 'Dark Red', category: 'Standard VGA', color: { r: 42, g: 0, b: 0 }, vgaIndex: 4 },
  { name: 'Dark Magenta', category: 'Standard VGA', color: { r: 42, g: 0, b: 42 }, vgaIndex: 5 },
  { name: 'Brown', category: 'Standard VGA', color: { r: 42, g: 21, b: 0 }, vgaIndex: 6 },
  { name: 'Light Gray', category: 'Standard VGA', color: { r: 42, g: 42, b: 42 }, vgaIndex: 7 },
  { name: 'Dark Gray', category: 'Standard VGA', color: { r: 21, g: 21, b: 21 }, vgaIndex: 8 },
  { name: 'Bright Blue', category: 'Standard VGA', color: { r: 21, g: 21, b: 63 }, vgaIndex: 9 },
  { name: 'Bright Green', category: 'Standard VGA', color: { r: 21, g: 63, b: 21 }, vgaIndex: 10 },
  { name: 'Bright Cyan', category: 'Standard VGA', color: { r: 21, g: 63, b: 63 }, vgaIndex: 11 },
  { name: 'Bright Red', category: 'Standard VGA', color: { r: 63, g: 21, b: 21 }, vgaIndex: 12 },
  { name: 'Bright Magenta', category: 'Standard VGA', color: { r: 63, g: 21, b: 63 }, vgaIndex: 13 },
  { name: 'Yellow', category: 'Standard VGA', color: { r: 63, g: 63, b: 21 }, vgaIndex: 14 },
  { name: 'Bright White', category: 'Standard VGA', color: { r: 63, g: 63, b: 63 }, vgaIndex: 15 },

  // Secondary Classic VGA & Retro Shades
  { name: 'Navy Blue', category: 'Retro Tones', color: { r: 0, g: 0, b: 32 } },
  { name: 'Royal Blue', category: 'Retro Tones', color: { r: 16, g: 24, b: 60 } },
  { name: 'Sky Blue', category: 'Retro Tones', color: { r: 20, g: 45, b: 63 } },
  { name: 'Ice Blue', category: 'Retro Tones', color: { r: 44, g: 56, b: 63 } },
  { name: 'Azure', category: 'Retro Tones', color: { r: 0, g: 38, b: 63 } },
  { name: 'Electric Cyan', category: 'Retro Tones', color: { r: 0, g: 63, b: 63 } },
  { name: 'Teal', category: 'Retro Tones', color: { r: 0, g: 32, b: 32 } },
  { name: 'Aquamarine', category: 'Retro Tones', color: { r: 15, g: 60, b: 48 } },
  { name: 'Turquoise', category: 'Retro Tones', color: { r: 10, g: 54, b: 50 } },
  { name: 'Sea Green', category: 'Retro Tones', color: { r: 12, g: 48, b: 30 } },
  { name: 'Forest Green', category: 'Retro Tones', color: { r: 5, g: 32, b: 8 } },
  { name: 'Emerald Green', category: 'Retro Tones', color: { r: 10, g: 55, b: 25 } },
  { name: 'Lime Green', category: 'Retro Tones', color: { r: 25, g: 63, b: 10 } },
  { name: 'Mint Green', category: 'Retro Tones', color: { r: 35, g: 63, b: 40 } },
  { name: 'Olive Green', category: 'Retro Tones', color: { r: 28, g: 32, b: 0 } },
  { name: 'Khaki', category: 'Retro Tones', color: { r: 45, g: 42, b: 20 } },
  { name: 'Gold', category: 'Retro Tones', color: { r: 63, g: 50, b: 0 } },
  { name: 'Amber', category: 'Retro Tones', color: { r: 63, g: 42, b: 0 } },
  { name: 'Orange', category: 'Retro Tones', color: { r: 63, g: 32, b: 0 } },
  { name: 'Deep Orange', category: 'Retro Tones', color: { r: 60, g: 20, b: 0 } },
  { name: 'Coral', category: 'Retro Tones', color: { r: 63, g: 30, b: 20 } },
  { name: 'Peach', category: 'Retro Tones', color: { r: 63, g: 45, b: 35 } },
  { name: 'Salmon', category: 'Retro Tones', color: { r: 63, g: 32, b: 28 } },
  { name: 'Crimson Red', category: 'Retro Tones', color: { r: 55, g: 5, b: 12 } },
  { name: 'Ruby Red', category: 'Retro Tones', color: { r: 58, g: 8, b: 24 } },
  { name: 'Scarlet', category: 'Retro Tones', color: { r: 63, g: 12, b: 0 } },
  { name: 'Maroon', category: 'Retro Tones', color: { r: 32, g: 0, b: 8 } },
  { name: 'Burgundy', category: 'Retro Tones', color: { r: 38, g: 4, b: 18 } },
  { name: 'Rose Pink', category: 'Retro Tones', color: { r: 63, g: 28, b: 42 } },
  { name: 'Hot Pink', category: 'Retro Tones', color: { r: 63, g: 15, b: 50 } },
  { name: 'Lavender', category: 'Retro Tones', color: { r: 45, g: 35, b: 60 } },
  { name: 'Violet', category: 'Retro Tones', color: { r: 35, g: 10, b: 58 } },
  { name: 'Indigo', category: 'Retro Tones', color: { r: 18, g: 0, b: 45 } },
  { name: 'Deep Purple', category: 'Retro Tones', color: { r: 24, g: 0, b: 38 } },
  { name: 'Plum', category: 'Retro Tones', color: { r: 40, g: 15, b: 40 } },
  { name: 'Copper', category: 'Retro Tones', color: { r: 48, g: 24, b: 10 } },
  { name: 'Bronze', category: 'Retro Tones', color: { r: 40, g: 26, b: 12 } },
  { name: 'Rust', category: 'Retro Tones', color: { r: 45, g: 14, b: 4 } },
  { name: 'Chocolate Brown', category: 'Retro Tones', color: { r: 28, g: 14, b: 6 } },
  { name: 'Tan', category: 'Retro Tones', color: { r: 50, g: 38, b: 26 } },
  { name: 'Sand', category: 'Retro Tones', color: { r: 55, g: 48, b: 35 } },
  { name: 'Beige', category: 'Retro Tones', color: { r: 58, g: 54, b: 45 } },

  // Grayscale Ramps
  { name: 'Pure Black', category: 'Grayscale', color: { r: 0, g: 0, b: 0 } },
  { name: 'Very Dark Gray', category: 'Grayscale', color: { r: 8, g: 8, b: 8 } },
  { name: 'Dim Gray', category: 'Grayscale', color: { r: 16, g: 16, b: 16 } },
  { name: 'Charcoal', category: 'Grayscale', color: { r: 21, g: 21, b: 21 } },
  { name: 'Medium Gray', category: 'Grayscale', color: { r: 32, g: 32, b: 32 } },
  { name: 'Ash Gray', category: 'Grayscale', color: { r: 40, g: 40, b: 40 } },
  { name: 'Silver', category: 'Grayscale', color: { r: 48, g: 48, b: 48 } },
  { name: 'Light Silver', category: 'Grayscale', color: { r: 56, g: 56, b: 56 } },
  { name: 'Pure White', category: 'Grayscale', color: { r: 63, g: 63, b: 63 } },

  // Gaming / Demoscene Favorites
  { name: 'Neon Pink', category: 'Gaming / Demoscene', color: { r: 63, g: 5, b: 55 } },
  { name: 'Neon Green', category: 'Gaming / Demoscene', color: { r: 8, g: 63, b: 15 } },
  { name: 'Cyber Yellow', category: 'Gaming / Demoscene', color: { r: 63, g: 60, b: 0 } },
  { name: 'Toxic Slime', category: 'Gaming / Demoscene', color: { r: 40, g: 58, b: 5 } },
  { name: 'Blood Red', category: 'Gaming / Demoscene', color: { r: 48, g: 4, b: 4 } },
  { name: 'DOOM Flesh Tone', category: 'Gaming / Demoscene', color: { r: 55, g: 42, b: 36 } },
  { name: 'GameBoy Dark Green', category: 'Gaming / Demoscene', color: { r: 12, g: 25, b: 12 } },
  { name: 'GameBoy Light Green', category: 'Gaming / Demoscene', color: { r: 55, g: 63, b: 20 } },
];

/**
 * Filter named colors based on a search term
 */
export function searchNamedColors(query: string, maxResults: number = 24): NamedColor[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return NAMED_VGA_COLORS.slice(0, maxResults);

  return NAMED_VGA_COLORS.filter(item => {
    return (
      item.name.toLowerCase().includes(clean) ||
      item.category.toLowerCase().includes(clean)
    );
  }).slice(0, maxResults);
}
