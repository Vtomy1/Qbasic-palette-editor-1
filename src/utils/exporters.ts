/**
 * Exporters and Parsers for QBasic Code and Industry Palette Formats
 */

import { RGB6, dac6ToRgb8, rgb8ToDac6, rgb6ToHex, hexToRgb6, rgb6ToQbasicLong } from '../types/palette';

export type QBasicExportStyle = 'OUT_PORT' | 'PALETTE_STMT' | 'PALETTE_USING' | 'FULL_PROGRAM';

/**
 * Generate QBasic source code for the given palette
 */
export function generateQBasicCode(
  palette: RGB6[],
  style: QBasicExportStyle = 'OUT_PORT',
  startIndex: number = 0,
  count: number = palette.length
): string {
  const actualCount = Math.min(count, palette.length - startIndex);
  const colorsToExport = palette.slice(startIndex, startIndex + actualCount);

  if (style === 'OUT_PORT') {
    // Generate OUT &H3C8 / OUT &H3C9 with DATA statements
    let code = `' =========================================================\n`;
    code += `' QBasic 18-Bit VGA DAC Palette Loader\n`;
    code += `' Exported from QBasic Palette Editor\n`;
    code += `' Palette Indices: ${startIndex} to ${startIndex + actualCount - 1} (${actualCount} colors)\n`;
    code += `' =========================================================\n`;
    code += `DEFINT A-Z\n`;
    code += `SCREEN 13 ' 320x200 256-color VGA mode\n\n`;
    code += `RESTORE PaletteData\n`;
    code += `OUT &H3C8, ${startIndex} ' Set starting palette DAC index\n`;
    code += `FOR i = 0 TO ${actualCount - 1}\n`;
    code += `    READ r, g, b\n`;
    code += `    OUT &H3C9, r ' Red   (0-63)\n`;
    code += `    OUT &H3C9, g ' Green (0-63)\n`;
    code += `    OUT &H3C9, b ' Blue  (0-63)\n`;
    code += `NEXT i\n\n`;
    code += `PaletteData:\n`;

    // 8 colors (24 values) per DATA line
    const valuesPerLine = 18; // 6 RGB triplets per line for clean 80-col DOS terminal
    for (let i = 0; i < colorsToExport.length; i += 6) {
      const chunk = colorsToExport.slice(i, i + 6);
      const tripletStr = chunk.map(c => `${c.r},${c.g},${c.b}`).join(', ');
      code += `DATA ${tripletStr}\n`;
    }

    return code;
  }

  if (style === 'PALETTE_STMT') {
    let code = `' =========================================================\n`;
    code += `' QBasic PALETTE Statement Export\n`;
    code += `' Syntax: PALETTE attribute, B * 65536 + G * 256 + R\n`;
    code += `' =========================================================\n`;
    code += `DEFINT A-Z\n`;
    code += `SCREEN 13\n\n`;
    for (let i = 0; i < colorsToExport.length; i++) {
      const idx = startIndex + i;
      const c = colorsToExport[i];
      const val = rgb6ToQbasicLong(c);
      code += `PALETTE ${idx}, ${val}& ' R:${c.r} G:${c.g} B:${c.b}\n`;
    }
    return code;
  }

  if (style === 'PALETTE_USING') {
    let code = `' =========================================================\n`;
    code += `' QBasic PALETTE USING Export\n`;
    code += `' =========================================================\n`;
    code += `DEFINT A-Z\n`;
    code += `SCREEN 13\n`;
    code += `DIM PalArray&(${actualCount - 1})\n\n`;
    code += `' Populate array with color values\n`;
    code += `RESTORE PalLongData\n`;
    code += `FOR i = 0 TO ${actualCount - 1}\n`;
    code += `    READ PalArray&(i)\n`;
    code += `NEXT i\n`;
    code += `PALETTE USING PalArray&(0)\n\n`;
    code += `PalLongData:\n`;

    for (let i = 0; i < colorsToExport.length; i += 4) {
      const chunk = colorsToExport.slice(i, i + 4);
      const valStr = chunk.map(c => `${rgb6ToQbasicLong(c)}&`).join(', ');
      code += `DATA ${valStr}\n`;
    }
    return code;
  }

  // FULL_PROGRAM: Complete runnable showcase game/demo in QBasic
  let demo = `' =========================================================\n`;
  demo += `' QBasic VGA Palette Showcase Demo\n`;
  demo += `' Run in DOSBox, PC-BASIC, or QB64!\n`;
  demo += `' =========================================================\n`;
  demo += `DEFINT A-Z\n`;
  demo += `SCREEN 13: CLS\n\n`;
  demo += `' 1. Load Custom Palette into VGA DAC\n`;
  demo += `RESTORE DemoPal\n`;
  demo += `OUT &H3C8, 0\n`;
  demo += `FOR i = 0 TO ${palette.length - 1}\n`;
  demo += `    READ r, g, b\n`;
  demo += `    OUT &H3C9, r: OUT &H3C9, g: OUT &H3C9, b\n`;
  demo += `NEXT i\n\n`;
  demo += `' 2. Draw Palette Swatch Matrix\n`;
  demo += `PRINT "QBASIC PALETTE DEMO (PRESS ESC TO EXIT)"\n`;
  demo += `FOR col = 0 TO ${palette.length - 1}\n`;
  demo += `    x = (col MOD 16) * 18 + 16\n`;
  demo += `    y = (col \\ 16) * 10 + 24\n`;
  demo += `    LINE (x, y)-(x + 16, y + 8), col, BF\n`;
  demo += `NEXT col\n\n`;
  demo += `' 3. Draw Palette Cycling Spectrum Bar\n`;
  demo += `FOR x = 0 TO 319\n`;
  demo += `    c = (x * 255) \\ 319\n`;
  demo += `    LINE (x, 188)-(x, 198), c\n`;
  demo += `NEXT x\n\n`;
  demo += `' 4. Wait for keypress\n`;
  demo += `DO\n`;
  demo += `    k$ = INKEY$\n`;
  demo += `LOOP UNTIL k$ = CHR$(27)\n`;
  demo += `SCREEN 0: WIDTH 80: CLS\n`;
  demo += `END\n\n`;
  demo += `DemoPal:\n`;

  for (let i = 0; i < palette.length; i += 6) {
    const chunk = palette.slice(i, i + 6);
    const tripletStr = chunk.map(c => `${c.r},${c.g},${c.b}`).join(', ');
    demo += `DATA ${tripletStr}\n`;
  }

  return demo;
}

/**
 * Generate standard JASC-PAL file format (Paint Shop Pro, Aseprite, GIMP)
 */
export function generateJascPal(palette: RGB6[]): string {
  let content = `JASC-PAL\r\n0100\r\n${palette.length}\r\n`;
  for (const c of palette) {
    const r8 = dac6ToRgb8(c.r);
    const g8 = dac6ToRgb8(c.g);
    const b8 = dac6ToRgb8(c.b);
    content += `${r8} ${g8} ${b8}\r\n`;
  }
  return content;
}

/**
 * Generate Adobe Color Table (.ACT) binary buffer
 */
export function generateAdobeAct(palette: RGB6[]): Uint8Array {
  // Adobe ACT format is 768 bytes (256 * 3 bytes for R, G, B)
  const buffer = new Uint8Array(768);
  for (let i = 0; i < 256; i++) {
    const c = palette[i] || { r: 0, g: 0, b: 0 };
    buffer[i * 3 + 0] = dac6ToRgb8(c.r);
    buffer[i * 3 + 1] = dac6ToRgb8(c.g);
    buffer[i * 3 + 2] = dac6ToRgb8(c.b);
  }
  return buffer;
}

/**
 * Generate GIMP Palette (.GPL) format
 */
export function generateGimpPal(palette: RGB6[], paletteName: string = 'QBasic Palette'): string {
  let content = `GIMP Palette\n`;
  content += `Name: ${paletteName}\n`;
  content += `Columns: 16\n`;
  content += `# Exported from QBasic Palette Editor (18-bit VGA DAC)\n`;
  for (let i = 0; i < palette.length; i++) {
    const c = palette[i];
    const r8 = dac6ToRgb8(c.r).toString().padStart(3, ' ');
    const g8 = dac6ToRgb8(c.g).toString().padStart(3, ' ');
    const b8 = dac6ToRgb8(c.b).toString().padStart(3, ' ');
    content += `${r8} ${g8} ${b8}  Index ${i} (DAC ${c.r},${c.g},${c.b})\n`;
  }
  return content;
}

/**
 * Generate HEX list format (one hex per line)
 */
export function generateHexList(palette: RGB6[]): string {
  return palette.map(c => rgb6ToHex(c)).join('\n');
}

/**
 * Download a text file in browser
 */
export function downloadTextFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download a binary file in browser
 */
export function downloadBinaryFile(filename: string, buffer: Uint8Array) {
  const blob = new Blob([buffer as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse text or file contents into RGB6[] palette
 */
export function parsePaletteInput(text: string): RGB6[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Try JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object' && 'r' in parsed[0]) {
          return parsed.map(c => ({
            r: Math.max(0, Math.min(63, Number(c.r) || 0)),
            g: Math.max(0, Math.min(63, Number(c.g) || 0)),
            b: Math.max(0, Math.min(63, Number(c.b) || 0)),
          }));
        }
        if (typeof parsed[0] === 'string') {
          return parsed.map(hex => hexToRgb6(hex));
        }
      }
    } catch {}
  }

  // Try JASC-PAL
  if (trimmed.startsWith('JASC-PAL')) {
    const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    // Line 0: JASC-PAL, Line 1: 0100, Line 2: count
    if (lines.length >= 4) {
      const colors: RGB6[] = [];
      for (let i = 3; i < lines.length; i++) {
        const parts = lines[i].split(/\s+/).map(Number);
        if (parts.length >= 3 && !isNaN(parts[0])) {
          colors.push({
            r: rgb8ToDac6(parts[0]),
            g: rgb8ToDac6(parts[1]),
            b: rgb8ToDac6(parts[2]),
          });
        }
      }
      if (colors.length > 0) return colors;
    }
  }

  // Try GIMP Palette (GPL)
  if (trimmed.startsWith('GIMP Palette')) {
    const lines = trimmed.split(/\r?\n/);
    const colors: RGB6[] = [];
    for (const line of lines) {
      const clean = line.trim();
      if (!clean || clean.startsWith('#') || clean.startsWith('GIMP') || clean.startsWith('Name:') || clean.startsWith('Columns:')) {
        continue;
      }
      const parts = clean.split(/\s+/).map(Number);
      if (parts.length >= 3 && !isNaN(parts[0])) {
        colors.push({
          r: rgb8ToDac6(parts[0]),
          g: rgb8ToDac6(parts[1]),
          b: rgb8ToDac6(parts[2]),
        });
      }
    }
    if (colors.length > 0) return colors;
  }

  // Try QBasic DATA statements (e.g. DATA 63, 0, 0, 0, 63, 0, ...)
  if (/DATA\s+[0-9]/i.test(trimmed)) {
    const dataMatches = trimmed.matchAll(/DATA\s+([^'\r\n]+)/gi);
    const allNums: number[] = [];
    for (const match of dataMatches) {
      const nums = match[1].split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n));
      allNums.push(...nums);
    }
    if (allNums.length >= 3) {
      const colors: RGB6[] = [];
      for (let i = 0; i < allNums.length; i += 3) {
        if (i + 2 < allNums.length) {
          // Check if data is already in 0-63 or 0-255 range
          const maxVal = Math.max(allNums[i], allNums[i + 1], allNums[i + 2]);
          const is8bit = maxVal > 63;
          colors.push({
            r: is8bit ? rgb8ToDac6(allNums[i]) : Math.min(63, Math.max(0, allNums[i])),
            g: is8bit ? rgb8ToDac6(allNums[i + 1]) : Math.min(63, Math.max(0, allNums[i + 1])),
            b: is8bit ? rgb8ToDac6(allNums[i + 2]) : Math.min(63, Math.max(0, allNums[i + 2])),
          });
        }
      }
      if (colors.length > 0) return colors;
    }
  }

  // Try Hex list (#RRGGBB or RRGGBB)
  const hexLines = trimmed.split(/[\r\n,]+/).map(l => l.trim()).filter(Boolean);
  const parsedHexes: RGB6[] = [];
  for (const item of hexLines) {
    const clean = item.replace(/['"#]/g, '').trim();
    if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
      parsedHexes.push(hexToRgb6(clean));
    }
  }
  if (parsedHexes.length > 0) {
    return parsedHexes;
  }

  return null;
}
