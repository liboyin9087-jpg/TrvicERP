/**
 * @file DocumentGenerator.tsx
 * @description This component allows administrators to generate, preview, export, and send various tour-related documents.
 * It has been refactored for better architecture, state management, and Dashtail UI compliance.
 */
import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Send, FileDown, Users, Bed, Bus, MapPin, Printer, X, Loader2, GripVertical, CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn utility is for conditional classNames

// Importing component-specific types and interfaces from a dedicated file
import type { DocumentType, DocumentGeneratorProps, DocumentDefinition, DocumentGenerationData } from './document-generator.types';
// Importing custom hook for state and logic separation
import { useDocumentGenerator } from './useDocumentGenerator';

/**
 * Renders a document generation tool for tour sessions.
 *
 * This component provides an interface to generate, preview, export (PDF/Excel),
 * and send (Line) various documents related to a tour session, such as itineraries,
 * room lists, seat charts, rosters, and meeting information.
 *
 * It is designed to be a Dashtail-compatible widget, supporting drag-and-drop
 * and configurable options via props, adhering to Kintone independence.
 *
 * All external service interactions (export, Line send, HTML content generation)
 * are injected via props, making the component highly decoupled and testable.
 *
 * @param {DocumentGeneratorProps} props - The properties for the DocumentGenerator component.
 * @param {TourSession} props.session - The tour session data.
 * @param {Booking[]} props.bookings - List of bookings associated with the session.
 * @param {HotelRoomAllocation[]} [props.hotelRooms=[]] - Optional hotel room allocations.
 * @param {RoomAssignment[]} [props.roomAssignments=[]] - Optional room assignments.
 * @param {SeatAssignment[]} [props.seatAssignments=[]] - Optional seat assignments.
 * @param {MeetingInfo} [props.meetingInfo] - Optional meeting information.
 * @param {DocumentGeneratorConfig} [props.config] - Configuration options for the widget, e.g., available document types, title.
 * @param {(type: DocumentType, data: DocumentGenerationData) => void} props.onExportPDF - Injected function to handle PDF export.
 * @param {(type: DocumentType, data: DocumentGenerationData) => void} props.onExportExcel - Injected function to handle Excel export.
 * @param {(type: DocumentType, data: DocumentGenerationData) => Promise<{ success: boolean; message: string; sentCount?: number; errors?: any[] }>} props.onSendLine - Injected function to handle sending document notifications via Line.
 * @param {(type: DocumentType, data: DocumentGenerationData) => string} props.generateDocumentContent - Injected function to generate HTML content for document preview.
 */
export default function DocumentGenerator({
  session,
  bookings,
  hotelRooms = [],
  roomAssignments = [],
  seatAssignments = [],
  meetingInfo,
  config,
  onExportPDF,
  onExportExcel,
  onSendLine,
  generateDocumentContent, // Injected function for HTML generation
}: DocumentGeneratorProps) {

  // Default configuration for the widget, can be overridden by props.config
  const defaultConfig = {
    title: '出團前文件生成',
    description: '產生並發送團體相關文件',
    enableLineSend: true,
    availableDocumentTypes: ['itinerary', 'room_list', 'seat_chart', 'roster', 'meeting_info'] as DocumentType[],
  };
  const mergedConfig = { ...defaultConfig, ...config };

  // Prepare a bundled data object to pass to injected functions and hooks
  const documentGenerationData: DocumentGenerationData = {
    session,
    bookings,
    hotelRooms,
    roomAssignments,
    seatAssignments,
    meetingInfo,
  };

  // Utilize the custom hook to manage component-specific state and logic
  const {
    selectedDoc,
    showPreview,
    sendingLine,
    lineSendResult,
    handlePreview,
    handleClosePreview,
    handleSendLineAction,
  } = useDocumentGenerator(onSendLine, documentGenerationData);

  // Define all possible document types and their UI representations
  const allDocumentDefinitions: DocumentDefinition[] = [
    {
      type: 'itinerary',
      label: '團體行程表',
      icon: <FileText className="w-5 h-5" />,
      description: '包含每日行程、景點、餐食、住宿資訊',
    },
    {
      type: 'room_list',
      label: '分房表',
      icon: <Bed className="w-5 h-5" />,
      description: '房間分配清單，顯示每位旅客的房間號',
    },
    {
      type: 'seat_chart',
      label: '座位表',
      icon: <Bus className="w-5 h-5" />,
      description: '交通工具座位配置圖',
    },
    {
      type: 'roster',
      label: '名單清冊',
      icon: <Users className="w-5 h-5" />,
      description: '完整旅客名單與基本資料',
    },
    {
      type: 'meeting_info',
      label: '集合資訊',
      icon: <MapPin className="w-5 h-5" />,
      description: '集合地點、時間與聯絡資訊',
    },
  ];

  // Filter and display documents based on the `availableDocumentTypes` configuration
  const documentsToDisplay = mergedConfig.availableDocumentTypes
    ? allDocumentDefinitions.filter(doc => mergedConfig.availableDocumentTypes?.includes(doc.type))
    : allDocumentDefinitions;

  // Handlers for export operations, now directly calling the injected functions
  const handleExportPDFAction = (type: DocumentType) => {
    onExportPDF(type, documentGenerationData);
  };

  const handleExportExcelAction = (type: DocumentType) => {
    onExportExcel(type, documentGenerationData);
  };

  return (
    // Dashtail/TrvicERP standard Card Structure for a draggable widget
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col w-full min-h-[200px] sm:min-h-[250px]">
      {/* Drag Handle Area - Essential for Dashtail draggable widgets */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4 drag-handle cursor-grab select-none">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <h3 className="text-lg font-bold text-gray-900">{mergedConfig.title}</h3>
        </div>
        {/* Additional widget controls can be placed here */}
      </div>

      {/* Widget Content */}
      <div className="space-y-6 flex-grow">
        <p className="text-sm text-gray-500 mt-1">{mergedConfig.description}</p>

        {/* Responsive Grid for Document Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documentsToDisplay.map((doc) => (
            <motion.div
              key={doc.type}
              whileHover={{ y: -2 }}
              className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow-transform duration-200 ease-in-out flex flex-col"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600">
                  {doc.icon}
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-gray-900 text-base">{doc.label}</h4>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">{doc.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto"> {/* Pushes buttons to the bottom */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePreview(doc.type)}
                  className="flex-1 min-w-[100px] py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-1 px-3 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                  aria-label={`預覽 ${doc.label}`}
                >
                  <FileText className="w-4 h-4" />
                  預覽
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExportPDFAction(doc.type)}
                  className="flex-1 min-w-[100px] py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1 px-3 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label={`導出 ${doc.label} 為 PDF`}
                >
                  <Download className="w-4 h-4" />
                  PDF
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExportExcelAction(doc.type)}
                  className="flex-1 min-w-[100px] py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-1 px-3 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  aria-label={`導出 ${doc.label} 為 Excel`}
                >
                  <FileDown className="w-4 h-4" />
                  Excel
                </motion.button>
                {mergedConfig.enableLineSend && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      const content = generateDocumentContent?.(doc.type, documentGenerationData) || '';
                      handleSendLineAction(doc.type, content);
                    }}
                    className="flex-1 min-w-[100px] py-2 bg-brand-line text-white rounded-lg text-sm font-medium hover:bg-brand-line-dark transition-colors flex items-center justify-center gap-1 px-3 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-brand-line focus:ring-offset-2"
                    disabled={sendingLine}
                    aria-label={`透過 Line 發送 ${doc.label}`}
                  >
                    {sendingLine && selectedDoc === doc.type ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Send className="w-4 h-4" aria-hidden="true" />
                    )}
                    Line
                  </motion.button>
                )}
              </div>
              {/* Line send result feedback (only for the selected document type) */}
              {lineSendResult && selectedDoc === doc.type && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "mt-2 p-2 text-xs rounded-md flex items-center gap-1",
                    lineSendResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}
                  role="status"
                  aria-live="polite"
                >
                  {lineSendResult.success ? <CheckCircle className="w-3 h-3" aria-hidden="true" /> : <X className="w-3 h-3" aria-hidden="true" />}
                  <span>{lineSendResult.message}</span>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Document Preview Modal */}
      {showPreview && selectedDoc && (
        <div
          className="fixed inset-0 bg-primary-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 md:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="preview-modal-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-white w-full max-w-4xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col shadow-xl"
          >
            <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 id="preview-modal-title" className="text-lg sm:text-xl font-bold text-gray-900">
                {documentsToDisplay.find(d => d.type === selectedDoc)?.label} 預覽
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPDFAction(selectedDoc)} // Export from preview
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="導出為 PDF"
                >
                  <Printer className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                  onClick={handleClosePreview}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  aria-label="關閉預覽"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 sm:p-6">
              {/* Dynamically generated HTML content for the preview */}
              <div dangerouslySetInnerHTML={{ __html: generateDocumentContent(selectedDoc, documentGenerationData) }} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}