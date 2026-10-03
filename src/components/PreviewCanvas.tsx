import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RGB6, dac6ToRgb8, rgb6ToHex } from '../types/palette';
import { sound } from '../utils/audio';
import { Monitor, Flame, Image as ImageIcon, Paintbrush, Grid, RefreshCw } from 'lucide-react';

interface PreviewCanvasProps {
  palette: RGB6[];
  activeColorIndex: number;
}

type PreviewMode = 'GORILLAS' | 'FIRE_PLASMA' | 'CALIBRATION' | 'IMAGE_DITHER' | 'SPRITE_PAD';

export const PreviewCanvas: React.FC<PreviewCanvasProps> = ({
  palette,
  activeColorIndex,
}) => {
  const [mode, setMode] = useState<PreviewMode>('GORILLAS');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fire / Plasma state
  const fireBufferRef = useRef<Uint8Array | null>(null);
  const plasmaTickRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Sprite pad state
  const SPRITE_SIZE = 16;
  const [spritePixels, setSpritePixels] = useState<number[]>(() => {
    // Initial cute retro 16x16 floppy disk or potion sprite
    const init = new Array(SPRITE_SIZE * SPRITE_SIZE).fill(0);
    // Draw simple retro heart/star
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        if ((x >= 3 && x <= 12 && y >= 3 && y <= 12) && ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 24)) {
          init[y * 16 + x] = 12; // Red
        }
      }
    }
    return init;
  });
  const [spriteTool, setSpriteTool] = useState<'PEN' | 'ERASER' | 'FILL'>('PEN');
  const [showSpriteGrid, setShowSpriteGrid] = useState(true);
  const isMouseDownRef = useRef(false);

  // Custom image dither state
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [ditherAlgorithm, setDitherAlgorithm] = useState<'FLOYD' | 'NEAREST'>('FLOYD');

  // Convert palette to quick 32-bit integer lookup for fast canvas rendering
  const getPalette32 = useCallback(() => {
    const len = Math.max(1, palette.length);
    const pal32 = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const c = palette[i] || { r: 0, g: 0, b: 0 };
      const r = dac6ToRgb8(c.r);
      const g = dac6ToRgb8(c.g);
      const b = dac6ToRgb8(c.b);
      // Little-endian RGBA
      pal32[i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    return pal32;
  }, [palette]);

  // Find closest palette index for RGB
  const findClosestPaletteIndex = useCallback((r8: number, g8: number, b8: number): number => {
    if (!palette || palette.length === 0) return 0;
    let minDist = Infinity;
    let bestIndex = 0;
    for (let i = 0; i < palette.length; i++) {
      const c = palette[i] || { r: 0, g: 0, b: 0 };
      const pr = dac6ToRgb8(c.r);
      const pg = dac6ToRgb8(c.g);
      const pb = dac6ToRgb8(c.b);
      // Weighted Euclidean color distance
      const dr = r8 - pr;
      const dg = g8 - pg;
      const db = b8 - pb;
      const dist = 0.3 * (dr * dr) + 0.59 * (dg * dg) + 0.11 * (db * db);
      if (dist < minDist) {
        minDist = dist;
        bestIndex = i;
      }
    }
    return bestIndex;
  }, [palette]);

  // Draw GORILLA scene
  const drawGorillas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imgData = ctx.createImageData(width, height);
    const data32 = new Uint32Array(imgData.data.buffer);
    const pal32 = getPalette32();

    const colorSky = pal32[0] || 0xFF000000;
    const colorStar = pal32[15] || 0xFFFFFFFF;
    const colorSun = pal32[14] || 0xFF00FFFF;

    // Fill sky
    data32.fill(colorSky);

    // Deterministic retro cityscape
    const skylineHeights = [70, 110, 90, 130, 80, 140, 100, 120, 95, 115, 135, 75, 105, 125];
    const bldgWidth = Math.ceil(width / skylineHeights.length);

    for (let b = 0; b < skylineHeights.length; b++) {
      const h = skylineHeights[b];
      const startX = b * bldgWidth;
      const endX = Math.min(width, (b + 1) * bldgWidth - 1);
      const startY = height - h;
      const bColor = pal32[(b % 6) + 1]; // building color from palette 1-6

      for (let y = startY; y < height; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = y * width + x;
          // Windows
          if (y > startY + 6 && y < height - 6 && (x - startX) % 6 > 2 && (y - startY) % 8 > 3) {
            data32[idx] = pal32[14]; // Lit window (yellow)
          } else {
            data32[idx] = bColor;
          }
        }
      }
    }

    // Gorillas on top of building 2 and building 10
    const drawGorilla = (gx: number, gy: number) => {
      const gCol = pal32[6]; // Brown
      const fCol = pal32[12]; // Face
      for (let dy = 0; dy < 16; dy++) {
        for (let dx = 0; dx < 14; dx++) {
          const px = gx + dx;
          const py = gy + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            // Silhouette
            if (dy >= 2 && dy <= 14 && dx >= 2 && dx <= 11) {
              data32[py * width + px] = gCol;
            }
            if (dy >= 4 && dy <= 7 && dx >= 4 && dx <= 9) {
              data32[py * width + px] = fCol;
            }
          }
        }
      }
    };

    drawGorilla(skylineHeights[2] ? 2 * bldgWidth + 4 : 40, height - 90 - 16);
    drawGorilla(skylineHeights[10] ? 10 * bldgWidth + 4 : 220, height - 135 - 16);

    // Sun / Moon with smile
    const sunCenterX = 160;
    const sunCenterY = 32;
    const radius = 14;
    for (let y = sunCenterY - radius; y <= sunCenterY + radius; y++) {
      for (let x = sunCenterX - radius; x <= sunCenterX + radius; x++) {
        if ((x - sunCenterX) ** 2 + (y - sunCenterY) ** 2 <= radius ** 2) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            data32[y * width + x] = colorSun;
          }
        }
      }
    }

    // Flying Banana
    const bx = 100, by = 48;
    for (let i = 0; i < 8; i++) {
      const px = bx + i;
      const py = by + Math.round(Math.sin(i / 2) * 2);
      if (px < width && py < height) {
        data32[py * width + px] = pal32[14];
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Text banner overlay
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#FFFF55';
    ctx.fillText('QBASIC GORILLAS (SCREEN 13)', 8, 16);
  }, [getPalette32]);

  // Draw Calibration Chart
  const drawCalibration = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imgData = ctx.createImageData(width, height);
    const data32 = new Uint32Array(imgData.data.buffer);
    const pal32 = getPalette32();

    // Fill with black
    data32.fill(pal32[0] || 0xFF000000);

    // Top: 16 Standard VGA colors
    const topBarHeight = 35;
    const numCols = Math.min(16, palette.length);
    const colW = width / numCols;
    for (let c = 0; c < numCols; c++) {
      const color = pal32[c];
      const startX = Math.floor(c * colW);
      const endX = Math.floor((c + 1) * colW);
      for (let y = 0; y < topBarHeight; y++) {
        for (let x = startX; x < endX; x++) {
          data32[y * width + x] = color;
        }
      }
    }

    // Middle: All 256 colors as vertical gradient bands
    const midStart = 40;
    const midHeight = 100;
    for (let x = 0; x < width; x++) {
      const colorIdx = Math.floor((x / width) * palette.length);
      const color = pal32[colorIdx % palette.length];
      for (let y = midStart; y < midStart + midHeight; y++) {
        data32[y * width + x] = color;
      }
    }

    // Bottom: 8-step gray ramps and primary ramps
    const botStart = 145;
    const botHeight = 45;
    for (let x = 0; x < width; x++) {
      const step = Math.floor((x / width) * 16);
      const rampColor = pal32[Math.min(palette.length - 1, 16 + step)];
      for (let y = botStart; y < botStart + botHeight; y++) {
        data32[y * width + x] = rampColor;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Overlay labels
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('STANDARD 16 (0-15)', 8, 30);
    ctx.fillText(`SPECTRUM RAMP (0 - ${palette.length - 1})`, 8, 55);
    ctx.fillText('GRAYSCALE DAC RAMP', 8, 160);
  }, [palette.length, getPalette32]);

  // Real-time demoscene fire & plasma
  const drawFirePlasma = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const pal32 = getPalette32();
    const imgData = ctx.createImageData(width, height);
    const data32 = new Uint32Array(imgData.data.buffer);

    const fW = 160; // Render at 160x100 for true retro chunky pixels
    const fH = 100;

    if (!fireBufferRef.current || fireBufferRef.current.length !== fW * fH) {
      fireBufferRef.current = new Uint8Array(fW * fH);
    }
    const buf = fireBufferRef.current;

    // Seed bottom line with random fire sparks or plasma equation
    plasmaTickRef.current += 0.05;
    const t = plasmaTickRef.current;

    // Bottom row generates fire heat
    const bottomRow = (fH - 1) * fW;
    for (let x = 0; x < fW; x++) {
      // Combination of plasma wave and noise
      const wave = Math.sin(x * 0.1 + t * 2) * 30 + Math.cos(x * 0.05 - t) * 20;
      const val = Math.random() > 0.4 ? Math.floor(Math.random() * 80 + 175 + wave) : 0;
      buf[bottomRow + x] = Math.max(0, Math.min(255, val));
    }

    // Propagate fire upward and cool down
    for (let y = 0; y < fH - 1; y++) {
      for (let x = 0; x < fW; x++) {
        const left = x > 0 ? buf[(y + 1) * fW + x - 1] : buf[(y + 1) * fW + x];
        const center = buf[(y + 1) * fW + x];
        const right = x < fW - 1 ? buf[(y + 1) * fW + x + 1] : buf[(y + 1) * fW + x];
        const below = y + 2 < fH ? buf[(y + 2) * fW + x] : center;

        // Classic demoscene fire decay formula
        const decay = Math.floor(Math.random() * 3) + 1;
        const avg = Math.floor((left + center + right + below) / 4.02) - decay;
        buf[y * fW + x] = Math.max(0, avg);
      }
    }

    // Render scaled fire buffer onto 320x200 canvas
    const scaleX = width / fW;
    const scaleY = height / fH;

    for (let y = 0; y < height; y++) {
      const fy = Math.floor(y / scaleY);
      const fRow = fy * fW;
      for (let x = 0; x < width; x++) {
        const fx = Math.floor(x / scaleX);
        const heat = buf[fRow + fx];
        // Map heat directly to palette index
        const colIdx = Math.floor((heat / 255) * (palette.length - 1));
        data32[y * width + x] = pal32[colIdx];
      }
    }

    ctx.putImageData(imgData, 0, 0);

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#FFFF55';
    ctx.fillText('REALTIME DEMOSCENE FIRE & PLASMA', 8, 16);
  }, [palette.length, getPalette32]);

  // Image Ditherer renderer
  const drawImageDither = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!uploadedImage) {
      // Draw placeholder
      ctx.fillStyle = '#000044';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#AAAAAA';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO IMAGE LOADED', width / 2, height / 2 - 10);
      ctx.fillText('Click "Upload Image" below to test dithering', width / 2, height / 2 + 10);
      return;
    }

    // Create temp offscreen canvas to scale image to 320x200
    const offCanvas = document.createElement('canvas');
    offCanvas.width = width;
    offCanvas.height = height;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.drawImage(uploadedImage, 0, 0, width, height);
    const srcData = offCtx.getImageData(0, 0, width, height);
    const pixels = srcData.data;

    const outData = ctx.createImageData(width, height);
    const out32 = new Uint32Array(outData.data.buffer);
    const pal32 = getPalette32();

    if (ditherAlgorithm === 'NEAREST') {
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const bestIdx = findClosestPaletteIndex(r, g, b);
        out32[i / 4] = pal32[bestIdx];
      }
    } else {
      // Floyd-Steinberg error diffusion
      // Create float error buffers
      const rErr = new Float32Array(width * height);
      const gErr = new Float32Array(width * height);
      const bErr = new Float32Array(width * height);

      for (let i = 0; i < width * height; i++) {
        rErr[i] = pixels[i * 4];
        gErr[i] = pixels[i * 4 + 1];
        bErr[i] = pixels[i * 4 + 2];
      }

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const oldR = Math.max(0, Math.min(255, rErr[idx]));
          const oldG = Math.max(0, Math.min(255, gErr[idx]));
          const oldB = Math.max(0, Math.min(255, bErr[idx]));

          const bestIdx = findClosestPaletteIndex(oldR, oldG, oldB);
          out32[idx] = pal32[bestIdx];

          const targetColor = palette[bestIdx] || palette[0] || { r: 0, g: 0, b: 0 };
          const newR = dac6ToRgb8(targetColor.r);
          const newG = dac6ToRgb8(targetColor.g);
          const newB = dac6ToRgb8(targetColor.b);

          const errR = oldR - newR;
          const errG = oldG - newG;
          const errB = oldB - newB;

          // Distribute errors:
          // [   *   7/16]
          // [3/16 5/16 1/16]
          if (x + 1 < width) {
            const nextIdx = idx + 1;
            rErr[nextIdx] += (errR * 7) / 16;
            gErr[nextIdx] += (errG * 7) / 16;
            bErr[nextIdx] += (errB * 7) / 16;
          }
          if (y + 1 < height) {
            if (x > 0) {
              const blIdx = (y + 1) * width + x - 1;
              rErr[blIdx] += (errR * 3) / 16;
              gErr[blIdx] += (errG * 3) / 16;
              bErr[blIdx] += (errB * 3) / 16;
            }
            const bIdx = (y + 1) * width + x;
            rErr[bIdx] += (errR * 5) / 16;
            gErr[bIdx] += (errG * 5) / 16;
            bErr[bIdx] += (errB * 5) / 16;

            if (x + 1 < width) {
              const brIdx = (y + 1) * width + x + 1;
              rErr[brIdx] += (errR * 1) / 16;
              gErr[brIdx] += (errG * 1) / 16;
              bErr[brIdx] += (errB * 1) / 16;
            }
          }
        }
      }
    }

    ctx.putImageData(outData, 0, 0);
  }, [uploadedImage, ditherAlgorithm, findClosestPaletteIndex, getPalette32, palette]);

  // Sprite Scratchpad renderer
  const drawSpritePad = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = '#000044';
    ctx.fillRect(0, 0, width, height);

    const cellSize = Math.floor(height / (SPRITE_SIZE + 2));
    const padStartX = Math.floor((width - SPRITE_SIZE * cellSize) / 2);
    const padStartY = Math.floor((height - SPRITE_SIZE * cellSize) / 2);

    for (let y = 0; y < SPRITE_SIZE; y++) {
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const colorIdx = spritePixels[y * SPRITE_SIZE + x] % palette.length;
        const color = palette[colorIdx];
        ctx.fillStyle = rgb6ToHex(color);
        ctx.fillRect(padStartX + x * cellSize, padStartY + y * cellSize, cellSize, cellSize);

        if (showSpriteGrid) {
          ctx.strokeStyle = '#222266';
          ctx.strokeRect(padStartX + x * cellSize, padStartY + y * cellSize, cellSize, cellSize);
        }
      }
    }

    // 1x and 2x preview in corner
    ctx.fillStyle = '#000000';
    ctx.fillRect(10, 10, 36, 36);
    ctx.strokeStyle = '#FFFFFF';
    ctx.strokeRect(10, 10, 36, 36);

    for (let y = 0; y < SPRITE_SIZE; y++) {
      for (let x = 0; x < SPRITE_SIZE; x++) {
        const colorIdx = spritePixels[y * SPRITE_SIZE + x] % palette.length;
        ctx.fillStyle = rgb6ToHex(palette[colorIdx]);
        ctx.fillRect(12 + x * 2, 12 + y * 2, 2, 2);
      }
    }

    ctx.font = '10px monospace';
    ctx.fillStyle = '#FFFF55';
    ctx.fillText('1X/2X PREVIEW', 10, 58);
  }, [palette, spritePixels, showSpriteGrid]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (mode === 'FIRE_PLASMA') {
      const render = () => {
        drawFirePlasma(ctx, canvas.width, canvas.height);
        animFrameRef.current = requestAnimationFrame(render);
      };
      animFrameRef.current = requestAnimationFrame(render);
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (mode === 'GORILLAS') {
        drawGorillas(ctx, canvas.width, canvas.height);
      } else if (mode === 'CALIBRATION') {
        drawCalibration(ctx, canvas.width, canvas.height);
      } else if (mode === 'IMAGE_DITHER') {
        drawImageDither(ctx, canvas.width, canvas.height);
      } else if (mode === 'SPRITE_PAD') {
        drawSpritePad(ctx, canvas.width, canvas.height);
      }
    }
  }, [mode, palette, drawGorillas, drawCalibration, drawFirePlasma, drawImageDither, drawSpritePad]);

  // Sprite pad interaction
  const handleSpriteCanvasAction = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (mode !== 'SPRITE_PAD') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const cellSize = Math.floor(canvas.height / (SPRITE_SIZE + 2));
    const padStartX = Math.floor((canvas.width - SPRITE_SIZE * cellSize) / 2);
    const padStartY = Math.floor((canvas.height - SPRITE_SIZE * cellSize) / 2);

    const x = Math.floor((clickX - padStartX) / cellSize);
    const y = Math.floor((clickY - padStartY) / cellSize);

    if (x >= 0 && x < SPRITE_SIZE && y >= 0 && y < SPRITE_SIZE) {
      setSpritePixels(prev => {
        const next = [...prev];
        const idx = y * SPRITE_SIZE + x;
        if (spriteTool === 'PEN') {
          next[idx] = activeColorIndex;
        } else if (spriteTool === 'ERASER') {
          next[idx] = 0;
        } else if (spriteTool === 'FILL') {
          const targetColor = next[idx];
          if (targetColor !== activeColorIndex) {
            // Flood fill
            const queue: [number, number][] = [[x, y]];
            const visited = new Set<number>();
            while (queue.length > 0) {
              const [qx, qy] = queue.pop()!;
              const qIdx = qy * SPRITE_SIZE + qx;
              if (visited.has(qIdx)) continue;
              visited.add(qIdx);
              if (next[qIdx] === targetColor) {
                next[qIdx] = activeColorIndex;
                if (qx > 0) queue.push([qx - 1, qy]);
                if (qx < SPRITE_SIZE - 1) queue.push([qx + 1, qy]);
                if (qy > 0) queue.push([qx, qy - 1]);
                if (qy < SPRITE_SIZE - 1) queue.push([qx, qy + 1]);
              }
            }
          }
        }
        return next;
      });
      sound.click();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = evt => {
        const img = new Image();
        img.onload = () => {
          setUploadedImage(img);
          setMode('IMAGE_DITHER');
          sound.chirp();
        };
        img.src = evt.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[#0000AA] border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,0.6)] p-3 flex flex-col font-mono text-white">
      {/* Header Tabs */}
      <div className="flex flex-wrap items-center justify-between pb-2 border-b border-[#00AAAA] mb-2 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="bg-[#00AAAA] text-[#0000AA] px-1.5 py-0.5 font-bold mr-1">
            VGA PREVIEW
          </span>
          <button
            onClick={() => { sound.click(); setMode('GORILLAS'); }}
            className={`px-2 py-0.5 ${mode === 'GORILLAS' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-[#000080] hover:bg-neutral-700'}`}
          >
            Gorillas Scene
          </button>
          <button
            onClick={() => { sound.click(); setMode('CALIBRATION'); }}
            className={`px-2 py-0.5 ${mode === 'CALIBRATION' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-[#000080] hover:bg-neutral-700'}`}
          >
            VGA Test Card
          </button>
          <button
            onClick={() => { sound.click(); setMode('FIRE_PLASMA'); }}
            className={`px-2 py-0.5 flex items-center gap-1 ${mode === 'FIRE_PLASMA' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-[#000080] hover:bg-neutral-700'}`}
          >
            <Flame size={12} /> Fire/Plasma
          </button>
          <button
            onClick={() => { sound.click(); setMode('IMAGE_DITHER'); }}
            className={`px-2 py-0.5 flex items-center gap-1 ${mode === 'IMAGE_DITHER' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-[#000080] hover:bg-neutral-700'}`}
          >
            <ImageIcon size={12} /> Dither Image
          </button>
          <button
            onClick={() => { sound.click(); setMode('SPRITE_PAD'); }}
            className={`px-2 py-0.5 flex items-center gap-1 ${mode === 'SPRITE_PAD' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-[#000080] hover:bg-neutral-700'}`}
          >
            <Paintbrush size={12} /> Sprite Pad
          </button>
        </div>

        <span className="text-[11px] text-[#AAAAAA]">
          320x200 (Mode 13h)
        </span>
      </div>

      {/* Main Canvas Viewport (Authentic 320x200 aspect ratio 4:3 or 16:10) */}
      <div className="relative bg-black border-2 border-[#555555] flex items-center justify-center p-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={320}
          height={200}
          onMouseDown={e => {
            isMouseDownRef.current = true;
            handleSpriteCanvasAction(e);
          }}
          onMouseMove={e => {
            if (isMouseDownRef.current && spriteTool !== 'FILL') {
              handleSpriteCanvasAction(e);
            }
          }}
          onMouseUp={() => { isMouseDownRef.current = false; }}
          onMouseLeave={() => { isMouseDownRef.current = false; }}
          className="w-full max-w-[640px] aspect-[16/10] image-rendering-pixelated bg-black cursor-crosshair shadow-inner"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Contextual Sub-bar for active mode */}
      <div className="mt-2 pt-2 border-t border-[#00AAAA] flex flex-wrap items-center justify-between text-xs bg-[#000080] px-2 py-1.5">
        {mode === 'IMAGE_DITHER' ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <label className="px-2 py-1 bg-[#00AAAA] hover:bg-cyan-300 text-black font-bold cursor-pointer border border-black">
                <span>Upload Image...</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <span>Dither:</span>
                <button
                  onClick={() => setDitherAlgorithm('FLOYD')}
                  className={`px-1.5 py-0.5 ${ditherAlgorithm === 'FLOYD' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-700'}`}
                >
                  Floyd-Steinberg
                </button>
                <button
                  onClick={() => setDitherAlgorithm('NEAREST')}
                  className={`px-1.5 py-0.5 ${ditherAlgorithm === 'NEAREST' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-700'}`}
                >
                  Nearest Color
                </button>
              </div>
            </div>
            <span className="text-[11px] text-neutral-300">
              Reduces picture to current active palette
            </span>
          </div>
        ) : mode === 'SPRITE_PAD' ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <div className="flex items-center gap-1">
              <span className="text-yellow-300 font-bold mr-1">Tools:</span>
              <button
                onClick={() => setSpriteTool('PEN')}
                className={`px-2 py-0.5 ${spriteTool === 'PEN' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-700'}`}
              >
                Pencil
              </button>
              <button
                onClick={() => setSpriteTool('ERASER')}
                className={`px-2 py-0.5 ${spriteTool === 'ERASER' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-700'}`}
              >
                Eraser
              </button>
              <button
                onClick={() => setSpriteTool('FILL')}
                className={`px-2 py-0.5 ${spriteTool === 'FILL' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-700'}`}
              >
                Fill
              </button>
              <button
                onClick={() => setShowSpriteGrid(prev => !prev)}
                className="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 text-white"
              >
                Grid: {showSpriteGrid ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => {
                  setSpritePixels(new Array(SPRITE_SIZE * SPRITE_SIZE).fill(0));
                  sound.buzz();
                }}
                className="px-2 py-0.5 bg-red-800 hover:bg-red-700 text-white ml-2"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span>Drawing with Color:</span>
              <div
                className="w-4 h-4 border border-white"
                style={{ backgroundColor: rgb6ToHex(palette[activeColorIndex]) }}
              />
              <span className="font-bold text-[#FFFF55]">#{activeColorIndex}</span>
            </div>
          </div>
        ) : mode === 'FIRE_PLASMA' ? (
          <div className="flex items-center justify-between w-full text-[11px]">
            <span className="text-yellow-300">
              Flame colors dynamically update as you edit DAC values or cycle colors!
            </span>
            <span className="text-[#AAAAAA]">
              Real-time 60 FPS VGA Simulation
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full text-[11px]">
            <span className="text-neutral-300">
              Live QBasic SCREEN 13 graphical simulation using active 18-bit DAC values.
            </span>
            <span className="text-[#FFFF55]">
              Press ESC or choose another preview anytime
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
