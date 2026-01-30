import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  Users,
  Bell,
  User,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Download,
  X,
  Home,
  FileText,
  Award,
  Shield,
  Info,
  Plus,
  Minus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/design-system/Button"; // Assuming design-system Button handles its own focus/active states

// ============================================
// Types - Moved to a separate file
// ============================================

// Assume these types are defined in `/workspaces/TravelMaster/types/traveler-app.ts`
/*
export type TabKey =
  | "home"
  | "explore"
  | "register"
  | "mytrips"
  | "notifications"
  | "feedback";

export interface AvailableTrip {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  image: string;
  price: number;
  maxSubsidy: number;
  subsidyType: "fixed" | "percentage";
  subsidyAmount: number;
  description: string;
  highlights: string[];
  registrationDeadline: string;
  spotsLeft: number;
  totalSpots: number;
  status: "open" | "closing" | "full";
}

export interface MyRegistration {
  id: string;
  tripId: string;
  tripName: string;
  destination: string;
  startDate: string;
  endDate: string;
  image: string;
  status: "pending" | "approved" | "confirmed" | "completed";
  registeredAt: string;
  roomType: string;
  companions: { name: string; relationship: string }[];
  subsidyAmount: number;
  selfPay: number;
  specialNeeds?: string;
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "success";
  title: string;
  message: string;
  date: string;
  read: boolean;
  tripId?: string;
}

export interface UserProfile {
  name: string;
  department: string;
  employeeId: string;
  seniority: number;
  email: string;
  isEligible: boolean;
  subsidyTier: string;
  maxSubsidy: number;
}

export interface RegistrationFormData {
  tripId: string;
  roomType: string;
  mealPreference: string;
  seatPreference: string;
  specialNeeds: string;
  companions: { name: string; relationship: string; age?: number }[];
}
*/
import {
  TabKey,
  AvailableTrip,
  MyRegistration,
  Notification,
  UserProfile,
  RegistrationFormData,
} from "@/types/traveler-app";

// ============================================
// Main Component Props Interface
// ============================================

export interface TravelerAppConfig {
  initialUser: UserProfile;
  initialAvailableTrips: AvailableTrip[];
  initialMyRegistrations: MyRegistration[];
  initialNotifications: Notification[];
  // If the parent needs to react to state changes, add callbacks
  // onRegistrationAdded?: (newRegistration: MyRegistration) => void;
  // onNotificationMarkedRead?: (id: string) => void;
}

// ============================================
// Helper Components Props Interfaces
// ============================================

interface TabBarProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  notificationCount: number;
}

interface EligibilityCardProps {
  user: UserProfile;
}

interface TripCardProps {
  trip: AvailableTrip;
  onRegister: () => void;
}

interface TodoItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  done?: boolean;
}

// ============================================
// Tab Content Components Props Interfaces
// ============================================

interface HomeTabProps {
  user: UserProfile;
  registrations: MyRegistration[];
  notifications: Notification[];
  onNavigate: (tab: TabKey) => void;
}

interface ExploreTabProps {
  trips: AvailableTrip[];
  user: UserProfile;
  onRegister: (tripId: string) => void;
}

interface RegistrationFormProps {
  trip: AvailableTrip;
  user: UserProfile;
  onClose: () => void;
  onSubmit: (data: RegistrationFormData) => void;
}

interface MyTripsTabProps {
  registrations: MyRegistration[];
}

interface NotificationsTabProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
}

interface FeedbackTabProps {
  // No specific props needed based on current logic
}

// ============================================
// Helper Components
// ============================================

function TabBar({ activeTab, onTabChange, notificationCount }: TabBarProps) {
  const tabs = [
    { key: "home" as TabKey, icon: Home, label: "首頁" },
    { key: "explore" as TabKey, icon: MapPin, label: "探索" },
    { key: "mytrips" as TabKey, icon: Calendar, label: "我的行程" },
    {
      key: "notifications" as TabKey,
      icon: Bell,
      label: "通知",
      badge: notificationCount,
    },
    { key: "feedback" as TabKey, icon: Star, label: "意見" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map(({ key, icon: Icon, label, badge }) => (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={cn(
              "flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all relative",
              activeTab === key ? "text-brand-600" : "text-gray-500",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 active:bg-brand-50",
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-error text-white text-[10px] rounded-full flex items-center justify-center">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}

function EligibilityCard({ user }: EligibilityCardProps) {
  return (
    <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-2xl p-5 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-medium text-white/80">資格驗證</span>
          </div>
          <h3 className="text-lg font-bold">{user.subsidyTier}</h3>
          <p className="text-sm text-white/70 mt-1">
            年資 {user.seniority} 年
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-white/80">最高補助</div>
          <div className="text-2xl font-bold">
            NT${user.maxSubsidy.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {user.isEligible ? (
          <>
            <CheckCircle className="w-4 h-4 text-green-300" />
            <span className="text-sm text-green-200">符合報名資格</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-4 h-4 text-yellow-300" />
            <span className="text-sm text-yellow-200">尚未符合報名資格</span>
          </>
        )}
      </div>
    </div>
  );
}

function TripCard({ trip, onRegister }: TripCardProps) {
  const calculateSubsidy = () => {
    if (trip.subsidyType === "fixed") {
      return Math.min(trip.subsidyAmount, trip.price);
    }
    return Math.min((trip.price * trip.subsidyAmount) / 100, trip.maxSubsidy);
  };

  const subsidy = calculateSubsidy();
  const selfPay = trip.price - subsidy;
  const spotsPercentage = (trip.spotsLeft / trip.totalSpots) * 100;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
    >
      <div className="relative h-40">
        <img
          src={trip.image}
          alt={trip.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-sm font-semibold",
              trip.status === "available" && "bg-success text-white",
              trip.status === "full" && "bg-gray-500 text-white",
              trip.status === "cancelled" && "bg-warning text-white",
            )}
          >
            {trip.status === "available" && "報名中"}
            {trip.status === "full" && "已額滿"}
            {trip.status === "cancelled" && "已取消"}
          </span>
        </div>
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <h3 className="font-bold text-lg">{trip.name}</h3>
          <p className="text-sm text-white/80 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {trip.destination}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {trip.startDate} ~ {trip.endDate}
            </span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Clock className="w-4 h-4" />
            <span>截止 {trip.registrationDeadline}</span>
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-2">{trip.description}</p>

        <div className="flex flex-wrap gap-1">
          {trip.highlights.slice(0, 3).map((h, i) => (
            <span
              key={i}
              className="text-sm bg-brand-50 text-brand-600 px-2 py-1 rounded-full"
            >
              {h}
            </span>
          ))}
          {trip.highlights.length > 3 && (
            <span className="text-sm bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
              +{trip.highlights.length - 3}
            </span>
          )}
        </div>

        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">行程費用</span>
            <span className="font-semibold text-gray-900">
              NT${trip.price.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <Award className="w-3 h-3" />
              公司補助
            </span>
            <span className="font-semibold text-green-600">
              -NT${subsidy.toLocaleString()}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
            <span className="text-gray-700 font-medium">自付金額</span>
            <span className="text-xl font-bold text-brand-600">
              NT${selfPay.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    spotsPercentage > 30
                      ? "bg-green-500"
                      : spotsPercentage > 10
                        ? "bg-yellow-500"
                        : "bg-red-500",
                  )}
                  style={{ width: `${100 - spotsPercentage}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500">
              剩餘 {trip.spotsLeft}/{trip.totalSpots} 名額
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRegister}
            disabled={trip.status === "full"}
            className={cn(
              "px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors",
              trip.status === "full"
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-brand-600 text-white hover:bg-brand-700",
            )}
          >
            {trip.status === "full" ? "已額滿" : "立即報名"}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function TodoItem({ icon, title, subtitle, action, done }: TodoItemProps) {
  return (
    <div className="p-4 flex items-center gap-3">
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          done ? "bg-success/10 text-success" : "bg-gray-100 text-gray-600",
        )}
      >
        {done ? <CheckCircle className="w-4 h-4" /> : icon}
      </div>
      <div className="flex-1">
        <p
          className={cn(
            "font-medium",
            done ? "text-gray-400 line-through" : "text-gray-900",
          )}
        >
          {title}
        </p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

// ============================================
// Tab Content Components
// ============================================

function HomeTab({ user, registrations, notifications, onNavigate }: HomeTabProps) {
  const upcomingTrip = registrations.find(
    (r) => r.status === "confirmed",
  );
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const daysUntilTrip = upcomingTrip
    ? Math.ceil(
        (new Date(upcomingTrip.startDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">歡迎回來</p>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">
            {user.department} · {user.employeeId}
          </p>
        </div>
        <div className="w-14 h-14 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
          {user.name[0]}
        </div>
      </div>

      {/* Eligibility Card */}
      <EligibilityCard user={user} />

      {/* Upcoming Trip */}
      {upcomingTrip && (
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          <div className="relative h-32">
            <img
              src={upcomingTrip.image}
              alt={upcomingTrip.tripName}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 text-white">
              <span className="badge-success text-sm px-2 py-0.5 rounded-full font-semibold">
                即將出發
              </span>
              <h3 className="font-bold mt-1">{upcomingTrip.tripName}</h3>
            </div>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-brand-600">
                    {daysUntilTrip}
                  </p>
                  <p className="text-sm text-gray-500">天後出發</p>
                </div>
                <div className="h-10 w-px bg-gray-200" />
                <div>
                  <p className="text-sm text-gray-500">出發日期</p>
                  <p className="font-semibold">{upcomingTrip.startDate}</p>
                </div>
              </div>
              <Button
                onClick={() => onNavigate("mytrips")}
                variant="ghost"
                className="!p-0 !text-brand-600 text-sm font-medium hover:!bg-transparent hover:opacity-80"
              >
                查看詳情 <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={() => onNavigate("explore")}
          className="!flex !flex-col !items-start !h-auto bg-gradient-to-r from-emerald-500 to-green-600 p-4 rounded-2xl text-white !justify-start hover:opacity-90 w-full"
        >
          <MapPin className="w-6 h-6 mb-2" />
          <p className="font-bold">探索行程</p>
          <p className="text-sm text-white/80 font-normal">查看可報名的團體</p>
        </Button>

        <Button
          onClick={() => onNavigate("mytrips")}
          className="!flex !flex-col !items-start !h-auto bg-gradient-to-r from-brand-500 to-brand-700 p-4 rounded-2xl text-white !justify-start hover:opacity-90 w-full"
        >
          <Calendar className="w-6 h-6 mb-2" />
          <p className="font-bold">我的行程</p>
          <p className="text-sm text-white/80 font-normal">
            {registrations.length} 筆報名記錄
          </p>
        </Button>
      </div>

      {/* Notifications Preview */}
      {unreadNotifications > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  您有 {unreadNotifications} 則新通知
                </p>
                <p className="text-sm text-amber-700">點擊查看詳情</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("notifications")}
              className="text-amber-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* To-Do List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">待辦事項</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {upcomingTrip && (
            <>
              <TodoItem
                icon={<FileText className="w-4 h-4" />}
                title="下載個人行程表"
                subtitle={upcomingTrip.tripName}
                action={<Download className="w-4 h-4 text-brand-600" />}
              />
              <TodoItem
                icon={<Info className="w-4 h-4" />}
                title="確認集合資訊"
                subtitle="3/15 早上 6:00 桃園機場"
                done
              />
            </>
          )}
          <TodoItem
            icon={<Star className="w-4 h-4" />}
            title="填寫滿意度調查"
            subtitle="北海道冬季雪祭"
            action={<ChevronRight className="w-4 h-4 text-gray-400" />}
          />
        </div>
      </div>
    </div>
  );
}

function ExploreTab({ trips, user, onRegister }: ExploreTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">探索行程</h1>
        <p className="text-gray-500 mt-1">瀏覽可報名的員工旅遊活動</p>
      </div>

      {/* Eligibility reminder */}
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 flex items-center gap-3">
        <Shield className="w-5 h-5 text-brand-600 flex-shrink-0" />
        <div>
          <p className="text-sm text-brand-900">
            您的補助資格：
            <span className="font-semibold">{user.subsidyTier}</span>，
            最高可補助{" "}
            <span className="font-semibold">
              NT${user.maxSubsidy.toLocaleString()}
            </span>
          </p>
        </div>
      </div>

      {/* Trip List */}
      <div className="space-y-4">
        {trips.map((trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onRegister={() => onRegister(trip.id)}
          />
        ))}
      </div>
    </div>
  );
}

function RegistrationForm({
  trip,
  user,
  onClose,
  onSubmit,
}: RegistrationFormProps) {
  const [step, setStep] = useState(1);
  const [roomType, setRoomType] = useState("double");
  const [mealPreference, setMealPreference] = useState("normal");
  const [seatPreference, setSeatPreference] = useState<string>("");
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [companions, setCompanions] = useState<
    { name: string; relationship: string; age?: number }[]
  >([]);

  const calculateSubsidy = () => {
    if (trip.subsidyType === "fixed") {
      return Math.min(trip.subsidyAmount, trip.price, user.maxSubsidy);
    }
    return Math.min((trip.price * trip.subsidyAmount) / 100, trip.maxSubsidy);
  };

  const subsidy = calculateSubsidy();
  const selfPay = trip.price - subsidy;

  const addCompanion = useCallback(() => {
    setCompanions((prev) => [...prev, { name: "", relationship: "spouse" }]);
  }, []);

  const removeCompanion = useCallback((index: number) => {
    setCompanions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCompanionChange = useCallback(
    (index: number, field: keyof (typeof companions)[0], value: string) => {
      setCompanions((prev) =>
        prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
      );
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    onSubmit({
      tripId: trip.id,
      participantCount: 1 + companions.length,
      participants: [],
      roomType,
      mealPreference,
      seatPreference,
      specialNeeds,
      companions: companions.map(c => ({ name: c.name, relation: c.relationship })),
    });
  }, [
    trip.id,
    roomType,
    mealPreference,
    seatPreference,
    specialNeeds,
    companions,
    onSubmit,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-brand-900/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-gray-900">報名登記</h2>
            <p className="text-sm text-gray-500">步驟 {step}/3</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-4 py-2">
          <div className="flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  s <= step ? "bg-brand-600" : "bg-gray-200",
                )}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {step === 1 && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900">{trip.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {trip.destination} · {trip.startDate} ~ {trip.endDate}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  房型選擇
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "single", label: "單人房", icon: User },
                    { value: "double", label: "雙人房", icon: Users },
                    { value: "family", label: "家庭房", icon: Home },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setRoomType(value)}
                      className={cn(
                        "p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition-all",
                        roomType === value
                          ? "border-brand-600 bg-brand-50 text-brand-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-700",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5",
                          roomType === value
                            ? "text-brand-600"
                            : "text-gray-500",
                        )}
                      />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  餐食偏好
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "normal", label: "一般餐食" },
                    { value: "vegetarian", label: "素食" },
                    { value: "halal", label: "清真" },
                    { value: "other", label: "其他" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setMealPreference(value)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all",
                        mealPreference === value
                          ? "border-brand-600 bg-brand-50 text-brand-600"
                          : "border-gray-200 text-gray-700 hover:border-gray-300",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  座位偏好（選填）
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "window", label: "靠窗", icon: "🪟" },
                    { value: "aisle", label: "靠走道", icon: "🚶" },
                    { value: "front", label: "前排", icon: "⬆️" },
                    { value: "back", label: "後排", icon: "⬇️" },
                    { value: "no_preference", label: "無偏好", icon: "➖" },
                  ].map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSeatPreference(value)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2",
                        seatPreference === value
                          ? "border-brand-600 bg-brand-50 text-brand-600"
                          : "border-gray-200 text-gray-700 hover:border-gray-300",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                      )}
                    >
                      <span>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  系統將盡量依您的偏好安排座位
                </p>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    同行親友
                  </label>
                  <button
                    onClick={addCompanion}
                    className="text-sm text-brand-600 font-medium flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 rounded-md"
                  >
                    <Plus className="w-4 h-4" /> 新增
                  </button>
                </div>
                {companions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6 bg-gray-50 rounded-lg">
                    尚未新增同行者
                  </p>
                ) : (
                  <div className="space-y-3">
                    {companions.map((c, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            同行者 {i + 1}
                          </span>
                          <button
                            onClick={() => removeCompanion(i)}
                            className="text-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 rounded-md"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="姓名"
                          value={c.name}
                          onChange={(e) =>
                            handleCompanionChange(i, "name", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                        />
                        <select
                          value={c.relationship}
                          onChange={(e) =>
                            handleCompanionChange(
                              i,
                              "relationship",
                              e.target.value,
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                        >
                          <option value="spouse">配偶</option>
                          <option value="child">子女</option>
                          <option value="parent">父母</option>
                          <option value="other">其他親友</option>
                        </select>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  特殊需求
                </label>
                <textarea
                  value={specialNeeds}
                  onChange={(e) => setSpecialNeeds(e.target.value)}
                  placeholder="如：輪椅協助、過敏食物、其他需求..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4">
                <h4 className="font-semibold text-brand-900 mb-3">報名確認</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-brand-700">行程</span>
                    <span className="text-brand-900 font-medium">
                      {trip.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-700">房型</span>
                    <span className="text-brand-900 font-medium">
                      {roomType === "single" && "單人房"}
                      {roomType === "double" && "雙人房"}
                      {roomType === "family" && "家庭房"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-700">餐食</span>
                    <span className="text-brand-900 font-medium">
                      {mealPreference === "normal" && "一般餐食"}
                      {mealPreference === "vegetarian" && "素食"}
                      {mealPreference === "halal" && "清真"}
                      {mealPreference === "other" && "其他"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-700">座位偏好</span>
                    <span className="text-brand-900 font-medium">
                      {seatPreference === "window" && "靠窗"}
                      {seatPreference === "aisle" && "靠走道"}
                      {seatPreference === "front" && "前排"}
                      {seatPreference === "back" && "後排"}
                      {seatPreference === "no_preference" && "無偏好"}
                      {!seatPreference && "未選擇"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-700">同行者</span>
                    <span className="text-brand-900 font-medium">
                      {companions.length > 0
                        ? companions.map((c) => c.name).join(", ")
                        : "無"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">行程費用</span>
                  <span className="font-medium">
                    NT${trip.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">公司補助</span>
                  <span className="font-medium text-green-600">
                    -NT${subsidy.toLocaleString()}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-medium text-gray-900">自付金額</span>
                  <span className="text-xl font-bold text-brand-600">
                    NT${selfPay.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  報名後需待福委會審核，審核通過後將收到確認通知。自付金額將於出發前統一收取。
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 active:bg-gray-200"
            >
              上一步
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 active:bg-brand-800"
            >
              下一步
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 active:bg-brand-800"
            >
              確認報名
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function MyTripsTab({ registrations }: MyTripsTabProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "審核中", color: "bg-warning/10 text-warning" };
      case "approved":
        return { label: "已通過", color: "bg-success/10 text-success" };
      case "confirmed":
        return { label: "已確認", color: "bg-brand-100 text-brand-700" };
      case "completed":
        return { label: "已完成", color: "bg-gray-100 text-gray-600" };
      default:
        return { label: "未知", color: "bg-gray-100 text-gray-600" };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">我的行程</h1>
        <p className="text-gray-500 mt-1">查看報名記錄與狀態</p>
      </div>

      {registrations.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">尚無報名記錄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registrations.map((reg) => {
            const status = getStatusConfig(reg.status);
            return (
              <div
                key={reg.id}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div className="relative h-32">
                  <img
                    src={reg.image}
                    alt={reg.tripName}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-sm font-semibold",
                        status.color,
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 text-white">
                    <h3 className="font-bold">{reg.tripName}</h3>
                    <p className="text-sm text-white/80">
                      {reg.startDate} ~ {reg.endDate}
                    </p>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">房型</p>
                      <p className="font-medium">{reg.roomType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">同行者</p>
                      <p className="font-medium">
                        {reg.companions.length > 0
                          ? reg.companions.map((c) => c.name).join(", ")
                          : "無"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">公司補助</p>
                      <p className="font-medium text-green-600">
                        NT${reg.subsidyAmount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">自付金額</p>
                      <p className="font-medium text-brand-600">
                        NT${reg.selfPay.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {reg.specialNeeds && (
                    <div className="bg-orange-50 rounded-lg p-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-orange-700">
                        特殊需求：{reg.specialNeeds}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="secondary"
                      className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                    >
                      <Download className="w-4 h-4" />
                      下載行程表
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 py-2 bg-brand-100 text-brand-700 rounded-lg text-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      查看詳情
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NotificationsTab({ notifications, onMarkRead }: NotificationsTabProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case "success":
        return { icon: CheckCircle, color: "text-success bg-success/10" };
      case "warning":
        return { icon: AlertCircle, color: "text-warning bg-warning/10" };
      case "info":
        return { icon: Info, color: "text-brand-600 bg-brand-100" };
      default:
        return { icon: Bell, color: "text-gray-600 bg-gray-100" };
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
        <p className="text-gray-500 mt-1">接收行程更新與重要通知</p>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">沒有新通知</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const config = getTypeConfig(notif.type);
            const Icon = config.icon;
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "bg-white rounded-lg border p-4 cursor-pointer",
                  notif.read
                    ? "border-gray-100"
                    : "border-brand-200 bg-brand-50/30",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
                )}
                role="button"
                tabIndex={0}
                onClick={() => !notif.read && onMarkRead(notif.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    !notif.read && onMarkRead(notif.id);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      config.color,
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 bg-brand-600 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {notif.message}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">{notif.date}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FeedbackTab({}: FeedbackTabProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = useCallback(() => {
    setSubmitted(true);
    // In a real app, this would send data to an API
  }, []);

  if (submitted) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">感謝您的回饋！</h2>
        <p className="text-gray-500">您的意見將幫助我們提供更好的服務</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">意見回饋</h1>
        <p className="text-gray-500 mt-1">填寫滿意度調查</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">北海道冬季雪祭</h3>
          <p className="text-sm text-gray-500">2024-02-01 ~ 2024-02-06</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            整體滿意度
          </label>
          <div className="flex gap-2 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300 rounded-md"
              >
                <Star
                  className={cn(
                    "w-10 h-10 transition-colors",
                    n <= rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300",
                  )}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            {rating === 0 && "點擊星星評分"}
            {rating === 1 && "非常不滿意"}
            {rating === 2 && "不滿意"}
            {rating === 3 && "普通"}
            {rating === 4 && "滿意"}
            {rating === 5 && "非常滿意"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            您的建議（選填）
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="請分享您的旅遊體驗與改善建議..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={rating === 0}
          className={cn(
            "w-full py-3 rounded-lg font-semibold transition-colors",
            rating > 0
              ? "bg-brand-600 text-white hover:bg-brand-700"
              : "bg-gray-200 text-gray-500 cursor-not-allowed",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 active:bg-brand-800",
          )}
        >
          提交回饋
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Component (Widget Container)
// ============================================

export default function TravelerApp({
  initialUser,
  initialAvailableTrips,
  initialMyRegistrations,
  initialNotifications,
}: TravelerAppConfig) {
  const [activeTab, setActiveTab] = useState<TabKey>("home");
  const [user] = useState<UserProfile>(initialUser);
  const [availableTrips] = useState<AvailableTrip[]>(initialAvailableTrips);
  const [registrations, setRegistrations] =
    useState<MyRegistration[]>(initialMyRegistrations);
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const selectedTrip = availableTrips.find((t) => t.id === selectedTripId);

  const handleRegister = useCallback((tripId: string) => {
    setSelectedTripId(tripId);
    setShowRegistration(true);
  }, []);

  const handleRegistrationSubmit = useCallback(
    (data: RegistrationFormData) => {
      const trip = availableTrips.find((t) => t.id === data.tripId);
      if (!trip) return;

      const newRegistration: MyRegistration = {
        id: `r${Date.now()}`,
        tripId: trip.id,
        tripTitle: trip.title,
        tripName: trip.name,
        destination: trip.destination,
        registrationDate: new Date().toISOString().split("T")[0],
        startDate: trip.startDate,
        endDate: trip.endDate,
        image: trip.image,
        status: "pending", // Initial status
        participantCount: data.participantCount || 1,
        totalPrice: trip.price,
        roomType:
          data.roomType === "single"
            ? "單人房"
            : data.roomType === "double"
              ? "雙人房"
              : "家庭房",
        companions: data.companions,
        subsidyAmount:
          trip.subsidyType === "fixed"
            ? Math.min(trip.subsidyAmount, user.maxSubsidy, trip.price)
            : Math.min((trip.price * trip.subsidyAmount) / 100, user.maxSubsidy),
        selfPay:
          trip.price -
          (trip.subsidyType === "fixed"
            ? Math.min(trip.subsidyAmount, user.maxSubsidy, trip.price)
            : Math.min((trip.price * trip.subsidyAmount) / 100, user.maxSubsidy)),
        specialNeeds: data.specialNeeds,
      };

      setRegistrations((prev) => [...prev, newRegistration]);
      setShowRegistration(false);
      setSelectedTripId(null);
      setActiveTab("mytrips");
    },
    [availableTrips, user.maxSubsidy],
  );

  const handleMarkNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  return (
    // Standard Card structure for a Kintone Widget
    <div className="relative h-full w-full rounded-2xl bg-white shadow-lg border border-gray-200 overflow-hidden">
      {/* Drag Handle - A transparent area at the top for dragging the widget */}
      <div className="drag-handle absolute top-0 left-0 right-0 h-8 rounded-t-2xl cursor-grab bg-transparent z-10" />

      {/* Optional: Widget Header for title, positioned above content */}
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-4 z-10">
        <h2 className="text-sm font-semibold text-gray-700">員工旅遊申請</h2>
      </div>

      {/* Main Content Area - Scrollable, offset by header/drag handle height */}
      <main className="pt-10 pb-20 p-4 max-w-lg mx-auto h-full overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full" // Ensure motion div takes full height for content
          >
            {activeTab === "home" && (
              <HomeTab
                user={user}
                registrations={registrations}
                notifications={notifications}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === "explore" && (
              <ExploreTab
                trips={availableTrips}
                user={user}
                onRegister={handleRegister}
              />
            )}
            {activeTab === "mytrips" && (
              <MyTripsTab registrations={registrations} />
            )}
            {activeTab === "notifications" && (
              <NotificationsTab
                notifications={notifications}
                onMarkRead={handleMarkNotificationRead}
              />
            )}
            {activeTab === "feedback" && <FeedbackTab />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Bar */}
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        notificationCount={unreadCount}
      />

      {/* Registration Modal */}
      <AnimatePresence>
        {showRegistration && selectedTrip && (
          <RegistrationForm
            trip={selectedTrip}
            user={user}
            onClose={() => {
              setShowRegistration(false);
              setSelectedTripId(null);
            }}
            onSubmit={handleRegistrationSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}