import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  MapPin,
  Phone,
  AlertCircle,
  Plane,
  Hotel,
  Utensils,
} from "lucide-react";
import Spinner from "../shared/Spinner";

export default function DigitalBriefing() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner />
      </div>
    );
  }
  const briefingItems = [
    {
      icon: <Plane className="w-5 h-5" />,
      title: "航班資訊",
      content: "CI100 桃園 → 東京成田 08:30-12:30",
      important: true,
    },
    {
      icon: <Hotel className="w-5 h-5" />,
      title: "住宿飯店",
      content: "東京新宿華盛頓飯店 (4晚)",
      important: false,
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "集合地點",
      content: "桃園機場第一航廈 3樓出發大廳",
      important: true,
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: "集合時間",
      content: "2025/03/15 (六) 06:00",
      important: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      <header className="bg-black text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6" />
          <h1 className="text-xl font-bold">行前說明</h1>
        </div>
        <p className="text-sm text-gray-400 mt-1">東京五日深度遊</p>
      </header>
      <main className="p-6 space-y-6">
        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800">重要提醒</h3>
              <p className="text-sm text-yellow-700 mt-1">
                請於出發前 3 小時抵達機場，並攜帶護照正本
              </p>
            </div>
          </div>
        </div>

        {/* Briefing Items */}
        <div className="space-y-4">
          {briefingItems.map((item, idx) => (
            <div
              key={idx}
              className={`bg-white p-4 rounded-xl border ${item.important ? "border-brand-200 bg-brand-50/30" : "border-gray-100"}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.important ? "bg-brand-100 text-brand-600" : "bg-gray-100 text-gray-600"}`}
                >
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {item.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Contact */}
        <div className="bg-black text-white p-6 rounded-2xl">
          <h3 className="font-bold mb-4">緊急聯絡</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-brand-400" />
              <div>
                <p className="text-xs text-gray-400">領隊</p>
                <p className="font-semibold">陳小明 0912-345-678</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-brand-400" />
              <div>
                <p className="text-xs text-gray-400">公司</p>
                <p className="font-semibold">02-2345-6789</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
