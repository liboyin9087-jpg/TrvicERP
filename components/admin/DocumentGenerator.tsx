import React, { useState, memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Download, Mail, Send, FileDown, Users, Bed, Bus,
  Calendar, MapPin, Phone, Printer, X, CheckCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Booking } from '@/core/types';
import type { Session, HotelRoomAllocation, SeatAssignment, MeetingInfo } from '@/core/types/session';
import { LineService, LineSendTarget } from '@/core/services/lineService';

interface DocumentGeneratorProps {
  session: Session;
  bookings: Booking[];
  hotelRooms?: HotelRoomAllocation[];
  roomAssignments?: RoomAssignment[];
  seatAssignments?: SeatAssignment[];
  meetingInfo?: MeetingInfo;
}

interface RoomAssignment {
  roomNumber: string;
  roomType: string;
  occupants: { name: string }[];
}

type DocumentType = 'itinerary' | 'room_list' | 'seat_chart' | 'roster' | 'meeting_info';

interface DocumentOption {
  type: DocumentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface LineSendResult {
  success: boolean;
  message: string;
}

const DocumentGenerator: React.FC<DocumentGeneratorProps> = memo(({
  session,
  bookings,
  hotelRooms = [],
  roomAssignments = [],
  seatAssignments = [],
  meetingInfo,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [sendingLine, setSendingLine] = useState(false);
  const [lineSendResult, setLineSendResult] = useState<LineSendResult | null>(null);

  const documents: DocumentOption[] = useMemo(() => [
    {
      type: 'itinerary',
      label: '團體行程表',
      icon: <FileText className="w-5 h-5" aria-hidden="true" />,
      description: '包含每日行程、景點、餐食、住宿資訊',
    },
    {
      type: 'room_list',
      label: '分房表',
      icon: <Bed className="w-5 h-5" aria-hidden="true" />,
      description: '房間分配清單，顯示每位旅客的房間號',
    },
    {
      type: 'seat_chart',
      label: '座位表',
      icon: <Bus className="w-5 h-5" aria-hidden="true" />,
      description: '交通工具座位配置圖',
    },
    {
      type: 'roster',
      label: '名單清冊',
      icon: <Users className="w-5 h-5" aria-hidden="true" />,
      description: '完整旅客名單與基本資料',
    },
    {
      type: 'meeting_info',
      label: '集合資訊',
      icon: <MapPin className="w-5 h-5" aria-hidden="true" />,
      description: '集合地點、時間與聯絡資訊',
    },
  ], []);

  const handleGenerate = (type: DocumentType) => {
    setSelectedDoc(type);
    setShowPreview(true);
  };

  const handleExportPDF = async (type: DocumentType) => {
    try {
      const htmlContent = generateHTML(type);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF 匯出失敗，請重試');
    }
  };

  const handleExportExcel = (type: DocumentType) => {
    try {
      let csvContent = '';
      const docLabel = documents.find(d => d.type === type)?.label || '文件';

      switch (type) {
        case 'roster':
          csvContent = '序號,姓名,護照號碼,房間號,座位號,特殊需求\n';
          bookings.forEach((booking, idx) => {
            csvContent += `${idx + 1},"${booking.customer_name}","${booking.passport_data?.passport_number || ''}","${booking.assigned_room || ''}","${booking.assigned_seat || ''}","${booking.special_needs || '無'}"\n`;
          });
          break;
        case 'room_list':
          csvContent = '房號,房型,入住旅客\n';
          roomAssignments.forEach(room => {
            csvContent += `${room.roomNumber},"${room.roomType}","${room.occupants.map(o => o.name).join('、')}"\n`;
          });
          break;
        case 'seat_chart':
          csvContent = '座位號,是否已分配,乘客姓名,交通工具類型\n';
          seatAssignments.forEach(seat => {
            csvContent += `${seat.seatNumber},"${seat.isAssigned ? '是' : '否'}","${seat.passengerName || ''}","${seat.vehicleType || ''}"\n`;
          });
          break;
        case 'meeting_info':
          if (meetingInfo) {
            csvContent = '項目,內容\n';
            csvContent += `集合地點,"${meetingInfo.location}"\n`;
            if (meetingInfo.address) csvContent += `地址,"${meetingInfo.address}"\n`;
            csvContent += `集合時間,"${meetingInfo.meetingTime}"\n`;
            csvContent += `聯絡人,"${meetingInfo.contactPerson}"\n`;
            csvContent += `聯絡電話,"${meetingInfo.contactPhone}"\n`;
            if (meetingInfo.notes) csvContent += `備註,"${meetingInfo.notes}"\n`;
          }
          break;
        case 'itinerary':
          csvContent = '日期,行程內容\n';
          csvContent += `團號,"${session.groupNumber || session.seriesId}"\n`;
          csvContent += `出發日期,"${session.startDate}"\n`;
          csvContent += `結束日期,"${session.endDate}"\n`;
          csvContent += `人數,"${session.currentPax}/${session.maxPax}"\n`;
          break;
        default:
          csvContent = '資料\n無資料可匯出\n';
      }

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${docLabel}_${session.groupNumber || session.seriesId}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Excel 匯出失敗，請重試');
    }
  };

  const handleSendLine = async (type: DocumentType) => {
    setSendingLine(true);
    setLineSendResult(null);

    try {
      const targets: LineSendTarget[] = LineService.extractLineTargetsFromBookings(bookings);

      if (targets.length === 0) {
        setLineSendResult({
          success: false,
          message: '沒有可發送的用戶（需要用戶 ID）',
        });
        return;
      }

      const result = await LineService.sendDocumentNotification({
        sessionId: session.id as any,
        documentType: type,
        recipients: targets,
        customMessage: `團號：${session.groupNumber || session.seriesId}`,
      });

      setLineSendResult({
        success: result.success,
        message: result.success
          ? `已成功發送至 ${result.sentCount} 位用戶`
          : `發送失敗：${result.errors?.[0]?.error || '未知錯誤'}`,
      });
    } catch (error) {
      setLineSendResult({
        success: false,
        message: `發送錯誤：${error}`,
      });
    } finally {
      setSendingLine(false);
      setTimeout(() => setLineSendResult(null), 3000);
    }
  };

  const generateHTML = (type: DocumentType): string => {
    switch (type) {
      case 'itinerary':
        return generateItineraryHTML();
      case 'room_list':
        return generateRoomListHTML();
      case 'seat_chart':
        return generateSeatChartHTML();
      case 'roster':
        return generateRosterHTML();
      case 'meeting_info':
        return generateMeetingInfoHTML();
      default:
        return '';
    }
  };

  const generateItineraryHTML = (): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>團體行程表 - ${session.groupNumber || session.seriesId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; }
          .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .meta { color: #666; font-size: 14px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">團體行程表</div>
          <div class="meta">
            團號：${session.groupNumber || 'N/A'} | 
            出發日期：${session.startDate} ~ ${session.endDate} | 
            人數：${session.currentPax}/${session.maxPax}
          </div>
        </div>
        <div class="section">
          <div class="section-title">行程資訊</div>
          <p>詳細行程內容將在此顯示...</p>
        </div>
      </body>
      </html>
    `;
  };

  const generateRoomListHTML = (): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>分房表 - ${session.groupNumber || session.seriesId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; }
          .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">分房表</div>
          <div>團號：${session.groupNumber || 'N/A'} | 出發日期：${session.startDate}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>房號</th>
              <th>房型</th>
              <th>入住旅客</th>
            </tr>
          </thead>
          <tbody>
            ${roomAssignments.map(room => `
              <tr>
                <td>${room.roomNumber}</td>
                <td>${room.roomType}</td>
                <td>${room.occupants.map(o => o.name).join('、')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const generateSeatChartHTML = (): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>座位表 - ${session.groupNumber || session.seriesId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; }
          .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .seat-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; margin-top: 20px; }
          .seat { padding: 15px; border: 2px solid #ddd; border-radius: 8px; text-align: center; }
          .seat.assigned { background: #dbeafe; border-color: #3b82f6; }
          .seat.available { background: #f0fdf4; border-color: #22c55e; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">座位表</div>
          <div>團號：${session.groupNumber || 'N/A'} | 交通工具：${seatAssignments[0]?.vehicleType || 'N/A'}</div>
        </div>
        <div class="seat-grid">
          ${seatAssignments.map(seat => `
            <div class="seat ${seat.isAssigned ? 'assigned' : 'available'}">
              <div style="font-weight: bold;">${seat.seatNumber}</div>
              ${seat.passengerName ? `<div style="font-size: 12px; margin-top: 5px;">${seat.passengerName}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `;
  };

  const generateRosterHTML = (): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>名單清冊 - ${session.groupNumber || session.seriesId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; }
          .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">名單清冊</div>
          <div>團號：${session.groupNumber || 'N/A'} | 總人數：${bookings.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>序號</th>
              <th>姓名</th>
              <th>護照號碼</th>
              <th>房間號</th>
              <th>座位號</th>
              <th>特殊需求</th>
            </tr>
          </thead>
          <tbody>
            ${bookings.map((booking, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${booking.customer_name}</td>
                <td>${booking.passport_data?.passport_number || 'N/A'}</td>
                <td>${booking.assigned_room || 'N/A'}</td>
                <td>${booking.assigned_seat || 'N/A'}</td>
                <td>${booking.special_needs || '無'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const generateMeetingInfoHTML = (): string => {
    if (!meetingInfo) return '<html><body><p>無集合資訊</p></body></html>';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>集合資訊 - ${session.groupNumber || session.seriesId}</title>
        <style>
          body { font-family: 'Microsoft JhengHei', sans-serif; padding: 40px; }
          .header { border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .info-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 20px; }
          .info-item { margin-bottom: 15px; }
          .info-label { font-weight: bold; color: #666; margin-bottom: 5px; }
          .info-value { font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">集合資訊</div>
          <div>團號：${session.groupNumber || 'N/A'}</div>
        </div>
        <div class="info-box">
          <div class="info-item">
            <div class="info-label">集合地點</div>
            <div class="info-value">${meetingInfo.location}</div>
            ${meetingInfo.address ? `<div style="color: #666; margin-top: 5px;">${meetingInfo.address}</div>` : ''}
          </div>
          <div class="info-item">
            <div class="info-label">集合時間</div>
            <div class="info-value">${meetingInfo.meetingTime}</div>
          </div>
          <div class="info-item">
            <div class="info-label">聯絡人</div>
            <div class="info-value">${meetingInfo.contactPerson}</div>
          </div>
          <div class="info-item">
            <div class="info-label">聯絡電話</div>
            <div class="info-value">${meetingInfo.contactPhone}</div>
          </div>
          ${meetingInfo.notes ? `
            <div class="info-item">
              <div class="info-label">備註</div>
              <div>${meetingInfo.notes}</div>
            </div>
          ` : ''}
        </div>
      </body>
      </html>
    `;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">出團前文件生成</h3>
        <p className="text-sm text-gray-500 mt-1">產生並發送團體相關文件</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <motion.div
            key={doc.type}
            whileHover={{ y: -2 }}
            className="bg-white p-6 rounded-2xl border border-gray-100"
            aria-labelledby={`doc-${doc.type}-title`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                {doc.icon}
              </div>
              <div>
                <h4 id={`doc-${doc.type}-title`} className="font-bold text-gray-900">{doc.label}</h4>
                <p className="text-xs text-gray-500">{doc.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleGenerate(doc.type)}
                className="flex-1 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-1"
                aria-label={`預覽${doc.label}`}
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                預覽
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExportPDF(doc.type)}
                className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-1"
                aria-label={`匯出${doc.label}為PDF`}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                PDF
              </motion.button>
            </div>
            <div className="flex gap-2 mt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleExportExcel(doc.type)}
                className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors flex items-center justify-center gap-1"
                aria-label={`匯出${doc.label}為Excel`}
              >
                <FileDown className="w-4 h-4" aria-hidden="true" />
                Excel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSendLine(doc.type)}
                className="flex-1 py-2 bg-[#00B900] text-white rounded-lg text-sm font-medium hover:bg-[#009900] transition-colors flex items-center justify-center gap-1"
                aria-label={`發送${doc.label}到Line`}
                disabled={sendingLine}
              >
                {sendingLine ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
                Line
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {showPreview && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-modal-title"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 id="preview-modal-title" className="text-xl font-bold text-gray-900">
                {documents.find(d => d.type === selectedDoc)?.label} 預覽
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportPDF(selectedDoc)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="列印預覽內容"
                >
                  <Printer className="w-5 h-5" aria-hidden="true" />
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                  aria-label="關閉預覽"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div dangerouslySetInnerHTML={{ __html: generateHTML(selectedDoc) }} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
});

DocumentGenerator.displayName = 'DocumentGenerator';

export default DocumentGenerator;