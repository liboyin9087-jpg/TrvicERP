import React from 'react';
import { Cloud, CloudRain, Sun } from 'lucide-react';

interface WeatherWidgetConfig {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy';
  location: string;
  note: string;
  // Optional: A display title for the widget, adhering to 'config' concept
  title?: string;
}

interface WeatherWidgetProps {
  config: WeatherWidgetConfig;
  className?: string; // Allows external styling of the widget container
}

const ICON_MAP = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
};

export default function WeatherWidget({ config, className }: WeatherWidgetProps) {
  // Handle boundary case: if config data is not provided or incomplete
  if (!config || !config.condition || config.temperature === undefined || !config.location) {
    return (
      <div className={`p-4 rounded-lg shadow-md bg-background text-foreground flex items-center justify-center h-full ${className || ''}`}>
        <p className="text-muted-foreground">Weather data not available.</p>
      </div>
    );
  }

  const Icon = ICON_MAP[config.condition] || Sun;

  return (
    <div className={`p-4 rounded-lg shadow-md bg-background text-foreground flex flex-col h-full ${className || ''}`}>
      {/* drag-handle structure for draggable widget functionality */}
      <div className="drag-handle w-full cursor-grab">
        {config.title && <h3 className="text-lg font-semibold text-foreground mb-2">{config.title}</h3>}
      </div>

      <div className="flex items-center justify-between flex-grow">
        <div>
          <div className="text-3xl font-bold text-foreground">{config.temperature}°C</div>
          <div className="text-sm text-muted-foreground">
            {config.location} · {config.condition}
          </div>
          {config.note && <div className="text-sm text-info-600 mt-1">{config.note}</div>}
        </div>
        <Icon size={48} className="text-primary-500" />
      </div>
    </div>
  );
}