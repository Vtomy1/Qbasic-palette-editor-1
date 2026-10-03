import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RGB6, rgb6ToHex, hexToRgb6, rgb6ToHsv, hsvToRgb6, dac6ToRgb8 } from '../types/palette';
import { sound } from '../utils/audio';
import { Pipette, Palette, Crosshair, Check } from 'lucide-react';

interface VisualColorPickerProps {
  color: RGB6;
  onChangeColor: (color: RGB6) => void;
  onApplyColor?: (color: RGB6) => void;
}

export const VisualColorPicker: React.FC<VisualColorPickerProps> = ({
  color,
  onChangeColor,
  onApplyColor,
}) => {
  const safeColor = color || { r: 0, g: 0, b: 0 };
  const hsv = rgb6ToHsv(safeColor);

  const [hue, setHue] = useState<number>(hsv.h);
  const [sat, setSat] = useState<number>(hsv.s);
  const [val, setVal] = useState<number>(hsv.v);
  const [isDragging, setIsDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nativeInputRef = useRef<HTMLInputElement>(null);

  // Sync internal HSV when external color prop changes and not dragging
  useEffect(() => {
    if (!isDragging) {
      const current = rgb6ToHsv(safeColor);
      // Only update hue if sat or val is significant
      if (current.s > 3 && current.v > 3) {
        setHue(current.h);
      }
      setSat(current.s);
      setVal(current.v);
    }
  }, [safeColor.r, safeColor.g, safeColor.b, isDragging]);

  // Render 2D Saturation / Value Canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Base pure hue color
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, width, height);

    // Horizontal white gradient (Saturation: 0 to 100%)
    const whiteGrad = ctx.createLinearGradient(0, 0, width, 0);
    whiteGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    whiteGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = whiteGrad;
    ctx.fillRect(0, 0, width, height);

    // Vertical black gradient (Value/Brightness: 100% to 0%)
    const blackGrad = ctx.createLinearGradient(0, 0, 0, height);
    blackGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    blackGrad.addColorStop(1, 'rgba(0, 0, 0, 1)');
    ctx.fillStyle = blackGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw Crosshair Handle
    const handleX = (sat / 100) * width;
    const handleY = (1 - val / 100) * height;

    ctx.save();
    ctx.beginPath();
    ctx.arc(handleX, handleY, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(handleX, handleY, 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }, [hue, sat, val]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle position interaction on 2D canvas
  const updateFromPointer = (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * (canvas.width / rect.width)));
    const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * (canvas.height / rect.height)));

    const newSat = Math.round((x / canvas.width) * 100);
    const newVal = Math.round((1 - y / canvas.height) * 100);

    setSat(newSat);
    setVal(newVal);

    const newColor = hsvToRgb6({ h: hue, s: newSat, v: newVal });
    onChangeColor(newColor);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    sound.click();
    setIsDragging(true);
    updateFromPointer(e);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateFromPointer(e);
      }
    };
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, hue]);

  // Handle Hue slider change
  const handleHueChange = (newHue: number) => {
    setHue(newHue);
    const newColor = hsvToRgb6({ h: newHue, s: sat, v: val });
    onChangeColor(newColor);
  };

  // Trigger system native color picker
  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    sound.select();
    const hex = e.target.value;
    const newColor = hexToRgb6(hex);
    onChangeColor(newColor);
  };

  // Screen Eyedropper API (supported in Chromium/Edge/Chrome)
  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        sound.click();
        // @ts-expect-error EyeDropper is a modern browser feature
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          const newColor = hexToRgb6(result.sRGBHex);
          onChangeColor(newColor);
          sound.select();
        }
      } catch {
        // User cancelled eyedropper
      }
    }
  };

  const hasEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window;
  const currentHex = rgb6ToHex(safeColor);

  // Quick tint presets for current hue
  const quickShades: RGB6[] = [0, 20, 40, 60, 80, 100].map(v => 
    hsvToRgb6({ h: hue, s: Math.max(20, sat), v })
  );

  return (
    <div className="bg-[#000066] p-2.5 border border-[#00AAAA] space-y-3 font-mono text-white text-xs select-none">
      {/* 2D Saturation / Value Gradient Canvas */}
      <div>
        <div className="flex justify-between items-center mb-1 text-[11px]">
          <span className="text-yellow-300 font-bold flex items-center gap-1">
            <Crosshair size={12} /> 2D COLOR SPECTRUM:
          </span>
          <span className="text-[#AAAAAA] tabular-nums text-[10px]">
            H:{Math.round(hue)}° S:{Math.round(sat)}% V:{Math.round(val)}%
          </span>
        </div>
        <div className="relative border-2 border-white shadow-[0_0_4px_rgba(0,0,0,0.8)] cursor-crosshair">
          <canvas
            ref={canvasRef}
            width={280}
            height={135}
            onMouseDown={handleMouseDown}
            className="w-full h-32 block touch-none"
          />
        </div>
      </div>

      {/* Rainbow Hue Spectrum Slider */}
      <div>
        <div className="flex justify-between items-center mb-1 text-[11px]">
          <span className="text-yellow-300 font-bold">HUE SPECTRUM:</span>
          <span className="text-white font-bold tabular-nums">{Math.round(hue)}°</span>
        </div>
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={e => handleHueChange(parseInt(e.target.value, 10))}
            className="w-full h-3 rounded appearance-none cursor-pointer border border-white"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
            }}
          />
        </div>
      </div>

      {/* Quick Hue Tint Strip */}
      <div className="pt-1 border-t border-[#00AAAA]/60">
        <div className="text-[10px] text-[#AAAAAA] mb-1">QUICK TINTS FOR CURRENT HUE:</div>
        <div className="grid grid-cols-6 gap-1 bg-black p-1 border border-neutral-600">
          {quickShades.map((shade, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                sound.click();
                onChangeColor(shade);
              }}
              style={{ backgroundColor: rgb6ToHex(shade) }}
              className="h-5 border border-neutral-500 hover:border-white hover:scale-105 transition-transform"
              title={`DAC: R:${shade.r} G:${shade.g} B:${shade.b}`}
            />
          ))}
        </div>
      </div>

      {/* System Native Color Picker & Eyedropper Triggers */}
      <div className="pt-1 border-t border-[#00AAAA] flex gap-1.5">
        {/* Hidden native input */}
        <input
          ref={nativeInputRef}
          type="color"
          value={currentHex}
          onChange={handleNativePickerChange}
          className="sr-only"
        />

        <button
          type="button"
          onClick={() => {
            sound.click();
            nativeInputRef.current?.click();
          }}
          className="flex-1 py-1.5 bg-[#00AAAA] hover:bg-cyan-300 active:bg-cyan-400 text-black font-bold text-xs flex items-center justify-center gap-1.5 border border-black shadow"
          title="Open your browser's system-native color picker dialog"
        >
          <Palette size={13} />
          <span>SYSTEM COLOR PICKER</span>
        </button>

        {hasEyeDropper && (
          <button
            type="button"
            onClick={handleEyeDropper}
            className="px-2.5 py-1.5 bg-neutral-300 hover:bg-white text-black font-bold text-xs flex items-center justify-center gap-1 border border-black shadow"
            title="Eyedropper tool: pick any pixel directly from your screen"
          >
            <Pipette size={13} />
            <span>PICK SCREEN</span>
          </button>
        )}
      </div>
    </div>
  );
};
