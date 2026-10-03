import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RGB6, 
  rgb6ToHex, 
  hexToRgb6, 
  dac6ToRgb8, 
  rgb6ToHsl, 
  hslToRgb6, 
  rgb6ToQbasicLong 
} from '../types/palette';
import { searchNamedColors, NamedColor } from '../types/namedColors';
import { sound } from '../utils/audio';
import { Sliders, RefreshCw, Copy, Check, Sun, Moon, History, Search, X, Pipette, Palette } from 'lucide-react';
import { VisualColorPicker } from './VisualColorPicker';

interface ColorEditorProps {
  color: RGB6;
  index: number;
  onChangeColor: (newColor: RGB6) => void;
  onCopyColor: () => void;
  onPasteColor: () => void;
  canPaste: boolean;
  onOpenSearchModal?: () => void;
}

export const ColorEditor: React.FC<ColorEditorProps> = ({
  color,
  index,
  onChangeColor,
  onCopyColor,
  onPasteColor,
  canPaste,
  onOpenSearchModal,
}) => {
  const safeColor: RGB6 = color || { r: 0, g: 0, b: 0 };
  const [copied, setCopied] = useState(false);
  const [hexInput, setHexInput] = useState(rgb6ToHex(safeColor));
  const [activeTab, setActiveTab] = useState<'DAC' | 'HSL' | 'VISUAL'>('DAC');
  const nativeInputRef = useRef<HTMLInputElement>(null);

  // Named Color Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const searchResults = searchNamedColors(searchQuery, 16);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Store and display the last 8 colors used in the ColorEditor
  const [recentColors, setRecentColors] = useState<RGB6[]>(() => {
    try {
      const saved = localStorage.getItem('qbasic_recent_colors');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 8);
        }
      }
    } catch {}
    // Default initial 8 recent colors (classic VGA standard shades)
    return [
      { r: 63, g: 63, b: 63 }, // Bright White
      { r: 63, g: 63, b: 21 }, // Yellow
      { r: 63, g: 21, b: 63 }, // Magenta
      { r: 63, g: 21, b: 21 }, // Red
      { r: 21, g: 63, b: 63 }, // Cyan
      { r: 21, g: 63, b: 21 }, // Green
      { r: 21, g: 21, b: 63 }, // Blue
      { r: 42, g: 21, b: 0 },  // Brown
    ];
  });

  const addToRecentColors = useCallback((newColor: RGB6) => {
    setRecentColors(prev => {
      // Check if identical to most recent
      if (prev.length > 0 && prev[0].r === newColor.r && prev[0].g === newColor.g && prev[0].b === newColor.b) {
        return prev;
      }
      // Remove any duplicate of this shade
      const filtered = prev.filter(c => !(c.r === newColor.r && c.g === newColor.g && c.b === newColor.b));
      const updated = [newColor, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('qbasic_recent_colors', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // When safeColor changes, debounce adding to recent colors so slider dragging doesn't flood history
  useEffect(() => {
    const timer = setTimeout(() => {
      addToRecentColors(safeColor);
    }, 350);
    return () => clearTimeout(timer);
  }, [safeColor.r, safeColor.g, safeColor.b, addToRecentColors]);

  const handleSelectRecent = (recentColor: RGB6) => {
    sound.select();
    onChangeColor({ ...recentColor });
    addToRecentColors(recentColor);
  };

  useEffect(() => {
    setHexInput(rgb6ToHex(safeColor));
  }, [safeColor]);

  const updateChannel = (channel: keyof RGB6, value: number) => {
    const clamped = Math.max(0, Math.min(63, value));
    onChangeColor({
      ...safeColor,
      [channel]: clamped,
    });
  };

  const hsl = rgb6ToHsl(safeColor);

  const updateHsl = (h: number, s: number, l: number) => {
    const newRgb = hslToRgb6({ h, s, l });
    onChangeColor(newRgb);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHexInput(val);
    if (/^#?[0-9A-Fa-f]{6}$/.test(val)) {
      onChangeColor(hexToRgb6(val));
    }
  };

  const handleNativePicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    onChangeColor(hexToRgb6(hex));
  };

  const invertColor = () => {
    sound.click();
    onChangeColor({
      r: 63 - safeColor.r,
      g: 63 - safeColor.g,
      b: 63 - safeColor.b,
    });
  };

  const grayscaleColor = () => {
    sound.click();
    // VGA standard NTSC luminance weighting
    const lum = Math.round(0.299 * safeColor.r + 0.587 * safeColor.g + 0.114 * safeColor.b);
    onChangeColor({ r: lum, g: lum, b: lum });
  };

  const adjustBrightness = (delta: number) => {
    sound.click();
    onChangeColor({
      r: Math.max(0, Math.min(63, safeColor.r + delta)),
      g: Math.max(0, Math.min(63, safeColor.g + delta)),
      b: Math.max(0, Math.min(63, safeColor.b + delta)),
    });
  };

  const handleCopy = () => {
    sound.chirp();
    onCopyColor();
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const currentHex = rgb6ToHex(safeColor);
  const qbLong = rgb6ToQbasicLong(safeColor);

  return (
    <div className="bg-[#0000AA] border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,0.6)] p-3 text-white font-mono flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-[#00AAAA] mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="bg-[#00AAAA] text-[#0000AA] px-1.5 py-0.5 font-bold">
              DAC COLOR EDITOR
            </span>
            <span className="font-bold text-[#FFFF55]">
              COLOR #{index}
            </span>
          </div>

          {/* Tab selector */}
          <div className="flex border border-[#00AAAA] text-[10px]">
            <button
              onClick={() => setActiveTab('DAC')}
              className={`px-1.5 py-0.5 ${activeTab === 'DAC' ? 'bg-white text-black font-bold' : 'hover:bg-[#000080]'}`}
            >
              6-BIT DAC
            </button>
            <button
              onClick={() => setActiveTab('HSL')}
              className={`px-1.5 py-0.5 ${activeTab === 'HSL' ? 'bg-white text-black font-bold' : 'hover:bg-[#000080]'}`}
            >
              HSL
            </button>
            <button
              onClick={() => setActiveTab('VISUAL')}
              className={`px-1.5 py-0.5 ${activeTab === 'VISUAL' ? 'bg-[#FFFF55] text-black font-bold' : 'hover:bg-[#000080]'}`}
            >
              2D PICKER
            </button>
          </div>
        </div>

        {/* Swatch & Values Preview */}
        <div className="flex items-center gap-3 bg-[#000080] p-2 border border-[#00AAAA] mb-3">
          {/* Large Color Swatch with System Native Color Picker Trigger */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              onClick={() => nativeInputRef.current?.click()}
              className="relative w-14 h-14 border-2 border-white shadow-inner group cursor-pointer"
              style={{ backgroundColor: currentHex }}
              title="Click to launch system-native color picker overlay"
            >
              <input
                ref={nativeInputRef}
                type="color"
                value={currentHex}
                onChange={handleNativePicker}
                className="sr-only"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                <Pipette size={18} className="text-white drop-shadow-[0_1px_2px_black]" />
              </div>
              <span className="absolute bottom-0 right-0 bg-black/80 text-[8px] px-1 text-cyan-300 pointer-events-none">
                PICK
              </span>
            </div>
            <button
              type="button"
              onClick={() => nativeInputRef.current?.click()}
              className="text-[9px] bg-neutral-700 hover:bg-[#00AAAA] hover:text-black text-neutral-200 px-1 py-0.5 border border-neutral-500 font-bold w-14 text-center tracking-tight"
              title="Open OS system color picker"
            >
              SYSTEM
            </button>
          </div>

          <div className="flex-1 min-w-0 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#AAAAAA]">Hex RGB:</span>
              <input
                type="text"
                value={hexInput}
                onChange={handleHexChange}
                maxLength={7}
                className="w-20 bg-black border border-neutral-400 text-center text-yellow-300 font-bold px-1 py-0.5 text-xs uppercase"
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#AAAAAA]">24-bit RGB:</span>
              <span className="tabular-nums text-white">
                {dac6ToRgb8(safeColor.r)}, {dac6ToRgb8(safeColor.g)}, {dac6ToRgb8(safeColor.b)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#AAAAAA]">QBasic Long:</span>
              <span className="tabular-nums text-cyan-300 font-semibold">{qbLong}&amp;</span>
            </div>
          </div>
        </div>

        {/* Named VGA Colors Search Bar */}
        <div ref={searchContainerRef} className="relative mb-3">
          <div className="flex items-center gap-1.5 bg-black border border-neutral-400 px-2 py-1.5 focus-within:border-[#FFFF55] transition-colors shadow-inner">
            <Search size={14} className="text-yellow-300 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                setIsSearchOpen(true);
              }}
              onKeyDown={e => {
                if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                } else if (e.key === 'Enter' && searchResults.length > 0) {
                  e.preventDefault();
                  const topResult = searchResults[0];
                  sound.select();
                  onChangeColor({ ...topResult.color });
                  addToRecentColors(topResult.color);
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }
              }}
              placeholder="Find named color (e.g. 'Dark Blue', 'Bright Red')..."
              className="w-full bg-transparent text-white placeholder-neutral-500 text-xs font-mono focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsSearchOpen(false);
                }}
                className="text-neutral-400 hover:text-white px-1 text-xs"
                title="Clear Search"
              >
                <X size={12} />
              </button>
            ) : null}
            {onOpenSearchModal && (
              <button
                type="button"
                onClick={() => {
                  sound.click();
                  onOpenSearchModal();
                }}
                className="text-[10px] bg-neutral-700 hover:bg-[#0000AA] hover:text-white text-neutral-200 px-1.5 py-0.5 border border-neutral-500 shrink-0 font-bold"
                title="Open full named color browser modal (F3)"
              >
                BROWSE
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-black border-2 border-white shadow-[6px_6px_0_rgba(0,0,0,0.85)] z-40 max-h-56 overflow-y-auto p-1 font-mono text-xs">
              <div className="px-2 py-1 text-[10px] text-yellow-300 border-b border-neutral-700 flex justify-between items-center mb-1">
                <span>{searchQuery.trim() ? `Matching "${searchQuery}"` : 'Preset Named Colors:'}</span>
                <span className="text-neutral-400">{searchResults.length} colors</span>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-3 text-neutral-400 text-center text-[11px]">
                  No named colors found matching "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-0.5">
                  {searchResults.map((item, idx) => {
                    const hex = rgb6ToHex(item.color);
                    const isCurrent =
                      safeColor.r === item.color.r &&
                      safeColor.g === item.color.g &&
                      safeColor.b === item.color.b;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          sound.select();
                          onChangeColor({ ...item.color });
                          addToRecentColors(item.color);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full text-left flex items-center justify-between p-1.5 hover:bg-[#0000AA] hover:text-white transition-colors cursor-pointer border group ${
                          isCurrent
                            ? 'border-yellow-400 bg-neutral-900'
                            : 'border-transparent hover:border-cyan-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-4 h-4 border border-white shrink-0 shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="font-bold text-white group-hover:text-yellow-300 truncate text-xs">
                            {item.name}
                          </span>
                          {item.vgaIndex !== undefined && (
                            <span className="text-[10px] text-cyan-300 font-normal">#{item.vgaIndex}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-neutral-400 group-hover:text-neutral-200 shrink-0 tabular-nums">
                          DAC: {item.color.r},{item.color.g},{item.color.b}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Colors (Last 8) */}
        <div className="bg-[#000080] p-2 border border-[#00AAAA] mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#FFFF55] font-bold flex items-center gap-1.5">
              <History size={13} className="text-yellow-300" />
              <span>RECENT COLORS</span>
            </span>
            <span className="text-[10px] text-[#AAAAAA]">
              Last 8 Used Shades
            </span>
          </div>

          <div className="grid grid-cols-8 gap-1.5 bg-black p-1.5 border border-neutral-600">
            {Array.from({ length: 8 }).map((_, slotIdx) => {
              const rColor = recentColors[slotIdx];
              if (!rColor) {
                return (
                  <div
                    key={slotIdx}
                    className="aspect-square border border-dashed border-neutral-700 bg-neutral-900/60 flex items-center justify-center text-[9px] text-neutral-600 select-none"
                    title={`Slot #${slotIdx + 1}: Empty`}
                  >
                    ·
                  </div>
                );
              }

              const hex = rgb6ToHex(rColor);
              const isCurrent =
                safeColor.r === rColor.r &&
                safeColor.g === rColor.g &&
                safeColor.b === rColor.b;

              return (
                <button
                  key={slotIdx}
                  type="button"
                  onClick={() => handleSelectRecent(rColor)}
                  className={`aspect-square relative border transition-transform hover:scale-110 focus:outline-none cursor-pointer group ${
                    isCurrent
                      ? 'border-white ring-2 ring-[#FFFF55] z-10 scale-105 shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                      : 'border-neutral-500 hover:border-cyan-300'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={`Recent #${slotIdx + 1}\nDAC: R:${rColor.r} G:${rColor.g} B:${rColor.b}\nHex: ${hex}\nClick to apply to Color #${index}`}
                >
                  {isCurrent && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_2px_black]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Channel Sliders */}
        {activeTab === 'DAC' ? (
          <div className="space-y-3 bg-[#000066] p-2.5 border border-[#00AAAA]">
            {/* Red Channel (0-63) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-red-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> RED DAC:
                </span>
                <span className="font-bold tabular-nums text-white">{safeColor.r} / 63</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateChannel('r', safeColor.r - 1)}
                  className="px-1.5 py-0.5 bg-[#AAAAAA] text-black font-bold text-xs hover:bg-white active:bg-neutral-400"
                >
                  -
                </button>
                <input
                  type="range"
                  min={0}
                  max={63}
                  value={safeColor.r}
                  onChange={e => updateChannel('r', parseInt(e.target.value, 10))}
                  className="flex-1 accent-red-500 cursor-pointer h-2 bg-neutral-800 rounded"
                />
                <button
                  onClick={() => updateChannel('r', safeColor.r + 1)}
                  className="px-1.5 py-0.5 bg-[#AAAAAA] text-black font-bold text-xs hover:bg-white active:bg-neutral-400"
                >
                  +
                </button>
              </div>
            </div>

            {/* Green Channel (0-63) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-green-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> GREEN DAC:
                </span>
                <span className="font-bold tabular-nums text-white">{safeColor.g} / 63</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateChannel('g', safeColor.g - 1)}
                  className="px-1.5 py-0.5 bg-[#AAAAAA] text-black font-bold text-xs hover:bg-white active:bg-neutral-400"
                >
                  -
                </button>
                <input
                  type="range"
                  min={0}
                  max={63}
                  value={safeColor.g}
                  onChange={e => updateChannel('g', parseInt(e.target.value, 10))}
                  className="flex-1 accent-green-500 cursor-pointer h-2 bg-neutral-800 rounded"
                />
                <button
                  onClick={() => updateChannel('g', safeColor.g + 1)}
                  className="px-1.5 py-0.5 bg-[#AAAAAA] text-black font-bold text-xs hover:bg-white active:bg-neutral-400"
                >
                  +
                </button>
              </div>
            </div>

            {/* Blue Channel (0-63) */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-blue-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> BLUE DAC:
                </span>
                <span className="font-bold tabular-nums text-white">{safeColor.b} / 63</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateChannel('b', safeColor.b - 1)}
                  className="px-1.5 py-0.5 bg-[#AAAAAA] text-black font-bold text-xs hover:bg-white active:bg-neutral-400"
                >
                  -
                </button>
                <input
                  type="range"
                  min={0}
                  max={63}
                  value={safeColor.b}
                  onChange={e => updateChannel('b', parseInt(e.target.value, 10))}
                  className="flex-1 accent-blue-500 cursor-pointer h-2 bg-neutral-800 rounded"
                />
                <button
                  onClick={() => updateChannel('b', safeColor.b + 1)}
                  className="px-1.5 py-0.5 bg-[#AAAAAA] text-black font-bold text-xs hover:bg-white active:bg-neutral-400"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ) : activeTab === 'HSL' ? (
          /* HSL Sliders */
          <div className="space-y-3 bg-[#000066] p-2.5 border border-[#00AAAA]">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-yellow-300">Hue:</span>
                <span className="tabular-nums">{hsl.h}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={360}
                value={hsl.h}
                onChange={e => updateHsl(parseInt(e.target.value, 10), hsl.s, hsl.l)}
                className="w-full h-2 rounded bg-neutral-800 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-yellow-300">Saturation:</span>
                <span className="tabular-nums">{hsl.s}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={hsl.s}
                onChange={e => updateHsl(hsl.h, parseInt(e.target.value, 10), hsl.l)}
                className="w-full h-2 rounded bg-neutral-800 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-yellow-300">Lightness:</span>
                <span className="tabular-nums">{hsl.l}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={hsl.l}
                onChange={e => updateHsl(hsl.h, hsl.s, parseInt(e.target.value, 10))}
                className="w-full h-2 rounded bg-neutral-800 cursor-pointer"
              />
            </div>
          </div>
        ) : (
          /* Visual 2D Color Spectrum & Hue Picker */
          <VisualColorPicker
            color={safeColor}
            onChangeColor={onChangeColor}
          />
        )}

        {/* Quick Operations toolbar */}
        <div className="mt-3 grid grid-cols-4 gap-1 text-[11px]">
          <button
            onClick={invertColor}
            className="px-1 py-1 bg-neutral-300 hover:bg-white text-black font-semibold text-center border border-black"
            title="Invert DAC values (63 - value)"
          >
            Invert
          </button>
          <button
            onClick={grayscaleColor}
            className="px-1 py-1 bg-neutral-300 hover:bg-white text-black font-semibold text-center border border-black"
            title="Convert to grayscale using NTSC luminance weights"
          >
            Gray
          </button>
          <button
            onClick={() => adjustBrightness(2)}
            className="px-1 py-1 bg-neutral-300 hover:bg-white text-black font-semibold text-center border border-black"
            title="Increase brightness by 2 DAC levels"
          >
            +Bright
          </button>
          <button
            onClick={() => adjustBrightness(-2)}
            className="px-1 py-1 bg-neutral-300 hover:bg-white text-black font-semibold text-center border border-black"
            title="Decrease brightness by 2 DAC levels"
          >
            -Dark
          </button>
        </div>

        {/* Copy / Paste row */}
        <div className="mt-2 flex gap-1 text-xs">
          <button
            onClick={handleCopy}
            className="flex-1 py-1 bg-[#00AAAA] hover:bg-cyan-400 text-black font-bold flex items-center justify-center gap-1 border border-black"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'COPIED!' : 'COPY COLOR'}</span>
          </button>
          <button
            onClick={onPasteColor}
            disabled={!canPaste}
            className={`flex-1 py-1 font-bold border border-black ${
              canPaste
                ? 'bg-[#00AAAA] hover:bg-cyan-400 text-black'
                : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
            }`}
          >
            PASTE COLOR
          </button>
        </div>
      </div>

      {/* Direct QBasic statement preview */}
      <div className="mt-3 pt-2 border-t border-[#00AAAA] bg-black p-2 text-[10px] text-green-400 leading-tight font-mono">
        <div className="text-neutral-500 mb-0.5">' Direct VGA DAC write:</div>
        <div>OUT &amp;H3C8, {index}</div>
        <div>OUT &amp;H3C9, {safeColor.r} : OUT &amp;H3C9, {safeColor.g} : OUT &amp;H3C9, {safeColor.b}</div>
      </div>
    </div>
  );
};
