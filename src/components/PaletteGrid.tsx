import React, { useState } from 'react';
import { RGB6, rgb6ToHex, dac6ToRgb8 } from '../types/palette';
import { sound } from '../utils/audio';

interface PaletteGridProps {
  palette: RGB6[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  selectionRange: [number, number] | null;
  onSetSelectionRange: (range: [number, number] | null) => void;
  onSwapColors: (idx1: number, idx2: number) => void;
  onCopyColor: (sourceIdx: number, targetIdx: number) => void;
}

export const PaletteGrid: React.FC<PaletteGridProps> = ({
  palette,
  activeIndex,
  onSelectIndex,
  selectionRange,
  onSetSelectionRange,
  onSwapColors,
  onCopyColor,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const is256 = palette.length === 256;
  const is16 = palette.length === 16;
  const is4 = palette.length === 4;

  const handleCellClick = (index: number, e: React.MouseEvent) => {
    sound.select();
    if (e.shiftKey) {
      // Range selection
      const start = activeIndex;
      const end = index;
      onSetSelectionRange([Math.min(start, end), Math.max(start, end)]);
    } else {
      onSelectIndex(index);
      onSetSelectionRange(null);
    }
  };

  const isInRange = (index: number): boolean => {
    if (!selectionRange) return false;
    return index >= selectionRange[0] && index <= selectionRange[1];
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDrop = (targetIndex: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== targetIndex) {
      if (e.altKey) {
        // Alt-drag copies
        onCopyColor(draggedIndex, targetIndex);
      } else {
        // Regular drag swaps
        onSwapColors(draggedIndex, targetIndex);
      }
      sound.chirp();
    }
    setDraggedIndex(null);
  };

  const safeActiveIndex = Math.max(0, Math.min(Math.max(0, palette.length - 1), activeIndex));
  const safeHoveredColor: RGB6 = 
    (hoveredIndex !== null && palette[hoveredIndex])
      ? palette[hoveredIndex]
      : (palette[safeActiveIndex] || palette[0] || { r: 0, g: 0, b: 0 });
  const displayIndex = (hoveredIndex !== null && hoveredIndex >= 0 && hoveredIndex < palette.length)
    ? hoveredIndex 
    : safeActiveIndex;

  return (
    <div className="bg-[#0000AA] border-2 border-white shadow-[4px_4px_0_rgba(0,0,0,0.6)] p-3 flex flex-col font-mono text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#00AAAA] mb-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="bg-[#00AAAA] text-[#0000AA] px-1.5 py-0.5 font-bold">
            PALETTE MATRIX
          </span>
          <span className="text-[#AAAAAA]">
            {palette.length} Colors (18-bit VGA DAC)
          </span>
        </div>
        <div className="text-[11px] text-[#FFFF55]">
          [Shift+Click] Range · [Drag] Swap · [Alt+Drag] Copy
        </div>
      </div>

      {/* Grid container */}
      <div className="overflow-x-auto flex justify-center py-1">
        {is256 ? (
          <div className="inline-block bg-black p-1 border-2 border-[#555555]">
            {/* 16x16 Grid */}
            <div className="grid grid-cols-16 gap-[1px] bg-[#222222]">
              {palette.map((color, idx) => {
                const hex = rgb6ToHex(color);
                const isActive = idx === activeIndex;
                const inRange = isInRange(idx);
                const isHovered = idx === hoveredIndex;

                return (
                  <button
                    key={idx}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(idx, e)}
                    onClick={e => handleCellClick(idx, e)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`relative w-5 h-5 sm:w-6 sm:h-6 focus:outline-none transition-transform group cursor-pointer ${
                      isActive
                        ? 'ring-2 ring-white z-20 scale-110 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                        : inRange
                        ? 'ring-1 ring-[#FFFF55] z-10'
                        : isHovered
                        ? 'ring-1 ring-cyan-300 z-10'
                        : ''
                    }`}
                    style={{ backgroundColor: hex }}
                    title={`Index: ${idx} (&H${idx.toString(16).toUpperCase().padStart(2, '0')})\nDAC: R:${color?.r ?? 0} G:${color?.g ?? 0} B:${color?.b ?? 0}\nHex: ${hex}`}
                  >
                    {/* Small index badge for active color */}
                    {isActive && (
                      <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_2px_black]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ) : is16 ? (
          /* 16-color layout */
          <div className="bg-black p-2 border-2 border-[#555555] inline-block">
            <div className="grid grid-cols-8 gap-2 bg-[#222222] p-1">
              {palette.map((color, idx) => {
                const hex = rgb6ToHex(color);
                const isActive = idx === activeIndex;
                const inRange = isInRange(idx);
                return (
                  <button
                    key={idx}
                    onClick={e => handleCellClick(idx, e)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`w-10 h-10 relative flex flex-col justify-between p-1 text-[10px] font-bold border-2 transition-transform cursor-pointer ${
                      isActive
                        ? 'border-white scale-105 shadow-[0_0_8px_white]'
                        : inRange
                        ? 'border-yellow-400'
                        : 'border-[#444444] hover:border-cyan-300'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    <span className="bg-black/70 text-white px-0.5 self-start text-[9px]">
                      {idx}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* 4-color CGA layout */
          <div className="bg-black p-3 border-2 border-[#555555] inline-block">
            <div className="grid grid-cols-4 gap-3 bg-[#222222] p-2">
              {palette.map((color, idx) => {
                const hex = rgb6ToHex(color);
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={idx}
                    onClick={e => handleCellClick(idx, e)}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`w-20 h-20 relative flex flex-col justify-between p-1.5 border-4 transition-transform cursor-pointer ${
                      isActive ? 'border-white scale-105 shadow-[0_0_10px_white]' : 'border-neutral-600 hover:border-cyan-300'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    <span className="bg-black/70 text-white px-1 text-xs font-bold self-start">
                      #{idx}
                    </span>
                    <span className="bg-black/70 text-cyan-300 px-1 text-[10px] self-end font-mono">
                      {hex}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Inspector Bar beneath grid */}
      <div className="mt-2 pt-2 border-t border-[#00AAAA] flex flex-wrap items-center justify-between text-xs bg-[#000080] px-2 py-1.5">
        <div className="flex items-center gap-3">
          <div
            className="w-5 h-5 border border-white shadow-sm shrink-0"
            style={{ backgroundColor: rgb6ToHex(safeHoveredColor) }}
          />
          <div className="flex items-center gap-2 tabular-nums">
            <span className="font-bold text-[#FFFF55]">
              INDEX: #{displayIndex} (&H{displayIndex.toString(16).toUpperCase().padStart(2, '0')})
            </span>
            <span className="text-[#00AAAA]">|</span>
            <span>HEX: {rgb6ToHex(safeHoveredColor)}</span>
            <span className="text-[#00AAAA]">|</span>
            <span className="text-white">
              DAC(6-bit): R:{safeHoveredColor.r} G:{safeHoveredColor.g} B:{safeHoveredColor.b}
            </span>
            <span className="text-[#AAAAAA] text-[11px]">
              (24-bit: {dac6ToRgb8(safeHoveredColor.r)}, {dac6ToRgb8(safeHoveredColor.g)}, {dac6ToRgb8(safeHoveredColor.b)})
            </span>
          </div>
        </div>

        {selectionRange && (
          <div className="bg-[#FFFF55] text-black px-1.5 py-0.5 font-bold text-[11px]">
            RANGE: #{selectionRange[0]}..#{selectionRange[1]} ({selectionRange[1] - selectionRange[0] + 1} colors)
          </div>
        )}
      </div>
    </div>
  );
};
