import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCode, 
  Download, 
  Upload, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Tv, 
  HelpCircle, 
  Sparkles,
  Palette,
  Eye,
  Settings,
  Layers,
  Search
} from 'lucide-react';
import { ScreenMode, PALETTE_PRESETS } from '../types/palette';
import { sound } from '../utils/audio';

interface TopMenuBarProps {
  screenMode: ScreenMode;
  onSelectMode: (mode: ScreenMode) => void;
  onSelectPreset: (presetId: string) => void;
  onOpenExport: () => void;
  onOpenImport: () => void;
  onResetDefault: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  crtEnabled: boolean;
  onToggleCrt: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onOpenHelp: () => void;
  onOpenRamp: () => void;
  onOpenCycle: () => void;
  onOpenSearch: () => void;
  onBatchGrayscale: () => void;
  onBatchInvert: () => void;
  onBatchAdjustBrightness: (delta: number) => void;
  activeColorIndex: number;
}

export const TopMenuBar: React.FC<TopMenuBarProps> = ({
  screenMode,
  onSelectMode,
  onSelectPreset,
  onOpenExport,
  onOpenImport,
  onResetDefault,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  crtEnabled,
  onToggleCrt,
  audioEnabled,
  onToggleAudio,
  onOpenHelp,
  onOpenRamp,
  onOpenCycle,
  onOpenSearch,
  onBatchGrayscale,
  onBatchInvert,
  onBatchAdjustBrightness,
  activeColorIndex,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuBarRef.current && !menuBarRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMenu = (name: string) => {
    sound.click();
    setActiveMenu(prev => (prev === name ? null : name));
  };

  const handleMouseEnter = (name: string) => {
    if (activeMenu !== null) {
      setActiveMenu(name);
    }
  };

  const closeAnd = (fn: () => void) => {
    sound.click();
    setActiveMenu(null);
    fn();
  };

  return (
    <header className="relative z-50 select-none bg-[#AAAAAA] text-black border-b-2 border-black font-mono text-sm leading-tight shadow-md">
      {/* Top Menu Bar Row */}
      <div ref={menuBarRef} className="flex items-center justify-between px-2 py-0.5">
        {/* Menu Items */}
        <div className="flex items-center space-x-1">
          {/* Logo / QBasic Wordmark */}
          <div className="flex items-center mr-3 px-1.5 py-0.5 bg-[#0000AA] text-white font-bold tracking-wider text-xs">
            <span className="text-[#FFFF55]">Q</span>BASIC PALETTE
          </div>

          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('file')}
              onMouseEnter={() => handleMouseEnter('file')}
              className={`px-2 py-0.5 focus:outline-none transition-colors ${
                activeMenu === 'file' ? 'bg-[#0000AA] text-white' : 'hover:bg-[#000080] hover:text-white'
              }`}
            >
              <span className="underline font-semibold">F</span>ile
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 top-full mt-0 w-64 bg-[#AAAAAA] border-2 border-t-white border-l-white border-r-black border-b-black shadow-[4px_4px_0px_rgba(0,0,0,0.7)] py-1 z-50 text-black">
                <button
                  onClick={() => closeAnd(onResetDefault)}
                  className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex items-center justify-between"
                >
                  <span>Reset to VGA Default</span>
                  <span className="text-xs text-neutral-600">Alt+N</span>
                </button>
                <button
                  onClick={() => closeAnd(onOpenImport)}
                  className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5"><Upload size={14} /> Open/Import...</span>
                  <span className="text-xs text-neutral-600">Ctrl+O</span>
                </button>
                <div className="my-1 border-t border-neutral-400" />
                <button
                  onClick={() => closeAnd(onOpenExport)}
                  className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex items-center justify-between font-bold"
                >
                  <span className="flex items-center gap-1.5"><Download size={14} /> Export Code & Files...</span>
                  <span className="text-xs text-neutral-600">Ctrl+S</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('edit')}
              onMouseEnter={() => handleMouseEnter('edit')}
              className={`px-2 py-0.5 focus:outline-none transition-colors ${
                activeMenu === 'edit' ? 'bg-[#0000AA] text-white' : 'hover:bg-[#000080] hover:text-white'
              }`}
            >
              <span className="underline font-semibold">E</span>dit
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute left-0 top-full mt-0 w-60 bg-[#AAAAAA] border-2 border-t-white border-l-white border-r-black border-b-black shadow-[4px_4px_0px_rgba(0,0,0,0.7)] py-1 z-50 text-black">
                <button
                  onClick={() => closeAnd(onUndo)}
                  disabled={!canUndo}
                  className={`w-full text-left px-4 py-1 flex items-center justify-between ${
                    canUndo ? 'hover:bg-[#0000AA] hover:text-white' : 'text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <span>Undo</span>
                  <span className="text-xs">Ctrl+Z</span>
                </button>
                <button
                  onClick={() => closeAnd(onRedo)}
                  disabled={!canRedo}
                  className={`w-full text-left px-4 py-1 flex items-center justify-between ${
                    canRedo ? 'hover:bg-[#0000AA] hover:text-white' : 'text-neutral-500 cursor-not-allowed'
                  }`}
                >
                  <span>Redo</span>
                  <span className="text-xs">Ctrl+Y</span>
                </button>
                <div className="my-1 border-t border-neutral-400" />
                <button
                  onClick={() => closeAnd(onBatchInvert)}
                  className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex items-center justify-between"
                >
                  <span>Invert DAC Color(s)</span>
                  <span className="text-xs">Ctrl+I</span>
                </button>
                <button
                  onClick={() => closeAnd(onBatchGrayscale)}
                  className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white"
                >
                  Convert to Grayscale
                </button>
                <button
                  onClick={() => closeAnd(() => onBatchAdjustBrightness(4))}
                  className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex items-center justify-between"
                >
                  <span>Brighten (+4 DAC)</span>
                  <span className="text-xs">]</span>
                </button>
                <button
                  onClick={() => closeAnd(() => onBatchAdjustBrightness(-4))}
                  className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex items-center justify-between"
                >
                  <span>Darken (-4 DAC)</span>
                  <span className="text-xs">[</span>
                </button>
              </div>
            )}
          </div>

          {/* Presets Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('presets')}
              onMouseEnter={() => handleMouseEnter('presets')}
              className={`px-2 py-0.5 focus:outline-none transition-colors ${
                activeMenu === 'presets' ? 'bg-[#0000AA] text-white' : 'hover:bg-[#000080] hover:text-white'
              }`}
            >
              <span className="underline font-semibold">P</span>resets
            </button>
            {activeMenu === 'presets' && (
              <div className="absolute left-0 top-full mt-0 w-72 bg-[#AAAAAA] border-2 border-t-white border-l-white border-r-black border-b-black shadow-[4px_4px_0px_rgba(0,0,0,0.7)] py-1 z-50 text-black">
                <div className="px-3 py-1 text-xs font-bold text-neutral-700 bg-neutral-300">
                  STANDARD HARDWARE
                </div>
                {PALETTE_PRESETS.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => closeAnd(() => onSelectPreset(p.id))}
                    className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex flex-col"
                  >
                    <span className="font-semibold text-xs">{p.name}</span>
                    <span className="text-[11px] opacity-75">{p.mode} · {p.colors.length} colors</span>
                  </button>
                ))}
                <div className="px-3 py-1 text-xs font-bold text-neutral-700 bg-neutral-300 mt-1">
                  RETRO SYSTEMS & GAMES
                </div>
                {PALETTE_PRESETS.slice(4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => closeAnd(() => onSelectPreset(p.id))}
                    className="w-full text-left px-4 py-1 hover:bg-[#0000AA] hover:text-white flex flex-col"
                  >
                    <span className="font-semibold text-xs">{p.name}</span>
                    <span className="text-[11px] opacity-75">{p.mode} · {p.colors.length} colors</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tools Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('tools')}
              onMouseEnter={() => handleMouseEnter('tools')}
              className={`px-2 py-0.5 focus:outline-none transition-colors ${
                activeMenu === 'tools' ? 'bg-[#0000AA] text-white' : 'hover:bg-[#000080] hover:text-white'
              }`}
            >
              <span className="underline font-semibold">T</span>ools
            </button>
            {activeMenu === 'tools' && (
              <div className="absolute left-0 top-full mt-0 w-64 bg-[#AAAAAA] border-2 border-t-white border-l-white border-r-black border-b-black shadow-[4px_4px_0px_rgba(0,0,0,0.7)] py-1 z-50 text-black">
                <button
                  onClick={() => closeAnd(onOpenRamp)}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#0000AA] hover:text-white flex items-center gap-2"
                >
                  <Sparkles size={14} className="text-yellow-600" />
                  <span>Gradient & Ramp Generator</span>
                </button>
                <button
                  onClick={() => closeAnd(onOpenCycle)}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#0000AA] hover:text-white flex items-center gap-2"
                >
                  <RotateCcw size={14} className="text-emerald-700" />
                  <span>Palette Cycling / Rotation</span>
                </button>
              </div>
            )}
          </div>

          {/* Search Menu */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('search')}
              onMouseEnter={() => handleMouseEnter('search')}
              className={`px-2 py-0.5 focus:outline-none transition-colors ${
                activeMenu === 'search' ? 'bg-[#0000AA] text-white' : 'hover:bg-[#000080] hover:text-white'
              }`}
            >
              <span className="underline font-semibold">S</span>earch
            </button>
            {activeMenu === 'search' && (
              <div className="absolute left-0 top-full mt-0 w-64 bg-[#AAAAAA] border-2 border-t-white border-l-white border-r-black border-b-black shadow-[4px_4px_0px_rgba(0,0,0,0.7)] py-1 z-50 text-black">
                <button
                  onClick={() => closeAnd(onOpenSearch)}
                  className="w-full text-left px-4 py-1.5 hover:bg-[#0000AA] hover:text-white flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5"><Search size={14} /> Find Named VGA Color...</span>
                  <span className="text-xs text-neutral-600">F3 / Ctrl+F</span>
                </button>
              </div>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="relative">
            <button
              onClick={() => toggleMenu('mode')}
              onMouseEnter={() => handleMouseEnter('mode')}
              className={`px-2 py-0.5 focus:outline-none transition-colors ${
                activeMenu === 'mode' ? 'bg-[#0000AA] text-white' : 'hover:bg-[#000080] hover:text-white'
              }`}
            >
              <span className="underline font-semibold">M</span>ode: <span className="text-[#0000AA] font-bold">{screenMode}</span>
            </button>
            {activeMenu === 'mode' && (
              <div className="absolute left-0 top-full mt-0 w-60 bg-[#AAAAAA] border-2 border-t-white border-l-white border-r-black border-b-black shadow-[4px_4px_0px_rgba(0,0,0,0.7)] py-1 z-50 text-black">
                <button
                  onClick={() => closeAnd(() => onSelectMode('SCREEN 13'))}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#0000AA] hover:text-white flex items-center justify-between ${
                    screenMode === 'SCREEN 13' ? 'font-bold bg-neutral-300' : ''
                  }`}
                >
                  <span>SCREEN 13 (320x200, 256c)</span>
                  {screenMode === 'SCREEN 13' && <span>✓</span>}
                </button>
                <button
                  onClick={() => closeAnd(() => onSelectMode('SCREEN 12'))}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#0000AA] hover:text-white flex items-center justify-between ${
                    screenMode === 'SCREEN 12' ? 'font-bold bg-neutral-300' : ''
                  }`}
                >
                  <span>SCREEN 12 (640x480, 16c)</span>
                  {screenMode === 'SCREEN 12' && <span>✓</span>}
                </button>
                <button
                  onClick={() => closeAnd(() => onSelectMode('SCREEN 9'))}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#0000AA] hover:text-white flex items-center justify-between ${
                    screenMode === 'SCREEN 9' ? 'font-bold bg-neutral-300' : ''
                  }`}
                >
                  <span>SCREEN 9 (640x350, 16c)</span>
                  {screenMode === 'SCREEN 9' && <span>✓</span>}
                </button>
                <button
                  onClick={() => closeAnd(() => onSelectMode('SCREEN 1'))}
                  className={`w-full text-left px-4 py-1.5 hover:bg-[#0000AA] hover:text-white flex items-center justify-between ${
                    screenMode === 'SCREEN 1' ? 'font-bold bg-neutral-300' : ''
                  }`}
                >
                  <span>SCREEN 1 (320x200, 4c CGA)</span>
                  {screenMode === 'SCREEN 1' && <span>✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Help */}
          <button
            onClick={onOpenHelp}
            className="px-2 py-0.5 hover:bg-[#000080] hover:text-white focus:outline-none transition-colors"
          >
            <span className="underline font-semibold">H</span>elp
          </button>
        </div>

        {/* Right side controls: CRT toggle, PC Speaker toggle, Quick Export */}
        <div className="flex items-center space-x-2">
          {/* Quick Named Color Search Button */}
          <button
            onClick={() => {
              sound.click();
              onOpenSearch();
            }}
            title="Search named VGA preset colors (F3 / Ctrl+F)"
            className="px-2 py-0.5 text-xs bg-neutral-200 hover:bg-[#FFFF55] hover:text-black text-black border border-neutral-600 font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <Search size={13} />
            <span className="hidden sm:inline">FIND COLOR</span>
          </button>

          {/* CRT Monitor Effect Toggle */}
          <button
            onClick={() => {
              sound.click();
              onToggleCrt();
            }}
            title="Toggle CRT Monitor Scanlines & Phosphor Glow"
            className={`px-2 py-0.5 text-xs flex items-center gap-1 border border-neutral-600 transition-colors ${
              crtEnabled
                ? 'bg-[#008000] text-white border-green-800'
                : 'bg-neutral-300 hover:bg-neutral-400 text-neutral-800'
            }`}
          >
            <Tv size={13} />
            <span>CRT: {crtEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* PC Speaker Sound Toggle */}
          <button
            onClick={() => {
              sound.click();
              onToggleAudio();
            }}
            title="Toggle PC Speaker 8-bit sound effects"
            className={`px-2 py-0.5 text-xs flex items-center gap-1 border border-neutral-600 transition-colors ${
              audioEnabled
                ? 'bg-[#0000AA] text-white border-blue-900'
                : 'bg-neutral-300 hover:bg-neutral-400 text-neutral-700'
            }`}
          >
            {audioEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>SND</span>
          </button>

          {/* Export Code CTA */}
          <button
            onClick={() => {
              sound.chirp();
              onOpenExport();
            }}
            className="px-2.5 py-0.5 text-xs bg-[#006600] text-white hover:bg-[#008800] border border-green-950 font-bold flex items-center gap-1 shadow-sm"
          >
            <FileCode size={13} />
            <span>GEN CODE</span>
          </button>
        </div>
      </div>
    </header>
  );
};
