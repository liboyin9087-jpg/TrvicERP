import React, { useState, useRef, useMemo } from 'react';
import { PDFViewer, PDFDownloadLink } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

// Generic interface for the modal props
// T will be the type of data required by the PDF document component
interface PDFPreviewModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  /** The data object passed to the PDF document rendering function. */
  documentData: T;
  /** A function that takes documentData and returns the React-PDF document component. */
  renderDocument: (data: T) => React.ReactElement;
  /** Optional: A function to generate the filename for download.
   *  If not provided, a generic filename will be used. */
  getFileName?: (data: T) => string;
  /** Optional: The main title displayed in the modal header. */
  title?: string;
  /** Optional: The subtitle displayed below the title in the modal header. */
  subtitle?: string;
}

// Default filename generator for when getFileName is not provided.
// It tries to infer a name from 'tripName' if present in data, otherwise uses a generic 'document'.
const defaultFileNameGenerator = <T extends {}>(data: T): string => {
  let baseName = 'document';
  // Attempt to use 'tripName' if it exists in the data and is a string
  if (typeof data === 'object' && data !== null && 'tripName' in data && typeof (data as any).tripName === 'string') {
    baseName = (data as any).tripName;
  }
  return `${baseName}_${new Date().toISOString().split('T')[0]}.pdf`;
};

export default function PDFPreviewModal<T extends {} = any>({ // Default T to any for flexibility
  isOpen,
  onClose,
  documentData,
  renderDocument,
  getFileName,
  title = 'PDF 預覽',
  subtitle,
}: PDFPreviewModalProps<T>) {
  const [scale, setScale] = useState(100);
  const parentRef = useRef<HTMLDivElement>(null); // Ref for the parent container (viewport) for drag constraints

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 25, 50));
  };

  // Memoize the PDF document component to prevent unnecessary re-renders
  const pdfDocument = useMemo(() => {
    return renderDocument(documentData);
  }, [renderDocument, documentData]);

  // Generate the final filename, using provided function or default
  const finalFileName = useMemo(() => {
    return (getFileName ? getFileName(documentData) : defaultFileNameGenerator(documentData));
  }, [documentData, getFileName]);

  return (
    <AnimatePresence>
      {isOpen && (
        // Backdrop and Modal Container (viewport)
        <div ref={parentRef} className="fixed inset-0 z-50 flex items-center justify-center"> {/* z-index changed from hardcoded z-[9999] */}
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
            drag // Enable dragging
            dragConstraints={parentRef} // Constrain dragging within the parent (viewport)
            dragElastic={0.1} // Little elastic effect when hitting constraints
            dragMomentum={false} // Disable momentum for snappier feel
          >
            {/* Header - designated as drag handle */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 cursor-grab drag-handle" // Added cursor-grab and drag-handle class
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
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
                  document={pdfDocument} // Use memoized document
                  fileName={finalFileName} // Use dynamically generated filename
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
                  {pdfDocument} {/* Use memoized document */}
                </PDFViewer>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}