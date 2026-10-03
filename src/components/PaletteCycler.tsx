import React, { useState, useEffect, useRef } from 'react';
import { RGB6 } from '../types/palette';
import { sound } from '../utils/audio';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, X } from 'lucide-react';

interface PaletteCyclerProps {
  palette: RGB6[];
  onCycleStep: (startIndex: number, endIndex: number, direction: 'FORWARD' | 'BACKWARD') => void;
  onClose: () => void;
  initialRange?: [number, number] | null;
}

export const PaletteCycler: React.FC<PaletteCyclerProps> = ({
  palette,
  onCycleStep,
  onClose,
  initialRange,
}) => {
  const maxIdx = Math.max(0, palette.length - 1);
  const [startIndex, setStartIndex] = useState<number>(
    initialRange ? Math.min(initialRange[0], maxIdx) : Math.min(16, maxIdx)
  );
  const [endIndex, setEndIndex] = useState<number>(
    initialRange ? Math.min(initialRange[1], maxIdx) : Math.min(63, maxIdx)
  );
  const [direction, setDirection] = useState<'FORWARD' | 'BACKWARD'>('FORWARD');
  const [fps, setFps] = useState<number>(15);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const max = Math.max(0, palette.length - 1);
    setStartIndex(prev => Math.min(prev, max));
    setEndIndex(prev => Math.min(prev, max));
  }, [palette.length]);

  useEffect(() => {
    if (isPlaying) {
      const interval = 1000 / fps;
      timerRef.current = window.setInterval(() => {
        const max = Math.max(0, palette.length - 1);
        const s = Math.max(0, Math.min(startIndex, max));
        const e = Math.max(0, Math.min(endIndex, max));
        onCycleStep(s, e, direction);
      }, interval);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, fps, startIndex, endIndex, direction, onCycleStep, palette.length]);

  const togglePlay = () => {
    sound.click();
    setIsPlaying(prev => !prev);
  };

  const handleStepForward = () => {
    sound.click();
    const max = Math.max(0, palette.length - 1);
    onCycleStep(Math.min(startIndex, max), Math.min(endIndex, max), 'FORWARD');
  };

  const handleStepBackward = () => {
    sound.click();
    const max = Math.max(0, palette.length - 1);
    onCycleStep(Math.min(startIndex, max), Math.min(endIndex, max), 'BACKWARD');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0000AA] border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,0.8)] font-mono text-white p-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#00AAAA] mb-3">
          <div className="flex items-center gap-2">
            <RotateCcw className="text-yellow-300" size={18} />
            <span className="font-bold text-sm tracking-wide">
              PALETTE CYCLING &amp; ANIMATION
            </span>
          </div>
          <button
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="px-2 py-0.5 bg-neutral-300 text-black font-bold hover:bg-red-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        <p className="text-xs text-neutral-200 mb-3 leading-relaxed">
          Palette cycling is the classic VGA trick used for retro waterfalls, burning fire, and animated laser bars by rotating colors within a range.
        </p>

        {/* Range selectors */}
        <div className="grid grid-cols-2 gap-3 bg-[#000080] p-3 border border-[#00AAAA] mb-3 text-xs">
          <div>
            <label className="block text-yellow-300 font-bold mb-1">
              START INDEX:
            </label>
            <input
              type="number"
              min={0}
              max={palette.length - 1}
              value={startIndex}
              onChange={e => setStartIndex(Math.max(0, Math.min(palette.length - 1, parseInt(e.target.value, 10) || 0)))}
              className="w-full bg-black border border-neutral-400 px-2 py-1 text-center font-bold text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-yellow-300 font-bold mb-1">
              END INDEX:
            </label>
            <input
              type="number"
              min={0}
              max={palette.length - 1}
              value={endIndex}
              onChange={e => setEndIndex(Math.max(0, Math.min(palette.length - 1, parseInt(e.target.value, 10) || 0)))}
              className="w-full bg-black border border-neutral-400 px-2 py-1 text-center font-bold text-white text-sm"
            />
          </div>
        </div>

        {/* Speed / FPS slider */}
        <div className="bg-[#000080] p-3 border border-[#00AAAA] mb-4 text-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-yellow-300 font-bold">ANIMATION SPEED:</span>
            <span className="tabular-nums font-bold text-white">{fps} FPS</span>
          </div>
          <input
            type="range"
            min={1}
            max={60}
            value={fps}
            onChange={e => setFps(parseInt(e.target.value, 10))}
            className="w-full accent-yellow-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-neutral-400">
            <span>Slow (1 fps)</span>
            <span>Smooth (30 fps)</span>
            <span>Hyper (60 fps)</span>
          </div>
        </div>

        {/* Direction buttons */}
        <div className="flex items-center justify-between text-xs mb-4 bg-[#000080] p-2 border border-[#00AAAA]">
          <span className="text-yellow-300 font-bold">CYCLE DIRECTION:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setDirection('FORWARD')}
              className={`px-3 py-1 font-bold ${
                direction === 'FORWARD' ? 'bg-[#FFFF55] text-black' : 'bg-neutral-700 text-white'
              }`}
            >
              Forward (&rarr;)
            </button>
            <button
              onClick={() => setDirection('BACKWARD')}
              className={`px-3 py-1 font-bold ${
                direction === 'BACKWARD' ? 'bg-[#FFFF55] text-black' : 'bg-neutral-700 text-white'
              }`}
            >
              Backward (&larr;)
            </button>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-3 bg-black p-3 border-2 border-white mb-4">
          <button
            onClick={handleStepBackward}
            disabled={isPlaying}
            className="p-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white border border-neutral-500"
            title="Step One Color Backward"
          >
            <SkipBack size={16} />
          </button>
          <button
            onClick={togglePlay}
            className={`px-6 py-2 font-bold flex items-center gap-2 border-2 border-black ${
              isPlaying
                ? 'bg-[#FF5555] text-white hover:bg-red-600'
                : 'bg-[#55FF55] text-black hover:bg-green-400'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause size={16} /> PAUSE CYCLING
              </>
            ) : (
              <>
                <Play size={16} /> START CYCLING
              </>
            )}
          </button>
          <button
            onClick={handleStepForward}
            disabled={isPlaying}
            className="p-2 bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white border border-neutral-500"
            title="Step One Color Forward"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Close */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="px-4 py-1.5 bg-neutral-300 hover:bg-white text-black font-bold text-xs border border-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
