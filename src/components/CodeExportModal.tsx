import React, { useState } from 'react';
import { RGB6 } from '../types/palette';
import { 
  generateQBasicCode, 
  generateJascPal, 
  generateAdobeAct, 
  generateGimpPal, 
  generateHexList,
  downloadTextFile, 
  downloadBinaryFile,
  QBasicExportStyle
} from '../utils/exporters';
import { sound } from '../utils/audio';
import { Copy, Download, Check, X, FileCode } from 'lucide-react';

interface CodeExportModalProps {
  palette: RGB6[];
  onClose: () => void;
  selectionRange?: [number, number] | null;
}

type ExportTab = 'QBASIC_PORT' | 'QBASIC_PALETTE' | 'QBASIC_DEMO' | 'JASC_PAL' | 'GIMP_GPL' | 'HEX_LIST';

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  palette,
  onClose,
  selectionRange,
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('QBASIC_PORT');
  const [copied, setCopied] = useState(false);
  const [exportRangeOnly, setExportRangeOnly] = useState(false);

  const startIdx = exportRangeOnly && selectionRange ? selectionRange[0] : 0;
  const count = exportRangeOnly && selectionRange ? selectionRange[1] - selectionRange[0] + 1 : palette.length;

  const getExportContent = (): string => {
    switch (activeTab) {
      case 'QBASIC_PORT':
        return generateQBasicCode(palette, 'OUT_PORT', startIdx, count);
      case 'QBASIC_PALETTE':
        return generateQBasicCode(palette, 'PALETTE_STMT', startIdx, count);
      case 'QBASIC_DEMO':
        return generateQBasicCode(palette, 'FULL_PROGRAM', 0, palette.length);
      case 'JASC_PAL':
        return generateJascPal(palette.slice(startIdx, startIdx + count));
      case 'GIMP_GPL':
        return generateGimpPal(palette.slice(startIdx, startIdx + count), 'QBasic Palette');
      case 'HEX_LIST':
        return generateHexList(palette.slice(startIdx, startIdx + count));
    }
  };

  const content = getExportContent();

  const handleCopy = () => {
    sound.chirp();
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownloadCurrent = () => {
    sound.chirp();
    if (activeTab === 'QBASIC_PORT' || activeTab === 'QBASIC_PALETTE' || activeTab === 'QBASIC_DEMO') {
      downloadTextFile('PALETTE.BAS', content, 'text/plain');
    } else if (activeTab === 'JASC_PAL') {
      downloadTextFile('PALETTE.PAL', content, 'text/plain');
    } else if (activeTab === 'GIMP_GPL') {
      downloadTextFile('palette.gpl', content, 'text/plain');
    } else if (activeTab === 'HEX_LIST') {
      downloadTextFile('palette.hex', content, 'text/plain');
    }
  };

  const handleDownloadAct = () => {
    sound.chirp();
    const actBuffer = generateAdobeAct(palette);
    downloadBinaryFile('PALETTE.ACT', actBuffer);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0000AA] border-4 border-white shadow-[8px_8px_0_rgba(0,0,0,0.8)] font-mono text-white p-4 flex flex-col max-h-[90vh]">
        {/* Title bar */}
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#00AAAA] mb-3">
          <div className="flex items-center gap-2">
            <FileCode className="text-yellow-300" size={18} />
            <span className="font-bold text-sm tracking-wide">
              EXPORT QBASIC CODE &amp; PALETTE FILES
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2 py-0.5 bg-neutral-300 text-black font-bold hover:bg-red-500 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>

        {/* Tab buttons */}
        <div className="flex flex-wrap gap-1 bg-[#000080] p-1.5 border border-[#00AAAA] mb-3 text-xs">
          <button
            onClick={() => { sound.click(); setActiveTab('QBASIC_PORT'); }}
            className={`px-2.5 py-1 ${activeTab === 'QBASIC_PORT' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-800 hover:bg-neutral-700'}`}
          >
            QBasic OUT &amp; DATA
          </button>
          <button
            onClick={() => { sound.click(); setActiveTab('QBASIC_DEMO'); }}
            className={`px-2.5 py-1 ${activeTab === 'QBASIC_DEMO' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-800 hover:bg-neutral-700'}`}
          >
            Full QBasic Demo (.BAS)
          </button>
          <button
            onClick={() => { sound.click(); setActiveTab('QBASIC_PALETTE'); }}
            className={`px-2.5 py-1 ${activeTab === 'QBASIC_PALETTE' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-800 hover:bg-neutral-700'}`}
          >
            PALETTE Stmt
          </button>
          <button
            onClick={() => { sound.click(); setActiveTab('JASC_PAL'); }}
            className={`px-2.5 py-1 ${activeTab === 'JASC_PAL' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-800 hover:bg-neutral-700'}`}
          >
            JASC-PAL (.PAL)
          </button>
          <button
            onClick={() => { sound.click(); setActiveTab('GIMP_GPL'); }}
            className={`px-2.5 py-1 ${activeTab === 'GIMP_GPL' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-800 hover:bg-neutral-700'}`}
          >
            GIMP (.GPL)
          </button>
          <button
            onClick={() => { sound.click(); setActiveTab('HEX_LIST'); }}
            className={`px-2.5 py-1 ${activeTab === 'HEX_LIST' ? 'bg-[#FFFF55] text-black font-bold' : 'bg-neutral-800 hover:bg-neutral-700'}`}
          >
            HEX List
          </button>
        </div>

        {/* Range filter toggle */}
        {selectionRange && activeTab !== 'QBASIC_DEMO' && (
          <div className="flex items-center gap-2 mb-2 text-xs text-yellow-300">
            <input
              type="checkbox"
              id="exportRange"
              checked={exportRangeOnly}
              onChange={e => setExportRangeOnly(e.target.checked)}
              className="accent-yellow-400"
            />
            <label htmlFor="exportRange" className="cursor-pointer">
              Export selected range only (#{selectionRange[0]}..#{selectionRange[1]}, {selectionRange[1] - selectionRange[0] + 1} colors)
            </label>
          </div>
        )}

        {/* Code View Area */}
        <div className="flex-1 min-h-[220px] bg-black border-2 border-white p-3 overflow-auto font-mono text-xs text-green-400 select-text leading-relaxed">
          <pre className="whitespace-pre">{content}</pre>
        </div>

        {/* Footer Actions */}
        <div className="mt-3 pt-2 border-t border-[#00AAAA] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 bg-[#00AAAA] hover:bg-cyan-300 text-black font-bold flex items-center gap-1.5 border border-black"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}</span>
            </button>
            <button
              onClick={handleDownloadCurrent}
              className="px-4 py-1.5 bg-[#55FF55] hover:bg-green-400 text-black font-bold flex items-center gap-1.5 border border-black"
            >
              <Download size={14} />
              <span>DOWNLOAD FILE</span>
            </button>
            <button
              onClick={handleDownloadAct}
              className="px-3 py-1.5 bg-neutral-300 hover:bg-white text-black font-semibold border border-black"
              title="Download 768-byte Adobe Photoshop / Retro ACT palette"
            >
              Download .ACT (Binary)
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-400 text-black hover:bg-neutral-300 font-bold border border-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
