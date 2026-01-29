/**
 * Document Generator Types
 * Defines types for document generation functionality
 */

export type DocumentType = 'itinerary' | 'room_list' | 'seat_chart' | 'roster' | 'meeting_info';

export interface DocumentDefinition {
  type: DocumentType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export interface DocumentGenerationData {
  session?: {
    id: string;
    tourId: string;
    startDate: string;
    endDate: string;
    tripName: string;
  };
  bookings?: Array<{
    id: string;
    passengerName: string;
    bookingNumber: string;
  }>;
  hotelRooms?: Array<{
    id: string;
    roomNumber: string;
    roomType: string;
  }>;
  roomAssignments?: Array<{
    roomId: string;
    passengerIds: string[];
  }>;
  seatAssignments?: Array<{
    seatNumber: string;
    passengerId: string;
  }>;
}

export interface DocumentGeneratorProps {
  session?: any;
  bookings?: any[];
  hotelRooms?: any[];
  roomAssignments?: any[];
  seatAssignments?: any[];
  meetingInfo?: any;
  config?: any;
  generateDocumentContent?: (docType: DocumentType, data: any) => string;
  onSendLine?: (docType: DocumentType, content: string) => Promise<void>;
  onExportPDF?: (docType: DocumentType, content: string) => Promise<void>;
  onExportExcel?: (docType: DocumentType, data: any[]) => Promise<void>;
}

export interface DocumentGeneratorState {
  selectedDocuments: DocumentType[];
  isGenerating: boolean;
  isExporting: boolean;
  previewData?: Record<string, any>;
  error?: string;
}
