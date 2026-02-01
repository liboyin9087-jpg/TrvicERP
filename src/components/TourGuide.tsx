/**
 * 數位領隊 (Digital Tour Guide)
 * - 時間觸發：06:00 天氣簡報 / 21:00 當日總結
 * - 地理觸發：Geofencing < 100m 景點語音導覽
 * - 狀態觸發：天氣變化 / 交通延遲即時通知
 * - PWA 推播通知整合
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Cloud,
  Sun,
  CloudRain,
  Thermometer,
  Navigation,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Compass,
  Droplets,
  Wind,
} from "lucide-react";
import { API_ENDPOINTS, api } from "@/lib/api";

// ============ Types ============

interface GeoPoint {
  name: string;
  lat: number;
  lng: number;
  description: string;
  audio_url?: string;
  radius: number; // meters
  category: "scenic" | "restaurant" | "hotel" | "transport" | "activity";
}

interface WeatherData {
  location: string;
  forecasts: {
    start_time: string;
    end_time: string;
    weather?: string;
    pop?: number;
    max_t?: number;
    min_t?: number;
    comfort?: string;
  }[];
}

interface TourGuideAlert {
  id: string;
  type: "weather" | "geo" | "schedule" | "traffic";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: Record<string, any>;
}

// ============ Geofencing Hook ============

function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("此裝置不支援定位功能");
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => setPosition(pos),
      (err) => setError(err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      if (watchRef.current !== null) {
        navigator.geolocation.clearWatch(watchRef.current);
      }
    };
  }, []);

  return { position, error };
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ============ Weather Icon ============

const WeatherIcon: React.FC<{ weather?: string; className?: string }> = ({ weather, className = "w-5 h-5" }) => {
  if (!weather) return <Cloud className={className} />;
  if (weather.includes("雨")) return <CloudRain className={`${className} text-blue-500`} />;
  if (weather.includes("晴")) return <Sun className={`${className} text-amber-500`} />;
  return <Cloud className={`${className} text-gray-400`} />;
};

// ============ Category Config ============

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  scenic: { label: "景點", color: "bg-emerald-100 text-emerald-700" },
  restaurant: { label: "餐廳", color: "bg-orange-100 text-orange-700" },
  hotel: { label: "住宿", color: "bg-blue-100 text-blue-700" },
  transport: { label: "交通", color: "bg-purple-100 text-purple-700" },
  activity: { label: "活動", color: "bg-pink-100 text-pink-700" },
};

// ============ Demo POIs ============

const DEMO_POIS: GeoPoint[] = [
  { name: "台北101", lat: 25.0340, lng: 121.5645, description: "台灣最高地標建築，觀景台可俯瞰台北全景", radius: 100, category: "scenic" },
  { name: "故宮博物院", lat: 25.1024, lng: 121.5485, description: "世界四大博物館之一，收藏中華五千年文物", radius: 100, category: "scenic" },
  { name: "九份老街", lat: 25.1089, lng: 121.8449, description: "依山傍海的採金老城，充滿日式風情", radius: 150, category: "scenic" },
  { name: "日月潭", lat: 23.8568, lng: 120.9162, description: "台灣最大天然湖泊，環湖步道風景秀麗", radius: 200, category: "scenic" },
  { name: "阿里山", lat: 23.5101, lng: 120.7024, description: "雲海、日出、神木、鐵路、櫻花五大奇景", radius: 300, category: "scenic" },
];

// ============ Component ============

const TourGuide: React.FC = () => {
  const { position, error: geoError } = useGeolocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [alerts, setAlerts] = useState<TourGuideAlert[]>([]);
  const [nearbyPOIs, setNearbyPOIs] = useState<(GeoPoint & { distance: number })[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<"weather" | "nearby" | "alerts">("weather");
  const triggeredRef = useRef<Set<string>>(new Set());

  // ============ Fetch Weather ============

  useEffect(() => {
    const fetchWeather = async () => {
      const resp = await api.get<WeatherData>(API_ENDPOINTS.weather.forecast + "?location=臺北市");
      if (resp.data) setWeather(resp.data);
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60 * 1000); // Every 30 min
    return () => clearInterval(interval);
  }, []);

  // ============ Geofencing Check ============

  useEffect(() => {
    if (!position) return;

    const lat = position.coords.latitude;
    const lng = position.coords.longitude;

    const nearby = DEMO_POIS
      .map((poi) => ({
        ...poi,
        distance: haversineDistance(lat, lng, poi.lat, poi.lng),
      }))
      .filter((poi) => poi.distance <= poi.radius * 3) // Show POIs within 3x radius
      .sort((a, b) => a.distance - b.distance);

    setNearbyPOIs(nearby);

    // Trigger geofence alerts for POIs within radius
    nearby
      .filter((poi) => poi.distance <= poi.radius)
      .forEach((poi) => {
        if (!triggeredRef.current.has(poi.name)) {
          triggeredRef.current.add(poi.name);
          addAlert({
            type: "geo",
            title: `即將到達：${poi.name}`,
            message: poi.description,
            data: { lat: poi.lat, lng: poi.lng },
          });

          // Push notification if enabled
          if (notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
            new Notification(`景點導覽 - ${poi.name}`, {
              body: poi.description,
              icon: "/favicon.ico",
              tag: `geo-${poi.name}`,
            });
          }
        }
      });
  }, [position, notificationsEnabled]);

  // ============ Time-based Triggers ============

  useEffect(() => {
    const checkTimeTriggers = () => {
      const now = new Date();
      const hour = now.getHours();
      const key = `time-${now.toDateString()}-${hour}`;

      if (hour === 6 && !triggeredRef.current.has(key)) {
        triggeredRef.current.add(key);
        const currentWeather = weather?.forecasts?.[0];
        addAlert({
          type: "schedule",
          title: "早安！今日天氣簡報",
          message: currentWeather
            ? `${weather?.location}：${currentWeather.weather || "—"}，${currentWeather.min_t || "--"}~${currentWeather.max_t || "--"}°C，降雨 ${currentWeather.pop || 0}%`
            : "天氣資料載入中...",
        });
      }

      if (hour === 21 && !triggeredRef.current.has(key)) {
        triggeredRef.current.add(key);
        addAlert({
          type: "schedule",
          title: "今日總結",
          message: "辛苦了！查看今天的行程回顧和明天的安排",
        });
      }
    };

    checkTimeTriggers();
    const interval = setInterval(checkTimeTriggers, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [weather]);

  // ============ Helpers ============

  const addAlert = useCallback((partial: Omit<TourGuideAlert, "id" | "timestamp" | "read">) => {
    setAlerts((prev) => [
      {
        ...partial,
        id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date(),
        read: false,
      },
      ...prev,
    ].slice(0, 50));
  }, []);

  const enableNotifications = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotificationsEnabled(permission === "granted");

    // Register periodic sync
    if ("serviceWorker" in navigator && "periodicSync" in (navigator.serviceWorker as any)) {
      const reg = await navigator.serviceWorker.ready;
      try {
        await (reg as any).periodicSync.register("weather-check", { minInterval: 6 * 60 * 60 * 1000 });
        await (reg as any).periodicSync.register("morning-briefing", { minInterval: 24 * 60 * 60 * 1000 });
        await (reg as any).periodicSync.register("evening-summary", { minInterval: 24 * 60 * 60 * 1000 });
      } catch {
        // Periodic sync not supported or denied
      }
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;
  const currentForecast = weather?.forecasts?.[0];

  // ============ Render ============

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6" />
            <div>
              <h1 className="text-lg font-semibold">數位領隊</h1>
              <p className="text-xs text-emerald-100">
                {position
                  ? `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`
                  : geoError || "定位中..."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              title={audioEnabled ? "關閉語音" : "開啟語音"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={notificationsEnabled ? () => setNotificationsEnabled(false) : enableNotifications}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20"
              title={notificationsEnabled ? "關閉推播" : "開啟推播"}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Current Weather Summary */}
        {currentForecast && (
          <div className="mt-3 flex items-center gap-4 bg-white/10 rounded-lg px-3 py-2">
            <WeatherIcon weather={currentForecast.weather} className="w-8 h-8" />
            <div className="flex-1">
              <div className="text-sm font-medium">{currentForecast.weather || "—"}</div>
              <div className="text-xs text-emerald-100">
                {currentForecast.min_t ?? "--"}~{currentForecast.max_t ?? "--"}°C
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-xs">
                <Droplets className="w-3 h-3" /> {currentForecast.pop ?? 0}%
              </div>
              <div className="text-xs text-emerald-100">{currentForecast.comfort || ""}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b">
        {([
          { key: "weather" as const, label: "天氣", icon: Cloud },
          { key: "nearby" as const, label: "附近景點", icon: MapPin, badge: nearbyPOIs.length },
          { key: "alerts" as const, label: "通知", icon: Bell, badge: unreadCount },
        ]).map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? "border-emerald-500 text-emerald-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
            {badge ? (
              <span className="bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Weather Tab */}
        {activeTab === "weather" && (
          <div className="p-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">
              {weather?.location || "—"} 36 小時預報
            </h3>
            {weather?.forecasts?.map((f, i) => (
              <div key={i} className="bg-white rounded-lg border p-3 flex items-center gap-3">
                <WeatherIcon weather={f.weather} className="w-10 h-10" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{f.weather || "—"}</div>
                  <div className="text-xs text-gray-500">
                    {f.start_time?.slice(5, 16)?.replace("T", " ") || "—"} ~{" "}
                    {f.end_time?.slice(11, 16) || "—"}
                  </div>
                </div>
                <div className="text-right text-xs space-y-0.5">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Thermometer className="w-3 h-3" />
                    {f.min_t ?? "--"}~{f.max_t ?? "--"}°C
                  </div>
                  <div className="flex items-center gap-1 text-blue-500">
                    <Droplets className="w-3 h-3" /> {f.pop ?? 0}%
                  </div>
                  {f.comfort && (
                    <div className="text-gray-400">{f.comfort}</div>
                  )}
                </div>
              </div>
            )) || (
              <div className="text-center py-8 text-gray-400 text-sm">天氣資料載入中...</div>
            )}
          </div>
        )}

        {/* Nearby POIs Tab */}
        {activeTab === "nearby" && (
          <div className="p-4 space-y-3">
            {nearbyPOIs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <MapPin className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">附近沒有景點</p>
                <p className="text-xs mt-1">移動位置後將自動更新</p>
              </div>
            ) : (
              nearbyPOIs.map((poi) => {
                const cat = CATEGORY_CONFIG[poi.category] || CATEGORY_CONFIG.scenic;
                const isNear = poi.distance <= poi.radius;
                return (
                  <motion.div
                    key={poi.name}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-lg border p-3 ${isNear ? "border-emerald-400 ring-1 ring-emerald-200" : "border-gray-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isNear ? "bg-emerald-100" : "bg-gray-100"}`}>
                        <MapPin className={`w-4 h-4 ${isNear ? "text-emerald-600" : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-900">{poi.name}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${cat.color}`}>{cat.label}</span>
                          {isNear && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                              已到達
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{poi.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <Navigation className="w-3 h-3" />
                          {poi.distance < 1000
                            ? `${Math.round(poi.distance)} m`
                            : `${(poi.distance / 1000).toFixed(1)} km`}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* Alerts Tab */}
        {activeTab === "alerts" && (
          <div className="p-4 space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">目前沒有通知</p>
              </div>
            ) : (
              alerts.map((alert) => {
                const iconMap: Record<string, React.ElementType> = {
                  weather: CloudRain,
                  geo: MapPin,
                  schedule: Clock,
                  traffic: AlertTriangle,
                };
                const Icon = iconMap[alert.type] || Bell;
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`bg-white rounded-lg border p-3 flex gap-3 ${
                      alert.read ? "border-gray-200 opacity-60" : "border-emerald-200"
                    }`}
                    onClick={() =>
                      setAlerts((prev) =>
                        prev.map((a) => (a.id === alert.id ? { ...a, read: true } : a))
                      )
                    }
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{alert.title}</div>
                      <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        {alert.timestamp.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                    {!alert.read && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 mt-2" />
                    )}
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TourGuide;
