/**
 * QBasic Palette Editor - Main Application
 * 
 * An authentic MS-DOS VGA palette creator, editor, and code generator for
 * QBasic / QuickBASIC 4.5 / 7.1 and QB64 developers and retro pixel artists.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  RGB6, 
  ScreenMode, 
  PALETTE_PRESETS, 
  generateVgaDefaultPalette, 
  STANDARD_16_VGA,
  dac6ToRgb8,
  rgb8ToDac6,
  rgb6ToHex
} from './types/palette';
import { sound } from './utils/audio';
import { TopMenuBar } from './components/TopMenuBar';
import { PaletteGrid } from './components/PaletteGrid';
import { ColorEditor } from './components/ColorEditor';
import { PreviewCanvas } from './components/PreviewCanvas';
import { StatusBar } from './components/StatusBar';
import { GradientGenerator } from './components/GradientGenerator';
import { PaletteCycler } from './components/PaletteCycler';
import { CodeExportModal } from './components/CodeExportModal';
import { ImportModal } from './components/ImportModal';
import { HelpModal } from './components/HelpModal';
import { ColorSearchModal } from './components/ColorSearchModal';

export default function App() {
  // Screen mode & active palette
  const [screenMode, setScreenMode] = useState<ScreenMode>('SCREEN 13');
  const [palette, setPalette] = useState<RGB6[]>(() => generateVgaDefaultPalette());
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectionRange, setSelectionRange] = useState<[number, number] | null>(null);

  // Clipboard for color copy/paste
  const [copiedColor, setCopiedColor] = useState<RGB6 | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<RGB6[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const isInternalUpdate = useRef(false);

  // Dialog modals
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showRampModal, setShowRampModal] = useState(false);
  const [showCycleModal, setShowCycleModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Visual settings
  const [crtEnabled, setCrtEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  // Keep sound instance synced
  useEffect(() => {
    sound.enabled = audioEnabled;
  }, [audioEnabled]);

  // Push new state to history
  const pushHistory = useCallback((newPalette: RGB6[]) => {
    if (isInternalUpdate.current) return;
    setHistory(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      const nextHistory = [...upToCurrent, newPalette.map(c => ({ ...c }))];
      // Limit to 40 undo steps
      if (nextHistory.length > 40) nextHistory.shift();
      return nextHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 39));
  }, [historyIndex]);

  // Initial history record
  useEffect(() => {
    if (history.length === 0) {
      setHistory([palette.map(c => ({ ...c }))]);
      setHistoryIndex(0);
    }
  }, [history.length, palette]);

  // Handle Palette Changes with history recording
  const updatePalette = useCallback((newPalette: RGB6[]) => {
    pushHistory(newPalette);
    setPalette(newPalette);
  }, [pushHistory]);

  // Update a single color in the palette
  const handleColorChange = useCallback((newColor: RGB6) => {
    const updated = [...palette];
    updated[activeIndex] = newColor;
    updatePalette(updated);
  }, [palette, activeIndex, updatePalette]);

  // Undo action
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      sound.click();
      isInternalUpdate.current = true;
      const targetIndex = historyIndex - 1;
      setHistoryIndex(targetIndex);
      setPalette(history[targetIndex].map(c => ({ ...c })));
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 50);
    }
  }, [historyIndex, history]);

  // Redo action
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      sound.click();
      isInternalUpdate.current = true;
      const targetIndex = historyIndex + 1;
      setHistoryIndex(targetIndex);
      setPalette(history[targetIndex].map(c => ({ ...c })));
      setTimeout(() => {
        isInternalUpdate.current = false;
      }, 50);
    }
  }, [historyIndex, history]);

  // Mode Selection
  const handleSelectMode = (mode: ScreenMode) => {
    sound.chirp();
    setScreenMode(mode);
    setSelectionRange(null);
    if (mode === 'SCREEN 13') {
      const default256 = generateVgaDefaultPalette();
      setActiveIndex(0);
      updatePalette(default256);
    } else if (mode === 'SCREEN 12' || mode === 'SCREEN 9') {
      const ega16 = STANDARD_16_VGA.slice(0, 16);
      setActiveIndex(0);
      updatePalette(ega16);
    } else if (mode === 'SCREEN 1') {
      const cga4 = PALETTE_PRESETS.find(p => p.id === 'cga-palette-1')?.colors || STANDARD_16_VGA.slice(0, 4);
      setActiveIndex(0);
      updatePalette(cga4);
    }
  };

  // Preset Selection
  const handleSelectPreset = (presetId: string) => {
    const preset = PALETTE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      sound.chirp();
      setScreenMode(preset.mode);
      setActiveIndex(0);
      setSelectionRange(null);
      updatePalette(preset.colors.map(c => ({ ...c })));
    }
  };

  // Reset to VGA Default
  const handleResetDefault = () => {
    sound.chirp();
    handleSelectMode('SCREEN 13');
  };

  // Swap two color slots
  const handleSwapColors = (idx1: number, idx2: number) => {
    if (idx1 >= 0 && idx1 < palette.length && idx2 >= 0 && idx2 < palette.length) {
      const updated = [...palette];
      const temp = updated[idx1];
      updated[idx1] = updated[idx2];
      updated[idx2] = temp;
      updatePalette(updated);
    }
  };

  // Copy color from slot to slot
  const handleCopyColorToSlot = (sourceIdx: number, targetIdx: number) => {
    if (sourceIdx >= 0 && sourceIdx < palette.length && targetIdx >= 0 && targetIdx < palette.length) {
      const updated = [...palette];
      updated[targetIdx] = { ...updated[sourceIdx] };
      updatePalette(updated);
    }
  };

  // Copy active color to clipboard buffer
  const handleCopyActiveColor = () => {
    setCopiedColor({ ...palette[activeIndex] });
  };

  // Paste active color from clipboard buffer
  const handlePasteActiveColor = () => {
    if (copiedColor) {
      sound.click();
      handleColorChange({ ...copiedColor });
    }
  };

  // Apply gradient ramp
  const handleApplyRamp = (startIndex: number, endIndex: number, rampColors: RGB6[]) => {
    const updated = [...palette];
    for (let i = 0; i < rampColors.length; i++) {
      const targetIdx = startIndex + i;
      if (targetIdx < updated.length) {
        updated[targetIdx] = { ...rampColors[i] };
      }
    }
    updatePalette(updated);
  };

  // Cycle palette within range
  const handleCycleStep = useCallback((startIndex: number, endIndex: number, direction: 'FORWARD' | 'BACKWARD') => {
    setPalette(prev => {
      if (!prev || prev.length <= 1) return prev;
      const maxIdx = prev.length - 1;
      const s = Math.max(0, Math.min(maxIdx, Math.min(startIndex, endIndex)));
      const e = Math.max(0, Math.min(maxIdx, Math.max(startIndex, endIndex)));
      const count = e - s + 1;
      if (count <= 1) return prev;

      const updated = [...prev];
      if (direction === 'FORWARD') {
        const last = updated[e];
        if (!last) return prev;
        for (let i = e; i > s; i--) {
          updated[i] = updated[i - 1];
        }
        updated[s] = last;
      } else {
        const first = updated[s];
        if (!first) return prev;
        for (let i = s; i < e; i++) {
          updated[i] = updated[i + 1];
        }
        updated[e] = first;
      }
      return updated;
    });
  }, []);

  // Batch Invert Selected
  const handleBatchInvert = () => {
    sound.chirp();
    const s = selectionRange ? selectionRange[0] : activeIndex;
    const e = selectionRange ? selectionRange[1] : activeIndex;
    const updated = [...palette];
    for (let i = s; i <= e; i++) {
      if (updated[i]) {
        updated[i] = {
          r: 63 - updated[i].r,
          g: 63 - updated[i].g,
          b: 63 - updated[i].b,
        };
      }
    }
    updatePalette(updated);
  };

  // Batch Grayscale Selected
  const handleBatchGrayscale = () => {
    sound.chirp();
    const s = selectionRange ? selectionRange[0] : activeIndex;
    const e = selectionRange ? selectionRange[1] : activeIndex;
    const updated = [...palette];
    for (let i = s; i <= e; i++) {
      if (updated[i]) {
        const lum = Math.round(0.299 * updated[i].r + 0.587 * updated[i].g + 0.114 * updated[i].b);
        updated[i] = { r: lum, g: lum, b: lum };
      }
    }
    updatePalette(updated);
  };

  // Batch Brightness
  const handleBatchBrightness = (delta: number) => {
    sound.click();
    const s = selectionRange ? selectionRange[0] : activeIndex;
    const e = selectionRange ? selectionRange[1] : activeIndex;
    const updated = [...palette];
    for (let i = s; i <= e; i++) {
      if (updated[i]) {
        updated[i] = {
          r: Math.max(0, Math.min(63, updated[i].r + delta)),
          g: Math.max(0, Math.min(63, updated[i].g + delta)),
          b: Math.max(0, Math.min(63, updated[i].b + delta)),
        };
      }
    }
    updatePalette(updated);
  };

  // Import parsed palette
  const handleImportPalette = (colors: RGB6[], insertAtIndex?: number) => {
    if (insertAtIndex !== undefined) {
      const updated = [...palette];
      for (let i = 0; i < colors.length && insertAtIndex + i < updated.length; i++) {
        updated[insertAtIndex + i] = colors[i];
      }
      updatePalette(updated);
    } else {
      // Full replace
      if (colors.length <= 4) {
        setScreenMode('SCREEN 1');
      } else if (colors.length <= 16) {
        setScreenMode('SCREEN 12');
      } else {
        setScreenMode('SCREEN 13');
      }
      // Pad to 256 if needed or keep length
      const targetLen = colors.length <= 4 ? 4 : colors.length <= 16 ? 16 : 256;
      const full: RGB6[] = new Array(targetLen).fill(null).map((_, i) => {
        return colors[i] || { r: 0, g: 0, b: 0 };
      });
      setActiveIndex(0);
      updatePalette(full);
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if inside input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'F1') {
        e.preventDefault();
        setShowHelpModal(true);
        return;
      }

      if (e.key === 'F3') {
        e.preventDefault();
        setShowSearchModal(true);
        return;
      }

      if (e.key === 'Escape') {
        setShowExportModal(false);
        setShowImportModal(false);
        setShowHelpModal(false);
        setShowRampModal(false);
        setShowCycleModal(false);
        setShowSearchModal(false);
        return;
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z') {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (e.key.toLowerCase() === 'y') {
          e.preventDefault();
          handleRedo();
          return;
        }
        if (e.key.toLowerCase() === 's') {
          e.preventDefault();
          setShowExportModal(true);
          return;
        }
        if (e.key.toLowerCase() === 'o') {
          e.preventDefault();
          setShowImportModal(true);
          return;
        }
        if (e.key.toLowerCase() === 'f') {
          e.preventDefault();
          setShowSearchModal(true);
          return;
        }
        if (e.key.toLowerCase() === 'i') {
          e.preventDefault();
          handleBatchInvert();
          return;
        }
      }

      if (e.key === '[') {
        handleBatchBrightness(-2);
        return;
      }
      if (e.key === ']') {
        handleBatchBrightness(2);
        return;
      }

      // Arrow navigation
      const cols = palette.length === 256 ? 16 : palette.length === 16 ? 8 : 4;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        sound.select();
        setActiveIndex(prev => (prev + 1) % palette.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        sound.select();
        setActiveIndex(prev => (prev - 1 + palette.length) % palette.length);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        sound.select();
        setActiveIndex(prev => (prev + cols) % palette.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        sound.select();
        setActiveIndex(prev => (prev - cols + palette.length) % palette.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [palette.length, handleUndo, handleRedo]);

  // Ensure activeIndex is within bounds when palette length changes
  useEffect(() => {
    if (palette.length > 0 && activeIndex >= palette.length) {
      setActiveIndex(palette.length - 1);
    }
  }, [palette.length, activeIndex]);

  const safeActiveIndex = Math.max(0, Math.min(Math.max(0, palette.length - 1), activeIndex));
  const activeColor: RGB6 = palette[safeActiveIndex] || palette[0] || { r: 0, g: 0, b: 0 };

  return (
    <div className="min-h-screen bg-[#000080] text-gray-100 flex flex-col font-mono relative selection:bg-[#FFFF55] selection:text-black">
      {/* Optional CRT scanline & glow overlay */}
      {crtEnabled && (
        <div className="fixed inset-0 crt-overlay z-40 pointer-events-none" />
      )}

      {/* Top MS-DOS QBasic Menu Bar */}
      <TopMenuBar
        screenMode={screenMode}
        onSelectMode={handleSelectMode}
        onSelectPreset={handleSelectPreset}
        onOpenExport={() => setShowExportModal(true)}
        onOpenImport={() => setShowImportModal(true)}
        onResetDefault={handleResetDefault}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        crtEnabled={crtEnabled}
        onToggleCrt={() => setCrtEnabled(prev => !prev)}
        audioEnabled={audioEnabled}
        onToggleAudio={() => setAudioEnabled(prev => !prev)}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenRamp={() => setShowRampModal(true)}
        onOpenCycle={() => setShowCycleModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
        onBatchGrayscale={handleBatchGrayscale}
        onBatchInvert={handleBatchInvert}
        onBatchAdjustBrightness={handleBatchBrightness}
        activeColorIndex={safeActiveIndex}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 p-3 md:p-4 max-w-[1520px] w-full mx-auto flex flex-col gap-4">
        {/* Top Split: Palette Matrix (Left) & Live Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Palette Grid (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <PaletteGrid
              palette={palette}
              activeIndex={safeActiveIndex}
              onSelectIndex={setActiveIndex}
              selectionRange={selectionRange}
              onSetSelectionRange={setSelectionRange}
              onSwapColors={handleSwapColors}
              onCopyColor={handleCopyColorToSlot}
            />
          </div>

          {/* Color DAC Editor (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <ColorEditor
              color={activeColor}
              index={safeActiveIndex}
              onChangeColor={handleColorChange}
              onCopyColor={handleCopyActiveColor}
              onPasteColor={handlePasteActiveColor}
              canPaste={copiedColor !== null}
              onOpenSearchModal={() => setShowSearchModal(true)}
            />
          </div>
        </div>

        {/* Bottom Section: Live VGA Graphics Simulator & Ditherer */}
        <div className="w-full">
          <PreviewCanvas
            palette={palette}
            activeColorIndex={safeActiveIndex}
          />
        </div>
      </main>

      {/* Classic MS-DOS Status Bar */}
      <StatusBar
        activeColor={activeColor}
        activeColorIndex={safeActiveIndex}
        screenMode={screenMode}
        onOpenHelp={() => setShowHelpModal(true)}
        onOpenExport={() => setShowExportModal(true)}
        onOpenSearch={() => setShowSearchModal(true)}
      />

      {/* Modal Dialogs */}
      {showExportModal && (
        <CodeExportModal
          palette={palette}
          onClose={() => setShowExportModal(false)}
          selectionRange={selectionRange}
        />
      )}

      {showImportModal && (
        <ImportModal
          onImportPalette={handleImportPalette}
          onClose={() => setShowImportModal(false)}
          activeColorIndex={safeActiveIndex}
        />
      )}

      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}

      {showSearchModal && (
        <ColorSearchModal
          onSelectColor={handleColorChange}
          onClose={() => setShowSearchModal(false)}
          currentColor={activeColor}
          currentIndex={safeActiveIndex}
        />
      )}

      {showRampModal && (
        <GradientGenerator
          palette={palette}
          onApplyRamp={handleApplyRamp}
          onClose={() => setShowRampModal(false)}
          initialStartIndex={selectionRange ? selectionRange[0] : Math.max(0, safeActiveIndex)}
          initialEndIndex={selectionRange ? selectionRange[1] : Math.min(palette.length - 1, safeActiveIndex + 15)}
        />
      )}

      {showCycleModal && (
        <PaletteCycler
          palette={palette}
          onCycleStep={handleCycleStep}
          onClose={() => setShowCycleModal(false)}
          initialRange={selectionRange}
        />
      )}
    </div>
  );
}
