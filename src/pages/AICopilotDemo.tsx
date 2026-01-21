import React from 'react';
import { AICopilot } from '../components/shared/AICopilot';

export default function AICopilotDemo() {
  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            AI Copilot Demo
          </h1>
          <p className="text-neutral-600">
            這是一個 AI Copilot 的演示頁面，展示 AI 如何協助您管理旅遊團體資料。
          </p>
        </div>
        
        <AICopilot 
          tourInfo={{
            '團號': 'JP20240101',
            '團名': '東京迪士尼5日遊',
            '出發日': '2024-01-15',
            '回程日': '2024-01-19',
            '人數': 30,
            '領隊': '張小華',
            '目的地': '東京'
          }}
          className="h-[800px]"
        />
      </div>
    </div>
  );
}
