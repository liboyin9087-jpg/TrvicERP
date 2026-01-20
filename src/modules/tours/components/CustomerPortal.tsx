import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, MapPin, Users, Clock, DollarSign, Upload, FileText,
  CheckCircle, AlertCircle, ChevronRight, Star, Heart, Share2,
  Phone, Mail, CreditCard, Shield, Plane, Hotel, Utensils,
  Camera, Download, Eye, X, Search, Filter, ArrowRight
} from 'lucide-react';

// Types
interface TourPackage {
  id: string;
  name: string;
  destination: string;
  duration: number;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  highlights: string[];
  departureDates: DepartureDate[];
  included: string[];
  excluded: string[];
  category: 'domestic' | 'international' | 'cruise' | 'adventure';
  minGroup: number;
  maxGroup: number;
  status: 'open' | 'guaranteed' | 'full' | 'closed';
  earlyBirdDiscount?: number;
  groupDiscount?: number;
}

interface DepartureDate {
  id: string;
  date: string;
  availableSeats: number;
  totalSeats: number;
  status: 'open' | 'guaranteed' | 'full';
  price: number;
}

interface Booking {
  id: string;
  tourName: string;
  departureDate: string;
  status: 'pending' | 'confirmed' | 'paid' | 'completed' | 'cancelled';
  totalAmount: number;
  paidAmount: number;
  passengers: number;
  createdAt: string;
}

interface Document {
  id: string;
  name: string;
  type: 'passport' | 'visa' | 'insurance' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: string;
  expiryDate?: string;
}

// Mock Data
const mockTours: TourPackage[] = [
  {
    id: '1',
    name: '日本東京五日遊',
    destination: '日本東京',
    duration: 5,
    price: 32900,
    originalPrice: 38900,
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800',
    rating: 4.8,
    reviews: 128,
    highlights: ['淺草寺', '東京鐵塔', '迪士尼樂園', '新宿購物'],
    departureDates: [
      { id: 'd1', date: '2024-03-15', availableSeats: 12, totalSeats: 30, status: 'open', price: 32900 },
      { id: 'd2', date: '2024-03-22', availableSeats: 5, totalSeats: 30, status: 'guaranteed', price: 33900 },
      { id: 'd3', date: '2024-03-29', availableSeats: 0, totalSeats: 30, status: 'full', price: 34900 },
    ],
    included: ['來回機票', '四星飯店住宿', '每日早餐', '專業導遊', '旅遊保險'],
    excluded: ['個人消費', '簽證費用', '小費'],
    category: 'international',
    minGroup: 16,
    maxGroup: 30,
    status: 'guaranteed',
    earlyBirdDiscount: 2000,
    groupDiscount: 500,
  },
  {
    id: '2',
    name: '韓國首爾四日遊',
    destination: '韓國首爾',
    duration: 4,
    price: 18900,
    image: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=800',
    rating: 4.6,
    reviews: 89,
    highlights: ['景福宮', '明洞購物', '北村韓屋村', 'N首爾塔'],
    departureDates: [
      { id: 'd4', date: '2024-03-10', availableSeats: 20, totalSeats: 25, status: 'open', price: 18900 },
      { id: 'd5', date: '2024-03-17', availableSeats: 8, totalSeats: 25, status: 'guaranteed', price: 19500 },
    ],
    included: ['來回機票', '三星飯店住宿', '每日早餐', '專業導遊'],
    excluded: ['個人消費', '午晚餐', '小費'],
    category: 'international',
    minGroup: 10,
    maxGroup: 25,
    status: 'open',
  },
  {
    id: '3',
    name: '台灣環島七日遊',
    destination: '台灣全島',
    duration: 7,
    price: 25800,
    image: 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800',
    rating: 4.9,
    reviews: 256,
    highlights: ['太魯閣', '日月潭', '阿里山', '墾丁'],
    departureDates: [
      { id: 'd6', date: '2024-03-08', availableSeats: 15, totalSeats: 40, status: 'open', price: 25800 },
    ],
    included: ['遊覽車', '六晚住宿', '每日三餐', '門票', '導遊小費'],
    excluded: ['個人消費', '自費活動'],
    category: 'domestic',
    minGroup: 20,
    maxGroup: 40,
    status: 'open',
  },
];

const mockBookings: Booking[] = [
  {
    id: 'B001',
    tourName: '日本東京五日遊',
    departureDate: '2024-03-22',
    status: 'confirmed',
    totalAmount: 65800,
    paidAmount: 20000,
    passengers: 2,
    createdAt: '2024-02-15',
  },
  {
    id: 'B002',
    tourName: '韓國首爾四日遊',
    departureDate: '2024-04-10',
    status: 'pending',
    totalAmount: 37800,
    paidAmount: 0,
    passengers: 2,
    createdAt: '2024-02-20',
  },
];

const mockDocuments: Document[] = [
  { id: 'doc1', name: '護照 - 王小明', type: 'passport', status: 'approved', uploadedAt: '2024-02-10', expiryDate: '2028-05-15' },
  { id: 'doc2', name: '護照 - 王小華', type: 'passport', status: 'pending', uploadedAt: '2024-02-18' },
  { id: 'doc3', name: '旅遊保險單', type: 'insurance', status: 'approved', uploadedAt: '2024-02-15' },
];

// Components
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    open: 'bg-green-100 text-green-700',
    guaranteed: 'bg-blue-100 text-blue-700',
    full: 'bg-red-100 text-red-700',
    closed: 'bg-gray-100 text-gray-700',
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-blue-100 text-blue-700',
    paid: 'bg-green-100 text-green-700',
    completed: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-red-100 text-red-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  const labels: Record<string, string> = {
    open: '報名中',
    guaranteed: '確定成團',
    full: '已額滿',
    closed: '已截止',
    pending: '待確認',
    confirmed: '已確認',
    paid: '已付清',
    completed: '已完成',
    cancelled: '已取消',
    approved: '已審核',
    rejected: '已拒絕',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {labels[status] || status}
    </span>
  );
};

// Tour Card Component
const TourCard = ({ tour, onSelect }: { tour: TourPackage; onSelect: (tour: TourPackage) => void }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group cursor-pointer"
      onClick={() => onSelect(tour)}
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={tour.image}
          alt={tour.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <StatusBadge status={tour.status} />
          {tour.earlyBirdDiscount && (
            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              早鳥優惠
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-sm">
          <Clock className="w-3 h-3" />
          <span>{tour.duration} 天</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
              {tour.name}
            </h3>
            <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
              <MapPin className="w-3 h-3" />
              <span>{tour.destination}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{tour.rating}</span>
          </div>
          <span className="text-slate-300">|</span>
          <span className="text-sm text-slate-500">{tour.reviews} 則評價</span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {tour.highlights.slice(0, 3).map((h, i) => (
            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              {h}
            </span>
          ))}
        </div>

        <div className="flex items-end justify-between pt-3 border-t border-slate-100">
          <div>
            {tour.originalPrice && (
              <span className="text-sm text-slate-400 line-through">
                NT$ {tour.originalPrice.toLocaleString()}
              </span>
            )}
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-indigo-600">
                NT$ {tour.price.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">起 / 人</span>
            </div>
          </div>
          <button className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            查看詳情 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Tour Detail Modal
const TourDetailModal = ({
  tour,
  onClose,
  onBook
}: {
  tour: TourPackage;
  onClose: () => void;
  onBook: (tourId: string, dateId: string) => void;
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'included'>('overview');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className="relative h-64">
          <img src={tour.image} alt={tour.name} className="w-full h-full object-cover" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white">{tour.name}</h2>
            <div className="flex items-center gap-4 mt-2 text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {tour.destination}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {tour.duration} 天
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" /> {tour.minGroup}-{tour.maxGroup} 人
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
          {/* Tabs */}
          <div className="flex gap-4 border-b border-slate-200 mb-6">
            {[
              { id: 'overview', label: '行程概覽' },
              { id: 'itinerary', label: '每日行程' },
              { id: 'included', label: '費用說明' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Highlights */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">行程亮點</h3>
                <div className="grid grid-cols-2 gap-2">
                  {tour.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              {/* Departure Dates */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">出發日期</h3>
                <div className="space-y-2">
                  {tour.departureDates.map((date) => (
                    <div
                      key={date.id}
                      onClick={() => date.status !== 'full' && setSelectedDate(date.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedDate === date.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : date.status === 'full'
                          ? 'border-slate-200 bg-slate-50 opacity-50 cursor-not-allowed'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium text-slate-900">
                            {new Date(date.date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Date(date.date).toLocaleDateString('zh-TW', { weekday: 'short' })}
                          </div>
                        </div>
                        <StatusBadge status={date.status} />
                        <span className="text-sm text-slate-500">
                          剩餘 {date.availableSeats} 位
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-indigo-600">
                          NT$ {date.price.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">/人</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'included' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  費用包含
                </h3>
                <ul className="space-y-2">
                  {tour.included.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <X className="w-5 h-5 text-red-500" />
                  費用不含
                </h3>
                <ul className="space-y-2">
                  {tour.excluded.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">每人價格</div>
            <div className="text-2xl font-bold text-indigo-600">
              NT$ {tour.price.toLocaleString()}
              <span className="text-sm font-normal text-slate-500"> 起</span>
            </div>
          </div>
          <button
            onClick={() => selectedDate && onBook(tour.id, selectedDate)}
            disabled={!selectedDate}
            className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {selectedDate ? '立即報名' : '請選擇出發日期'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Booking Form Modal
const BookingFormModal = ({
  tour,
  dateId,
  onClose,
  onSubmit
}: {
  tour: TourPackage;
  dateId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) => {
  const selectedDate = tour.departureDates.find(d => d.id === dateId);
  const [passengers, setPassengers] = useState(1);
  const [formData, setFormData] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    specialRequests: '',
  });

  const totalPrice = selectedDate ? selectedDate.price * passengers : 0;
  const deposit = Math.ceil(totalPrice * 0.3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">線上報名</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tour Summary */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900">{tour.name}</h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {selectedDate && new Date(selectedDate.date).toLocaleDateString('zh-TW')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {tour.duration} 天
              </span>
            </div>
          </div>

          {/* Passengers */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">報名人數</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPassengers(Math.max(1, passengers - 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                -
              </button>
              <span className="w-12 text-center text-lg font-semibold">{passengers}</span>
              <button
                onClick={() => setPassengers(Math.min(selectedDate?.availableSeats || 10, passengers + 1))}
                className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50"
              >
                +
              </button>
              <span className="text-sm text-slate-500">
                (剩餘 {selectedDate?.availableSeats} 位)
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900">聯絡資訊</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">聯絡人姓名</label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="請輸入姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">聯絡電話</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0912-345-678"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">電子信箱</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="example@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">特殊需求</label>
              <textarea
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                placeholder="素食、輪椅、嬰兒座椅等需求..."
              />
            </div>
          </div>

          {/* Price Summary */}
          <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">團費 x {passengers} 人</span>
              <span className="text-slate-900">NT$ {totalPrice.toLocaleString()}</span>
            </div>
            {tour.earlyBirdDiscount && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600">早鳥優惠</span>
                <span className="text-green-600">-NT$ {(tour.earlyBirdDiscount * passengers).toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t border-indigo-200 flex justify-between">
              <span className="font-semibold text-slate-900">總金額</span>
              <span className="font-bold text-xl text-indigo-600">
                NT$ {(totalPrice - (tour.earlyBirdDiscount || 0) * passengers).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm text-slate-600">
              <span>訂金 (30%)</span>
              <span>NT$ {deposit.toLocaleString()}</span>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2">
            <input type="checkbox" id="terms" className="mt-1" />
            <label htmlFor="terms" className="text-sm text-slate-600">
              我已閱讀並同意
              <a href="#" className="text-indigo-600 hover:underline">報名須知</a>
              及
              <a href="#" className="text-indigo-600 hover:underline">取消條款</a>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-slate-200 rounded-lg hover:bg-white transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => onSubmit({ ...formData, passengers, tourId: tour.id, dateId })}
            className="flex-1 px-4 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            確認報名
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// My Bookings Component
const MyBookings = ({ bookings }: { bookings: Booking[] }) => {
  return (
    <div className="space-y-4">
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">尚無任何預訂</p>
        </div>
      ) : (
        bookings.map((booking) => (
          <div key={booking.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900">{booking.tourName}</h3>
                <p className="text-sm text-slate-500 mt-1">
                  訂單編號: {booking.id} | 出發日期: {booking.departureDate}
                </p>
              </div>
              <StatusBadge status={booking.status} />
            </div>

            <div className="grid grid-cols-3 gap-4 py-3 border-t border-slate-100">
              <div>
                <div className="text-xs text-slate-500">旅客人數</div>
                <div className="font-semibold">{booking.passengers} 人</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">總金額</div>
                <div className="font-semibold">NT$ {booking.totalAmount.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">已付金額</div>
                <div className="font-semibold text-green-600">NT$ {booking.paidAmount.toLocaleString()}</div>
              </div>
            </div>

            {booking.paidAmount < booking.totalAmount && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-sm text-orange-600">
                  尚餘 NT$ {(booking.totalAmount - booking.paidAmount).toLocaleString()} 待付
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700">
                  立即付款
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// My Documents Component
const MyDocuments = ({ documents }: { documents: Document[] }) => {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <p className="text-slate-600 mb-1">拖曳檔案至此或</p>
        <button className="text-indigo-600 font-medium hover:underline">點擊上傳</button>
        <p className="text-xs text-slate-400 mt-2">支援 PDF, JPG, PNG (最大 10MB)</p>
      </div>

      {/* Document List */}
      <div className="space-y-2">
        {documents.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                doc.type === 'passport' ? 'bg-blue-100 text-blue-600' :
                doc.type === 'visa' ? 'bg-purple-100 text-purple-600' :
                doc.type === 'insurance' ? 'bg-green-100 text-green-600' :
                'bg-slate-100 text-slate-600'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="font-medium text-slate-900">{doc.name}</div>
                <div className="text-xs text-slate-500">
                  上傳於 {doc.uploadedAt}
                  {doc.expiryDate && ` | 效期至 ${doc.expiryDate}`}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={doc.status} />
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <Eye className="w-4 h-4 text-slate-500" />
              </button>
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <Download className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Customer Portal Component
export default function CustomerPortal() {
  const [activeTab, setActiveTab] = useState<'tours' | 'bookings' | 'documents'>('tours');
  const [selectedTour, setSelectedTour] = useState<TourPackage | null>(null);
  const [bookingTour, setBookingTour] = useState<{ tour: TourPackage; dateId: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTours = mockTours.filter((tour) => {
    const matchesSearch = tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tour.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleBook = (tourId: string, dateId: string) => {
    const tour = mockTours.find(t => t.id === tourId);
    if (tour) {
      setSelectedTour(null);
      setBookingTour({ tour, dateId });
    }
  };

  const handleSubmitBooking = (data: any) => {
    console.log('Booking submitted:', data);
    setBookingTour(null);
    setActiveTab('bookings');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Plane className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">TrvicERP</span>
            </div>

            <nav className="flex items-center gap-1">
              {[
                { id: 'tours', label: '探索行程', icon: MapPin },
                { id: 'bookings', label: '我的預訂', icon: Calendar },
                { id: 'documents', label: '文件管理', icon: FileText },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-100 rounded-lg">
                <Phone className="w-5 h-5 text-slate-500" />
              </button>
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-medium text-indigo-600">王</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'tours' && (
          <>
            {/* Search & Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜尋行程或目的地..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: '全部' },
                  { id: 'domestic', label: '國內' },
                  { id: 'international', label: '國外' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      categoryFilter === cat.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tour Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTours.map((tour) => (
                <TourCard key={tour.id} tour={tour} onSelect={setSelectedTour} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">我的預訂</h2>
            <MyBookings bookings={mockBookings} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">文件管理</h2>
            <MyDocuments documents={mockDocuments} />
          </div>
        )}
      </main>

      {/* Modals */}
      <AnimatePresence>
        {selectedTour && (
          <TourDetailModal
            tour={selectedTour}
            onClose={() => setSelectedTour(null)}
            onBook={handleBook}
          />
        )}
        {bookingTour && (
          <BookingFormModal
            tour={bookingTour.tour}
            dateId={bookingTour.dateId}
            onClose={() => setBookingTour(null)}
            onSubmit={handleSubmitBooking}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
