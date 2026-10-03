import React, { useState } from 'react';
import { RGB6, rgb6ToHex, rgb8ToDac6 } from '../types/palette';
import { parsePaletteInput } from '../utils/exporters';
import { sound } from '../utils/audio';
import { Upload, AlertTriangle, Check, X, FileText } from 'lucide-react';

interface ImportModalProps {
  onImportPalette: (colors: RGB6[], insertAtIndex?: number) => void;
  onClose: () => void;
  activeColorIndex: number;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  onImportPalette,
  onClose,
  activeColorIndex,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [parsedColors, setParsedColors] = useState<RGB6[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [importTarget, setImportTarget] = useState<'FULL' | 'AT_INDEX'>('FULL');
  const [targetIndex, setTargetIndex] = useState<number>(activeColorIndex);

  const handleParse = (text: string) => {
    setErrorMsg(null);
    const result = parsePaletteInput(text);
    if (result && result.length > 0) {
      setParsedColors(result);
      sound.chirp();
    } else {
      setParsedColors(null);
      setErrorMsg('Could not parse any valid colors. Supported: QBasic DATA statements, JASC-PAL, GPL, Hex list, JSON.');
      sound.buzz();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if Adobe ACT binary (768 bytes)
    if (file.name.toLowerCase().endsWith('.act') || file.size === 768) {
      const reader = new FileReader();
      reader.onload = evt => {
        const buffer = evt.target?.result as ArrayBuffer;
        if (buffer && buffer.byteLength >= 768) {
          const u8 = new Uint8Array(buffer);
          const colors: RGB6[] = [];
          for (let i = 0; i < 256; i++) {
            colors.push({
              r: rgb8ToDac6(u8[i * 3 + 0]),
              g: rgb8ToDac6(u8[i * 3 + 1]),
              b: rgb8ToDac6(u8[i * 3 + 2]),
            });
          }
          setParsedColors(colors);
          sound.chirp();
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Text file reading
    const reader = new FileReader();
    reader.onload = evt => {
      const text = evt.target?.result as string;
      setPasteText(text);
      handleParse(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!parsedColors || parsedColors.length === 0) return;
    sound.chirp();
    if (importTarget === 'AT_INDEX') {
      onImportPalette(parsedColors, targetIndex);
    } else {
      onImportPalette(parsedColors);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0000AA] border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,0.8)] font-mono text-white p-4 flex flex-col max-h-[90vh]">
        {/* Title bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#00AAAA] mb-3">
          <div className="flex items-center gap-2">
            <Upload className="text-yellow-300" size={18} />
            <span className="font-bold text-sm tracking-wide">
              IMPORT PALETTE DATA OR FILES
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-neutral-300 text-black font-bold hover:bg-red-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Upload file button */}
        <div className="bg-[#000080] p-3 border border-[#00AAAA] mb-3 text-xs flex items-center justify-between">
          <div>
            <div className="font-bold text-yellow-300 mb-0.5">OPEN FILE:</div>
            <div className="text-[11px] text-neutral-300">
              Supports .BAS, .PAL (JASC), .ACT (Adobe), .GPL (GIMP), .HEX, .JSON
            </div>
          </div>
          <label className="px-3 py-1.5 bg-[#00AAAA] hover:bg-cyan-300 text-black font-bold cursor-pointer border border-black flex items-center gap-1.5 shadow">
            <FileText size={14} />
            <span>Select File...</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Or Paste text area */}
        <div className="mb-3 text-xs flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <span className="text-yellow-300 font-bold">OR PASTE RAW DATA / CODE:</span>
            <button
              onClick={() => handleParse(pasteText)}
              className="px-2 py-0.5 bg-[#FFFF55] text-black font-bold hover:bg-yellow-400"
            >
              Parse Text
            </button>
          </div>
          <textarea
            value={pasteText}
            onChange={e => {
              setPasteText(e.target.value);
              handleParse(e.target.value);
            }}
            placeholder="Paste QBasic DATA statements (e.g. DATA 63,0,0, 0,63,0...), JASC-PAL text, or Hex codes (#FF0000)..."
            rows={5}
            className="w-full bg-black border-2 border-white p-2 text-green-400 font-mono text-xs focus:outline-none"
          />
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="bg-red-950 border border-red-500 text-red-200 p-2 mb-3 text-xs flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Parsed Swatch Preview */}
        {parsedColors && (
          <div className="bg-[#000080] p-2.5 border border-[#00AAAA] mb-3 text-xs">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-green-300 font-bold flex items-center gap-1">
                <Check size={14} /> Found {parsedColors.length} colors:
              </span>
              <div className="flex items-center gap-2 text-[11px]">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    checked={importTarget === 'FULL'}
                    onChange={() => setImportTarget('FULL')}
                  />
                  <span>Replace Entire Palette</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name="target"
                    checked={importTarget === 'AT_INDEX'}
                    onChange={() => setImportTarget('AT_INDEX')}
                  />
                  <span>Insert starting at Index #{targetIndex}</span>
                </label>
              </div>
            </div>

            {/* Swatches preview strip */}
            <div className="flex flex-wrap max-h-20 overflow-y-auto border border-black bg-black p-1 gap-[1px]">
              {parsedColors.slice(0, 256).map((c, i) => (
                <div
                  key={i}
                  className="w-3.5 h-3.5"
                  style={{ backgroundColor: rgb6ToHex(c) }}
                  title={`#${i}: DAC R:${c.r} G:${c.g} B:${c.b}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 text-xs font-bold pt-2 border-t border-[#00AAAA]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-400 text-black hover:bg-neutral-300 border border-black"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={!parsedColors || parsedColors.length === 0}
            className={`px-5 py-1.5 border border-black flex items-center gap-1 ${
              parsedColors && parsedColors.length > 0
                ? 'bg-[#55FF55] text-black hover:bg-green-400'
                : 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
            }`}
          >
            <span>IMPORT INTO PALETTE</span>
          </button>
        </div>
      </div>
    </div>
  );
};
