import React from "react";

type Props = {
  icon: React.ReactNode;
  title: string;
  content: string;
  important?: boolean;
};

export default function BriefingItem({
  icon,
  title,
  content,
  important = false,
}: Props) {
  return (
    <div
      className={`bg-white p-4 rounded-xl border ${important ? "border-brand-200 bg-brand-50/30" : "border-gray-100"}`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${important ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-600"}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="font-semibold text-gray-900 mt-1">{content}</p>
        </div>
      </div>
    </div>
  );
}
