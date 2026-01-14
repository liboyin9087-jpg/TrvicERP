
import { 
  LayoutDashboard, Plane, Users, Building2, FileText, 
  Settings, Calculator, Briefcase, Smartphone, ShieldCheck, 
  Vote, MessageCircle, Map, BarChart3, Clock, FileSignature, 
  Truck, ClipboardList, Wallet
} from 'lucide-react';

export const MENU_ITEMS = [
  {
    label: '概述',
    items: [
      { name: '儀表板', icon: LayoutDashboard, view: 'erp-insights' },
    ]
  },
  {
    label: '核心營運',
    items: [
      { 
        name: '旅行 (行程)', 
        icon: Plane, 
        children: [
          { name: '所有系列', view: 'planner' },
          { name: '活躍會話', view: 'sessions' },
        ] 
      },
      { name: '預訂 (訂單)', icon: ClipboardList, view: 'payments' },
      { name: '旅行者 (客戶)', icon: Users, view: 'crm' },
    ]
  },
  {
    label: '供應鏈',
    items: [
      { name: '保險 (保險)', icon: ShieldCheck, view: 'insurance' },
      { name: '報價單 (報價)', icon: Calculator, view: 'quotation' },
    ]
  },
  {
    label: '管理',
    items: [
      { name: '營運中心', icon: FileSignature, view: 'operation-hub' },
      { name: '後勤', icon: Truck, view: 'logistics' },
    ]
  }
];

export const CLIENT_MENU_ITEMS = [
  {
    label: '旅客體驗',
    items: [
      { name: 'Traveler App', icon: Smartphone, view: 'traveler-app' },
      { name: '數位手冊', icon: FileText, view: 'briefing' },
      { name: '行程票選', icon: Vote, view: 'voting' },
      { name: '福委會戰情室', icon: ShieldCheck, view: 'welfare-dashboard' },
    ]
  }
];
