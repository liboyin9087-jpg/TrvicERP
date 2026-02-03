import React from "react";
import { FileText, Clock, MapPin, Phone, AlertCircle, Plane, Hotel, Utensils, LucideIcon } from "lucide-react";

// Define a mapping from string names to LucideIcon components for Kintone configurability
type IconName = "Plane" | "Hotel" | "MapPin" | "Clock" | "FileText" | "AlertCircle" | "Phone" | "Utensils";

const iconMap: Record<IconName, LucideIcon> = {
  Plane,
  Hotel,
  MapPin,
  Clock,
  FileText,
  AlertCircle,
  Phone,
  Utensils,
};

// Define types for individual briefing items
interface BriefingItem {
  icon: IconName; // Icon is now a string name, not a JSX element
  title: string;
  content: string;
  important: boolean;
}

// Define type for important notices
interface ImportantNotice {
  title: string;
  content: string;
}

// Define type for emergency contacts
interface EmergencyContact {
  label: string;
  name: string;
  phone: string;
}

// Define the configuration interface for the DigitalBriefing component
// This replaces internal data and allows external configuration (e.g., from Kintone)
export interface DigitalBriefingConfig {
  title: string;
  subtitle: string;
  briefingItems: BriefingItem[];
  importantNotice?: ImportantNotice; // Optional important notice section
  emergencyContacts?: EmergencyContact[]; // Optional emergency contact section
}

// Define the props interface for the DigitalBriefing component
interface DigitalBriefingProps {
  config: DigitalBriefingConfig;
}

export default function DigitalBriefing({ config }: DigitalBriefingProps) {
  const { title, subtitle, briefingItems, importantNotice, emergencyContacts } = config;

  return (
    // Component is wrapped in a standard Dashtail 'card' structure
    <div className="card rounded-lg shadow-sm border border-gray-100 bg-white overflow-hidden">
      {/* Dashtail widget header with drag-handle */}
      <header className="bg-primary-900 text-white px-6 py-4 flex items-center justify-between drag-handle">
        <div className="flex items-center gap-3">
          {/* Main widget icon - FileText is static for this briefing component */}
          <FileText className="w-6 h-6" />
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            <p className="text-sm text-primary-200 mt-1">{subtitle}</p>
          </div>
        </div>
      </header>

      {/* Main content of the briefing, wrapped in card-body */}
      <main className="card-body p-6 space-y-6">
        {/* Important Notice Section (conditionally rendered) */}
        {importantNotice && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-warning-800">{importantNotice.title}</h3>
                <p className="text-sm text-warning-700 mt-1">{importantNotice.content}</p>
              </div>
            </div>
          </div>
        )}

        {/* Briefing Items Section */}
        <div className="space-y-4">
          {briefingItems.map((item, idx) => {
            const ItemIcon = iconMap[item.icon]; // Resolve icon from string name
            return (
              <div
                key={idx}
                className={`bg-white p-4 rounded-lg border ${item.important ? "border-brand-200 bg-brand-50/30" : "border-gray-100"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.important ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-600"}`}
                  >
                    <ItemIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{item.title}</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {item.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Emergency Contact Section (conditionally rendered) */}
        {emergencyContacts && emergencyContacts.length > 0 && (
          <div className="bg-primary-900 text-white p-6 rounded-2xl">
            <h3 className="font-bold mb-4">緊急聯絡</h3>
            <div className="space-y-3">
              {emergencyContacts.map((contact, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-brand-400" />
                  <div>
                    <p className="text-sm text-primary-200">{contact.label}</p>
                    <p className="font-semibold">{contact.name} {contact.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}