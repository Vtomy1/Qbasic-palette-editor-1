import React from 'react';
import { HelpCircle, BookOpen, Keyboard, Cpu, X } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0000AA] border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,0.8)] font-mono text-white p-4 flex flex-col max-h-[90vh]">
        {/* Title bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#00AAAA] mb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-yellow-300" size={18} />
            <span className="font-bold text-sm tracking-wide">
              MS-DOS QBASIC PALETTE ARCHITECTURE &amp; MANUAL
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-neutral-300 text-black font-bold hover:bg-red-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs leading-relaxed select-text">
          {/* Section 1: 18-bit VGA DAC */}
          <div className="bg-[#000080] p-3 border border-[#00AAAA]">
            <h3 className="text-yellow-300 font-bold flex items-center gap-1.5 mb-1 text-sm">
              <Cpu size={16} /> 18-Bit IBM VGA DAC Hardware (0 to 63)
            </h3>
            <p className="text-neutral-200 mb-2">
              Classic IBM PC VGA hardware uses an 18-bit Digital-to-Analog Converter (DAC). 
              Each primary color channel (Red, Green, Blue) has <strong>6 bits of precision</strong>, 
              which means intensity values range strictly from <strong>0 to 63</strong> (not 0 to 255).
            </p>
            <div className="bg-black p-2 text-cyan-300 font-mono text-[11px] border border-neutral-600">
              Total Palette Colors: 2^(6+6+6) = 262,144 hardware colors.<br />
              SCREEN 13 (Mode 13h): 320x200 resolution with 256 simultaneous colors.
            </div>
          </div>

          {/* Section 2: QBasic Code Techniques */}
          <div className="bg-[#000080] p-3 border border-[#00AAAA]">
            <h3 className="text-yellow-300 font-bold flex items-center gap-1.5 mb-1 text-sm">
              <BookOpen size={16} /> QBasic Programming Techniques
            </h3>
            <div className="space-y-2 text-neutral-200">
              <div>
                <strong className="text-white">1. Direct Hardware Port Method (Fastest):</strong>
                <pre className="bg-black text-green-400 p-2 mt-1 border border-neutral-600">
{`OUT &H3C8, index%     ' Tells VGA DAC which color index to edit
OUT &H3C9, red%       ' Red value (0 to 63)
OUT &H3C9, green%     ' Green value (0 to 63)
OUT &H3C9, blue%      ' Blue value (0 to 63)`}
                </pre>
              </div>

              <div>
                <strong className="text-white">2. QBasic PALETTE Statement:</strong>
                <pre className="bg-black text-green-400 p-2 mt-1 border border-neutral-600">
{`' Syntax: PALETTE attribute%, colorNumber&
' colorNumber& = Blue% * 65536 + Green% * 256 + Red%
PALETTE 14, 21 * 65536 + 63 * 256 + 63&`}
                </pre>
              </div>
            </div>
          </div>

          {/* Section 3: Keyboard Shortcuts */}
          <div className="bg-[#000080] p-3 border border-[#00AAAA]">
            <h3 className="text-yellow-300 font-bold flex items-center gap-1.5 mb-1 text-sm">
              <Keyboard size={16} /> Keyboard Shortcuts &amp; Mouse Controls
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div><strong className="text-white">Arrow Keys / WASD:</strong> Navigate color grid</div>
              <div><strong className="text-white">Shift + Click:</strong> Select range of colors</div>
              <div><strong className="text-white">Ctrl + Z / Ctrl + Y:</strong> Undo / Redo edits</div>
              <div><strong className="text-white">Ctrl + S:</strong> Open Code Exporter</div>
              <div><strong className="text-white">Ctrl + O:</strong> Open Import dialog</div>
              <div><strong className="text-white">[ and ]:</strong> Darken / Brighten color</div>
              <div><strong className="text-white">Ctrl + I:</strong> Invert DAC color values</div>
              <div><strong className="text-white">Drag swatch:</strong> Swap two color slots</div>
              <div><strong className="text-white">Alt + Drag:</strong> Copy color into slot</div>
              <div><strong className="text-white">Recent Colors:</strong> Click any of 8 recent shades in editor</div>
              <div><strong className="text-white">2D Visual Picker:</strong> Switch tab to 2D PICKER or click SYSTEM button</div>
              <div><strong className="text-white">ESC:</strong> Close any open modal dialog</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-[#00AAAA] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-[#55FF55] text-black font-bold text-xs hover:bg-green-400 border border-black shadow"
          >
            OK (ENTER)
          </button>
        </div>
      </div>
    </div>
  );
};
