import React, { useState } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import QuotationPDF, { type QuotationPDFProps } from './QuotationPDF';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: QuotationPDFProps;
  fileName?: string;
}

export default function PDFPreviewModal({
  isOpen,
  onClose,
  data,
  fileName = '報價單',
}: PDFPreviewModalProps) {
  const [scale, setScale] = useState(100);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 25, 50));
  };

  const pdfFileName = `${fileName}_${data.tripName}_${new Date().toISOString().split('T')[0]}.pdf`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-primary-900/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-[90vw] h-[90vh] max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">PDF 預覽</h3>
                <p className="text-sm text-gray-500">{data.tripName}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
                  <button
                    onClick={handleZoomOut}
                    disabled={scale <= 50}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="px-2 text-sm font-medium text-gray-700 min-w-[50px] text-center">
                    {scale}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    disabled={scale >= 200}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Download Button */}
                <PDFDownloadLink
                  document={<QuotationPDF {...data} />}
                  fileName={pdfFileName}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-900 text-white rounded-lg font-semibold text-sm hover:bg-primary-800 transition-colors focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                >
                  {({ loading }) =>
                    loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        準備中...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        下載 PDF
                      </>
                    )
                  }
                </PDFDownloadLink>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-primary-300 active:bg-primary-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 bg-gray-200 overflow-auto focus:ring-2 focus:ring-primary-300">
              <div
                style={{
                  transform: `scale(${scale / 100})`,
                  transformOrigin: 'top center',
                  transition: 'transform 0.2s ease',
                }}
                className="min-h-full"
              >
                <PDFViewer
                  width="100%"
                  height="100%"
                  style={{
                    border: 'none',
                    minHeight: '80vh',
                  }}
                  showToolbar={false}
                >
                  <QuotationPDF {...data} />
                </PDFViewer>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}