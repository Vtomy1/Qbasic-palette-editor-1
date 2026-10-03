import React, { useState, useEffect, useRef } from 'react';
import { RGB6, rgb6ToHex } from '../types/palette';
import { NAMED_VGA_COLORS, NamedColor, searchNamedColors } from '../types/namedColors';
import { sound } from '../utils/audio';
import { Search, X, Check, Palette } from 'lucide-react';

interface ColorSearchModalProps {
  onSelectColor: (color: RGB6) => void;
  onClose: () => void;
  currentColor: RGB6;
  currentIndex: number;
}

export const ColorSearchModal: React.FC<ColorSearchModalProps> = ({
  onSelectColor,
  onClose,
  currentColor,
  currentIndex,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const categories = ['All', 'Standard VGA', 'Retro Tones', 'Grayscale', 'Gaming / Demoscene'];

  const filteredColors = NAMED_VGA_COLORS.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const clean = query.trim().toLowerCase();
    const matchesQuery = !clean || item.name.toLowerCase().includes(clean) || item.category.toLowerCase().includes(clean);
    return matchesCategory && matchesQuery;
  });

  const handlePick = (item: NamedColor) => {
    sound.select();
    onSelectColor(item.color);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0000AA] border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,0.8)] font-mono text-white p-4 flex flex-col max-h-[90vh]">
        {/* Title bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#00AAAA] mb-3">
          <div className="flex items-center gap-2">
            <Search className="text-yellow-300" size={18} />
            <span className="font-bold text-sm tracking-wide">
              SEARCH NAMED VGA PRESET COLORS
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-neutral-300 text-black font-bold hover:bg-red-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Search input bar */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2 bg-black border-2 border-yellow-300 px-3 py-2">
            <Search size={16} className="text-yellow-300 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by color name (e.g. 'Dark Blue', 'Bright Red', 'Cyan', 'Gold')..."
              className="w-full bg-transparent text-white placeholder-neutral-500 text-sm font-mono focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-neutral-400 hover:text-white px-1 text-xs"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap gap-1 mb-3 text-xs">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                sound.click();
                setSelectedCategory(cat);
              }}
              className={`px-2 py-0.5 border ${
                selectedCategory === cat
                  ? 'bg-[#FFFF55] text-black font-bold border-yellow-400'
                  : 'bg-[#000080] text-neutral-300 hover:text-white border-[#00AAAA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results Count & Current Active Color indicator */}
        <div className="flex items-center justify-between text-xs text-neutral-300 mb-2 px-1">
          <span>Found {filteredColors.length} matching colors:</span>
          <span className="text-yellow-300">
            Applying to Color #{currentIndex}
          </span>
        </div>

        {/* Scrollable Color Results Grid */}
        <div className="flex-1 overflow-y-auto border-2 border-white bg-black p-2 min-h-[240px] max-h-[380px] space-y-1">
          {filteredColors.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs">
              No named colors found matching "{query}". Try "blue", "red", "green", "gray", or "yellow".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {filteredColors.map((item, idx) => {
                const hex = rgb6ToHex(item.color);
                const isCurrent =
                  currentColor.r === item.color.r &&
                  currentColor.g === item.color.g &&
                  currentColor.b === item.color.b;

                return (
                  <button
                    key={idx}
                    onClick={() => handlePick(item)}
                    className={`flex items-center gap-2.5 p-1.5 text-left border transition-colors cursor-pointer group ${
                      isCurrent
                        ? 'border-yellow-400 bg-neutral-900 ring-1 ring-yellow-400'
                        : 'border-neutral-800 hover:border-cyan-300 hover:bg-neutral-900'
                    }`}
                  >
                    <div
                      className="w-7 h-7 border border-white shrink-0 shadow-sm relative"
                      style={{ backgroundColor: hex }}
                    >
                      {isCurrent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={14} className="text-white drop-shadow-[0_1px_2px_black]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-xs leading-tight">
                      <div className="font-bold text-white group-hover:text-yellow-300 truncate flex items-center justify-between">
                        <span>{item.name}</span>
                        {item.vgaIndex !== undefined && (
                          <span className="text-[10px] text-cyan-300 font-normal">#{item.vgaIndex}</span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 flex items-center gap-2">
                        <span>DAC: {item.color.r},{item.color.g},{item.color.b}</span>
                        <span>·</span>
                        <span className="text-neutral-500">{hex}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-[#00AAAA] flex items-center justify-between text-xs">
          <span className="text-neutral-300 text-[11px]">
            [Click to Apply] · [ESC to Close]
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-400 text-black hover:bg-neutral-300 font-bold border border-black"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
