import React, { useState } from 'react';
import { RGB6, rgb6ToHex, rgb6ToHsl, hslToRgb6, dac6ToRgb8 } from '../types/palette';
import { sound } from '../utils/audio';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface GradientGeneratorProps {
  palette: RGB6[];
  onApplyRamp: (startIndex: number, endIndex: number, rampColors: RGB6[]) => void;
  onClose: () => void;
  initialStartIndex?: number;
  initialEndIndex?: number;
}

export const GradientGenerator: React.FC<GradientGeneratorProps> = ({
  palette,
  onApplyRamp,
  onClose,
  initialStartIndex = 0,
  initialEndIndex = 15,
}) => {
  const maxIdx = Math.max(0, palette.length - 1);
  const [startIndex, setStartIndex] = useState<number>(
    Math.max(0, Math.min(initialStartIndex, maxIdx))
  );
  const [endIndex, setEndIndex] = useState<number>(
    Math.max(0, Math.min(initialEndIndex, maxIdx))
  );

  const [startColor, setStartColor] = useState<RGB6>(
    palette[startIndex] || palette[0] || { r: 0, g: 0, b: 0 }
  );
  const [endColor, setEndColor] = useState<RGB6>(
    palette[endIndex] || palette[maxIdx] || { r: 63, g: 63, b: 63 }
  );

  const [interpolationMode, setInterpolationMode] = useState<'RGB' | 'HSL'>('RGB');

  // Compute interpolated ramp
  const computeRamp = (): RGB6[] => {
    const s = Math.min(startIndex, endIndex);
    const e = Math.max(startIndex, endIndex);
    const count = e - s + 1;
    if (count <= 1) return [startColor];

    const result: RGB6[] = [];

    if (interpolationMode === 'RGB') {
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        result.push({
          r: Math.round(startColor.r + (endColor.r - startColor.r) * t),
          g: Math.round(startColor.g + (endColor.g - startColor.g) * t),
          b: Math.round(startColor.b + (endColor.b - startColor.b) * t),
        });
      }
    } else {
      // HSL interpolation
      const hsl1 = rgb6ToHsl(startColor);
      const hsl2 = rgb6ToHsl(endColor);
      for (let i = 0; i < count; i++) {
        const t = i / (count - 1);
        const h = Math.round(hsl1.h + (hsl2.h - hsl1.h) * t);
        const sVal = Math.round(hsl1.s + (hsl2.s - hsl1.s) * t);
        const l = Math.round(hsl1.l + (hsl2.l - hsl1.l) * t);
        result.push(hslToRgb6({ h: (h + 360) % 360, s: sVal, l }));
      }
    }

    return startIndex <= endIndex ? result : result.reverse();
  };

  const previewRamp = computeRamp();

  const handleApply = () => {
    sound.chirp();
    const s = Math.min(startIndex, endIndex);
    const e = Math.max(startIndex, endIndex);
    onApplyRamp(s, e, previewRamp);
    onClose();
  };

  // Quick preset ramps
  const applyPresetRamp = (type: 'FIRE' | 'ICE' | 'COPPER' | 'GRAY' | 'NEON' | 'FOREST') => {
    sound.click();
    if (type === 'FIRE') {
      setStartColor({ r: 0, g: 0, b: 0 });
      setEndColor({ r: 63, g: 63, b: 20 });
    } else if (type === 'ICE') {
      setStartColor({ r: 0, g: 10, b: 35 });
      setEndColor({ r: 50, g: 63, b: 63 });
    } else if (type === 'COPPER') {
      setStartColor({ r: 15, g: 5, b: 0 });
      setEndColor({ r: 63, g: 45, b: 20 });
    } else if (type === 'GRAY') {
      setStartColor({ r: 0, g: 0, b: 0 });
      setEndColor({ r: 63, g: 63, b: 63 });
    } else if (type === 'NEON') {
      setStartColor({ r: 55, g: 0, b: 50 });
      setEndColor({ r: 0, g: 60, b: 60 });
    } else if (type === 'FOREST') {
      setStartColor({ r: 2, g: 15, b: 2 });
      setEndColor({ r: 35, g: 63, b: 20 });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0000AA] border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,0.8)] font-mono text-white p-4">
        {/* Title bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#00AAAA] mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-yellow-300" size={18} />
            <span className="font-bold text-sm tracking-wide">
              GRADIENT &amp; COLOR RAMP GENERATOR
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-neutral-300 text-black font-bold hover:bg-red-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Index range pickers */}
        <div className="grid grid-cols-2 gap-4 bg-[#000080] p-3 border border-[#00AAAA] mb-4 text-xs">
          <div>
            <label className="block text-yellow-300 font-bold mb-1">
              START INDEX (0 - {palette.length - 1}):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={palette.length - 1}
                value={startIndex}
                onChange={e => {
                  const val = Math.max(0, Math.min(palette.length - 1, parseInt(e.target.value, 10) || 0));
                  setStartIndex(val);
                  setStartColor(palette[val] || palette[0] || { r: 0, g: 0, b: 0 });
                }}
                className="w-20 bg-black border border-neutral-400 px-2 py-1 text-center font-bold text-white text-sm"
              />
              <div
                className="w-8 h-8 border-2 border-white shadow shrink-0"
                style={{ backgroundColor: rgb6ToHex(startColor) }}
              />
            </div>
            <div className="mt-1 text-[11px] text-neutral-300">
              DAC: {startColor?.r ?? 0}, {startColor?.g ?? 0}, {startColor?.b ?? 0}
            </div>
          </div>

          <div>
            <label className="block text-yellow-300 font-bold mb-1">
              END INDEX (0 - {palette.length - 1}):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={palette.length - 1}
                value={endIndex}
                onChange={e => {
                  const val = Math.max(0, Math.min(palette.length - 1, parseInt(e.target.value, 10) || 0));
                  setEndIndex(val);
                  setEndColor(palette[val] || palette[palette.length - 1] || { r: 63, g: 63, b: 63 });
                }}
                className="w-20 bg-black border border-neutral-400 px-2 py-1 text-center font-bold text-white text-sm"
              />
              <div
                className="w-8 h-8 border-2 border-white shadow shrink-0"
                style={{ backgroundColor: rgb6ToHex(endColor) }}
              />
            </div>
            <div className="mt-1 text-[11px] text-neutral-300">
              DAC: {endColor?.r ?? 0}, {endColor?.g ?? 0}, {endColor?.b ?? 0}
            </div>
          </div>
        </div>

        {/* Interpolation mode */}
        <div className="flex items-center justify-between text-xs mb-4 bg-[#000080] p-2 border border-[#00AAAA]">
          <span className="text-yellow-300 font-bold">INTERPOLATION:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setInterpolationMode('RGB')}
              className={`px-3 py-1 font-bold ${
                interpolationMode === 'RGB' ? 'bg-[#FFFF55] text-black' : 'bg-neutral-700 text-white'
              }`}
            >
              Linear RGB (VGA Standard)
            </button>
            <button
              onClick={() => setInterpolationMode('HSL')}
              className={`px-3 py-1 font-bold ${
                interpolationMode === 'HSL' ? 'bg-[#FFFF55] text-black' : 'bg-neutral-700 text-white'
              }`}
            >
              HSL Hue Sweep
            </button>
          </div>
        </div>

        {/* Preset Ramps */}
        <div className="mb-4">
          <div className="text-xs text-yellow-300 font-bold mb-1.5">QUICK PRESET THEMES:</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[11px]">
            <button onClick={() => applyPresetRamp('FIRE')} className="p-1 bg-[#550000] hover:bg-red-700 border border-white">Fire</button>
            <button onClick={() => applyPresetRamp('ICE')} className="p-1 bg-[#000055] hover:bg-blue-700 border border-white">Ice / Water</button>
            <button onClick={() => applyPresetRamp('COPPER')} className="p-1 bg-[#442200] hover:bg-amber-800 border border-white">Copper</button>
            <button onClick={() => applyPresetRamp('GRAY')} className="p-1 bg-[#333333] hover:bg-neutral-600 border border-white">Grayscale</button>
            <button onClick={() => applyPresetRamp('NEON')} className="p-1 bg-[#550055] hover:bg-fuchsia-800 border border-white">Neon Wave</button>
            <button onClick={() => applyPresetRamp('FOREST')} className="p-1 bg-[#004400] hover:bg-green-800 border border-white">Forest</button>
          </div>
        </div>

        {/* Live Ramp Preview Bar */}
        <div className="mb-4 bg-black p-2 border-2 border-white">
          <div className="text-xs text-neutral-400 mb-1 flex justify-between">
            <span>Ramp Preview ({previewRamp.length} steps):</span>
            <span className="text-yellow-300 font-bold">#{startIndex} &rarr; #{endIndex}</span>
          </div>
          <div className="flex h-8 w-full border border-neutral-600">
            {previewRamp.map((color, i) => (
              <div
                key={i}
                className="flex-1 h-full"
                style={{ backgroundColor: rgb6ToHex(color) }}
                title={`Step ${i}: DAC R:${color.r} G:${color.g} B:${color.b}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 text-xs font-bold">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-400 text-black hover:bg-neutral-300 border border-black"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-1.5 bg-[#00AA00] hover:bg-green-400 text-black border border-black flex items-center gap-1 shadow"
          >
            <span>APPLY RAMP TO PALETTE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
