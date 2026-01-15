import type { TourSession, Booking, PublicTourData, LineChatLog, CompanyBudget, Poll, PollOption, ChangeRequest, Incident, TourOption, UserFootprint } from '../../../types';

const MOCK_TOUR_OPTIONS: TourOption[] = [
    { id: 'opt_fit_1', session_id: 's_demo', day_number: 3, title: '札幌啤酒博物館 & 螃蟹大餐', description: '參觀歷史悠久的啤酒廠，晚餐享受北海道三大蟹吃到飽。', price_add_on: 2500, capacity_limit: 20, quota_used: 12, image_url: 'https://picsum.photos/300/200?random=50' },
    { id: 'opt_fit_2', session_id: 's_demo', day_number: 4, title: '小樽運河手作音樂盒體驗', description: '專業老師帶領製作專屬音樂盒，含小樽甜點午茶券。', price_add_on: 1200, capacity_limit: 15, quota_used: 5, image_url: 'https://picsum.photos/300/200?random=51' },
    { id: 'opt_fit_3', session_id: 's_demo', day_number: 5, title: '千歲 Outlet Rera 購物巡禮', description: '免費接駁車服務，含 500 日圓折價券。', price_add_on: 0, capacity_limit: 40, quota_used: 28, image_url: 'https://picsum.photos/300/200?random=52' },
];

const MOCK_FOOTPRINT: UserFootprint = {
    user_id: 'me',
    email: 'traveler@foxconn.com',
    visited_countries: ['JP', 'TH', 'VN', 'SG', 'KR'],
    trip_count: 8
};

const MOCK_PUBLIC_TOUR: PublicTourData = {
    id: 't1',
    title: '北海道絕景五日遊',
    days: 5,
    base_price: 39900,
    cover_image: 'https://picsum.photos/800/400?random=10',
    description: '嚴選北海道道央主要景點，包含小樽運河、富良野花田。\n特別安排入住星野度假村，享受奢華一泊二食。',
    share_token: 'share-123',
    itinerary_json: [
        {
            hotel: 'Sapporo Grand Hotel',
            points: [
                { time: '09:00', name: '新千歲機場集合', desc: '專車接送前往市區', image: 'https://picsum.photos/200/200?random=11' },
                { time: '14:00', name: '小樽運河散策', desc: '感受異國情調的浪漫運河', image: 'https://picsum.photos/200/200?random=12' }
            ]
        },
        {
            hotel: 'Hoshino Resorts TOMAMU',
            points: [
                { time: '10:00', name: '富良野花田', desc: '欣賞七彩花海', image: 'https://picsum.photos/200/200?random=13' },
                { time: '16:00', name: '入住星野度假村', desc: '享受渡假村設施' }
            ]
        }
    ]
};

const MOCK_UNPAID_BOOKINGS: Booking[] = [
    { id: 'b_u1', session_id: 's_demo', user_id: 'u1', customer_name: 'Wang Xiao-Ming', total_amount: 39900, status: 'pending_payment', email: 'wang@example.com' },
    { id: 'b_u2', session_id: 's_demo', user_id: 'u2', customer_name: 'Chen Da-Wen', total_amount: 79800, status: 'verifying', email: 'chen@example.com', payment_proof_url: 'mock_proof.jpg' },
];

const MOCK_COMPANY_BUDGET: CompanyBudget = {
    id: 'comp_1',
    company_name: '鴻海科技集團 (Foxconn)',
    total_budget: 5000000,
    used_budget: 4150000, 
    last_updated: new Date().toISOString()
};

const MOCK_POLLS: Poll[] = [
    { 
        id: 'poll_1', 
        title: '2025 年度員工旅遊地點票選', 
        description: '請大家踴躍投票，結果將作為福委會最終採購依據。本投票採「匿名盲選」制，避免人情壓力。',
        deadline: '2024-12-31', 
        status: 'active',
        total_votes: 156,
        ai_summary: '根據目前的投票趨勢，超過 60% 的員工傾向選擇「北海道滑雪」行程，主要考量為「獨特性」與「公司全額補助」。建議福委會優先與旅行社洽談 1/15 出發之團體機位。'
    }
];

const MOCK_POLL_OPTIONS: PollOption[] = [
    { id: 'opt_1', poll_id: 'poll_1', text: '日本北海道滑雪五日', image_url: 'https://picsum.photos/300/200?random=20', tags: ['預算 5萬', '免請假'], vote_count: 98, is_winner: true },
    { id: 'opt_2', poll_id: 'poll_1', text: '泰國曼谷渡假五日', image_url: 'https://picsum.photos/300/200?random=21', tags: ['預算 3萬', '需請假3天'], vote_count: 42 },
    { id: 'opt_3', poll_id: 'poll_1', text: '國內環島豪華列車', image_url: 'https://picsum.photos/300/200?random=22', tags: ['預算 2萬', '親子友善'], vote_count: 16 },
];

const MOCK_CHANGE_REQUESTS: ChangeRequest[] = [
    {
        id: 'cr_1',
        requester_name: '福委會 - 陳經理',
        category: 'meal',
        description: 'D2 晚餐原定飯店自助餐，希望能改成當地的居酒屋，讓大家體驗一下氣氛。預算可微調。',
        status: 'op_review',
        cost_impact: 0, 
        created_at: new Date(Date.now() - 86400000).toISOString()
    }
];

const MOCK_INCIDENTS: Incident[] = [
    {
        id: 'inc_1',
        title: '北海道大雪影響行程',
        severity: 'high',
        status_message: '目前新千歲機場暫時關閉，全團已帶回飯店休息，預計明日 10:00 重新確認航班。全員平安。',
        timestamp: new Date().toISOString(),
        is_active: true
    }
];

class MockSupabase {
  private listeners: Record<string, Function[]> = {};
  private receiptCounter = 1;
  private lineLogs: LineChatLog[] = [];
  private changeRequests: ChangeRequest[] = MOCK_CHANGE_REQUESTS;
  private incidents: Incident[] = MOCK_INCIDENTS;
  private bookings: Booking[] = MOCK_UNPAID_BOOKINGS;

  from(table: string) {
    let filters: Record<string, any> = {};
    let isSingle = false;
    let pendingOp: 'select' | 'insert' | 'update' = 'select';
    let pendingData: any = null;

    const execute = async () => {
        let data: any = [];
        let error = null;

        if (pendingOp === 'insert') {
            if (table === 'booking_selections') {
                return { data: pendingData, error: null };
            }
            if (table === 'change_requests') {
                const newItem = { ...pendingData, id: Math.random().toString(), status: 'pending', created_at: new Date().toISOString() };
                this.changeRequests.unshift(newItem);
                return { data: [newItem], error: null };
            }
            if (table === 'incidents') {
                const newItem = { ...pendingData, id: Math.random().toString(), timestamp: new Date().toISOString(), is_active: true };
                this.incidents.unshift(newItem);
                return { data: [newItem], error: null };
            }
            if (table === 'line_chat_logs') {
                const newLog = { ...pendingData, id: Math.random().toString(), timestamp: new Date().toISOString() };
                this.lineLogs.unshift(newLog); 
                this.emit('line_chat_update', newLog);
                return { error: null };
            }
            if (table === 'poll_votes') {
                const option = MOCK_POLL_OPTIONS.find(o => o.id === pendingData.option_id);
                if (option) option.vote_count++;
                return { error: null };
            }
            if (table === 'bookings') {
                const newItem = { ...pendingData, id: 'b_new_' + Math.random().toString(36).substr(2, 5) };
                this.bookings.push(newItem);
                return { data: [newItem], error: null };
            }
            return { data: pendingData, error: null };
        }

        if (pendingOp === 'update') {
            if (table === 'change_requests' && filters['id']) {
                this.changeRequests = this.changeRequests.map(r => r.id === filters['id'] ? { ...r, ...pendingData } : r);
            }
            if (table === 'bookings' && filters['id']) {
                this.bookings = this.bookings.map(b => b.id === filters['id'] ? { ...b, ...pendingData } : b);
            }
            return { data: pendingData, error: null };
        }

        if (table === 'tour_series') {
            data = MOCK_PUBLIC_TOUR;
        } else if (table === 'view_unpaid_bookings' || table === 'bookings') {
            data = this.bookings;
        } else if (table === 'line_chat_logs') {
            data = this.lineLogs;
        } else if (table === 'company_budgets') {
            data = MOCK_COMPANY_BUDGET;
        } else if (table === 'polls') {
            data = MOCK_POLLS;
        } else if (table === 'poll_options') {
            data = MOCK_POLL_OPTIONS;
        } else if (table === 'change_requests') {
            data = this.changeRequests;
        } else if (table === 'incidents') {
            data = this.incidents;
        } else if (table === 'tour_options') {
            data = MOCK_TOUR_OPTIONS;
        } else if (table === 'view_user_footprints') {
            data = MOCK_FOOTPRINT;
        }

        if (isSingle) {
            if (Array.isArray(data)) {
                data = data.length > 0 ? data[0] : null;
            }
        } else {
            if (!Array.isArray(data) && data !== null) {
                data = [data];
            } else if (data === null) {
                data = [];
            }
        }
        return { data, error };
    };

    const builder = {
        select: (columns?: string) => {
            pendingOp = 'select';
            return builder;
        },
        eq: (column: string, value: any) => {
            filters[column] = value;
            return builder;
        },
        single: () => {
            isSingle = true;
            return builder;
        },
        insert: (data: any) => {
            pendingOp = 'insert';
            pendingData = data;
            return builder;
        },
        update: (data: any) => {
            pendingOp = 'update';
            pendingData = data;
            return builder;
        },
        then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => {
            return execute().then(onfulfilled, onrejected);
        }
    };
    
    return builder;
  }

  async rpc(functionName: string, params?: any) {
    if (functionName === 'generate_receipt_number') {
        const date = new Date();
        const year = date.getFullYear().toString().substr(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const sequence = this.receiptCounter.toString().padStart(2, '0');
        this.receiptCounter++;
        return { data: `TR-${year}${month}-${sequence}`, error: null };
    }
    return { data: null, error: 'Function not found' };
  }

  channel(name: string) {
    return {
      on: (event: string, filter: any, callback: Function) => {
        if (!this.listeners[name]) this.listeners[name] = [];
        this.listeners[name].push(callback);
        return { subscribe: () => {} };
      }
    };
  }

  removeChannel(channel: any) {}

  emit(event: string, payload: any) {
    Object.values(this.listeners).forEach(callbacks => {
      callbacks.forEach(cb => cb(payload));
    });
  }
}

export const supabase = new MockSupabase();
