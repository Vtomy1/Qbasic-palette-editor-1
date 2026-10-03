import React from 'react';
import { RGB6, rgb6ToHex, dac6ToRgb8 } from '../types/palette';

interface StatusBarProps {
  activeColor: RGB6;
  activeColorIndex: number;
  screenMode: string;
  onOpenHelp: () => void;
  onOpenExport: () => void;
  onOpenSearch?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  activeColor,
  activeColorIndex,
  screenMode,
  onOpenHelp,
  onOpenExport,
  onOpenSearch,
}) => {
  const safeColor: RGB6 = {
    r: Math.max(0, Math.min(63, activeColor?.r ?? 0)),
    g: Math.max(0, Math.min(63, activeColor?.g ?? 0)),
    b: Math.max(0, Math.min(63, activeColor?.b ?? 0)),
  };
  const hex = rgb6ToHex(safeColor);

  return (
    <footer className="select-none bg-[#AAAAAA] text-black border-t-2 border-black font-mono text-xs px-3 py-1 flex flex-wrap items-center justify-between gap-2 shadow-inner">
      {/* Left keyboard shortcuts */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenHelp}
          className="hover:bg-[#0000AA] hover:text-white px-1.5 py-0.5 rounded transition-colors"
        >
          <span className="text-white bg-[#0000AA] px-1 mr-1 font-bold">F1</span>
          <span>Help</span>
        </button>
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className="hover:bg-[#0000AA] hover:text-white px-1.5 py-0.5 rounded transition-colors"
          >
            <span className="text-white bg-[#0000AA] px-1 mr-1 font-bold">F3</span>
            <span>Search</span>
          </button>
        )}
        <button
          onClick={onOpenExport}
          className="hover:bg-[#0000AA] hover:text-white px-1.5 py-0.5 rounded transition-colors"
        >
          <span className="text-white bg-[#0000AA] px-1 mr-1 font-bold">Shift+F5</span>
          <span>Run/Export</span>
        </button>
        <span className="hidden sm:inline text-neutral-600">|</span>
        <span className="hidden sm:inline font-semibold">
          MODE: {screenMode} (18-bit DAC)
        </span>
      </div>

      {/* Right color telemetrics */}
      <div className="flex items-center gap-3 tabular-nums">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3.5 h-3.5 border border-black shadow-sm"
            style={{ backgroundColor: hex }}
          />
          <span className="font-bold text-[#000080]">
            INDEX: #{activeColorIndex} (&amp;H{activeColorIndex.toString(16).toUpperCase().padStart(2, '0')})
          </span>
        </div>

        <span className="text-neutral-500">·</span>

        <span className="font-semibold text-neutral-800">
          DAC: {safeColor.r}, {safeColor.g}, {safeColor.b}
        </span>

        <span className="text-neutral-500">·</span>

        <span className="text-neutral-700">
          HEX: {hex}
        </span>

        <div className="hidden md:flex items-center gap-1.5 ml-2 border-l border-neutral-400 pl-2">
          <span className="bg-neutral-800 text-green-400 font-bold px-1 text-[10px]">NUM</span>
          <span className="bg-neutral-800 text-green-400 font-bold px-1 text-[10px]">CAPS</span>
        </div>
      </div>
    </footer>
  );
};
