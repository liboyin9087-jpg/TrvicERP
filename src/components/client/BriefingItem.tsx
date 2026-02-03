import React from "react";

interface BriefingItemConfig {
  icon: React.ReactNode;
  title: string;
  content: string;
  important?: boolean;
}

export default function BriefingItem({
  icon,
  title,
  content,
  important = false,
}: BriefingItemConfig) {
  return (
    <div
      className={`bg-white p-4 rounded-lg border ${
        important ? "border-primary-200 bg-primary-50 shadow-sm" : "border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              important ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-600"
            }`}
          >
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="font-semibold text-gray-900 mt-1">{content}</p>
          </div>
        </div>
        {/* Drag handle structure */}
        <div className="p-1 rounded-md hover:bg-gray-100 cursor-grab drag-handle">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>
      </div>
    </div>
  );
}