import type { 
    TourSession, 
    Booking, 
    PublicTourData, 
    LineChatLog, 
    CompanyBudget, 
    Poll, 
    PollOption, 
    ChangeRequest, 
    Incident, 
    TourOption, 
    UserFootprint 
} from '../../../types';

/**
 * Standardized response structure for Supabase mock calls.
 * @template T The type of the data being returned.
 */
interface MockSupabaseResponse<T> {
    data: T | T[] | null;
    error: { message: string; details?: any } | null;
}

/**
 * Interface for a generic mock table handler.
 * Each handler will manage operations for a specific "table".
 */
interface MockTableHandler<T> {
    select(filters: Record<string, any>, isSingle: boolean): Promise<MockSupabaseResponse<T>>;
    insert(payload: Partial<T>): Promise<MockSupabaseResponse<T>>;
    update(filters: Record<string, any>, payload: Partial<T>): Promise<MockSupabaseResponse<T>>;
    // delete? upsert?
}

// Helper function to generate IDs for mock data
const generateId = (prefix: string = '') => `${prefix}_${Math.random().toString(36).substr(2, 9)}`;

// --- Centralized Mock Data Store ---
// Holds all mock data in a single place, making it easy to manage and reset.
class MockDataStore {
    public tourOptions: TourOption[] = [
        { id: 'opt_fit_1', session_id: 's_demo', day_number: 3, title: '札幌啤酒博物館 & 螃蟹大餐', description: '參觀歷史悠久的啤酒廠，晚餐享受北海道三大蟹吃到飽。', price_add_on: 2500, capacity_limit: 20, quota_used: 12, image_url: 'https://picsum.photos/300/200?random=50' },
        { id: 'opt_fit_2', session_id: 's_demo', day_number: 4, title: '小樽運河手作音樂盒體驗', description: '專業老師帶領製作專屬音樂盒，含小樽甜點午茶券。', price_add_on: 1200, capacity_limit: 15, quota_used: 5, image_url: 'https://picsum.photos/300/200?random=51' },
        { id: 'opt_fit_3', session_id: 's_demo', day_number: 5, title: '千歲 Outlet Rera 購物巡禮', description: '免費接駁車服務，含 500 日圓折價券。', price_add_on: 0, capacity_limit: 40, quota_used: 28, image_url: 'https://picsum.photos/300/200?random=52' },
    ];

    public userFootprints: UserFootprint[] = [
        {
            user_id: 'me',
            email: 'traveler@foxconn.com',
            visited_countries: ['JP', 'TH', 'VN', 'SG', 'KR'],
            trip_count: 8
        }
    ];

    public publicTourData: PublicTourData[] = [
        {
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
        }
    ];

    public bookings: Booking[] = [
        { id: 'b_u1', session_id: 's_demo', user_id: 'u1', customer_name: 'Wang Xiao-Ming', total_amount: 39900, status: 'pending_payment', email: 'wang@example.com' },
        { id: 'b_u2', session_id: 's_demo', user_id: 'u2', customer_name: 'Chen Da-Wen', total_amount: 79800, status: 'verifying', email: 'chen@example.com', payment_proof_url: 'mock_proof.jpg' },
    ];

    public companyBudgets: CompanyBudget[] = [
        {
            id: 'comp_1',
            company_name: '鴻海科技集團 (Foxconn)',
            total_budget: 5000000,
            used_budget: 4150000,
            last_updated: new Date().toISOString()
        }
    ];

    public polls: Poll[] = [
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

    public pollOptions: PollOption[] = [
        { id: 'opt_1', poll_id: 'poll_1', text: '日本北海道滑雪五日', image_url: 'https://picsum.photos/300/200?random=20', tags: ['預算 5萬', '免請假'], vote_count: 98, is_winner: true },
        { id: 'opt_2', poll_id: 'poll_1', text: '泰國曼谷渡假五日', image_url: 'https://picsum.photos/300/200?random=21', tags: ['預算 3萬', '需請假3天'], vote_count: 42 },
        { id: 'opt_3', poll_id: 'poll_1', text: '國內環島豪華列車', image_url: 'https://picsum.photos/300/200?random=22', tags: ['預算 2萬', '親子友善'], vote_count: 16 },
    ];

    public changeRequests: ChangeRequest[] = [
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

    public incidents: Incident[] = [
        {
            id: 'inc_1',
            title: '北海道大雪影響行程',
            severity: 'high',
            status_message: '目前新千歲機場暫時關閉，全團已帶回飯店休息，預計明日 10:00 重新確認航班。全員平安。',
            timestamp: new Date().toISOString(),
            is_active: true
        }
    ];

    public lineChatLogs: LineChatLog[] = [];
    public tourSessions: TourSession[] = []; // Assuming empty if not explicitly defined
}

// Global instance of the data store for all handlers to share
const mockDataStore = new MockDataStore();

// --- Encapsulated Mock Behavior Logic (Table Handlers) ---
// Each handler abstracts the data access and manipulation for a specific "table".

/**
 * Base class for mock table handlers, providing common filtering and CRUD logic.
 * Assumes items have an 'id' property.
 */
abstract class BaseMockTableHandler<T extends { id?: string }> implements MockTableHandler<T> {
    protected data: T[];
    protected tableName: string;
    protected readonly dataStore: MockDataStore; // Reference to the central data store

    constructor(tableName: string, dataArray: T[], dataStore: MockDataStore) {
        this.tableName = tableName;
        this.data = dataArray; // This is a reference to the array in MockDataStore
        this.dataStore = dataStore;
    }

    /**
     * Applies filters to a dataset.
     * @param sourceData The array to filter.
     * @param filters An object where keys are column names and values are filter values.
     * @returns The filtered array.
     */
    protected applyFilters(sourceData: T[], filters: Record<string, any>): T[] {
        let filtered = [...sourceData];
        for (const key in filters) {
            if (Object.prototype.hasOwnProperty.call(filters, key)) {
                filtered = filtered.filter(item => {
                    const itemValue = (item as any)[key];
                    const filterValue = filters[key];
                    return itemValue === filterValue;
                });
            }
        }
        return filtered;
    }

    async select(filters: Record<string, any>, isSingle: boolean): Promise<MockSupabaseResponse<T>> {
        let filteredData = this.applyFilters(this.data, filters);
        let result: T | T[] | null = isSingle ? (filteredData.length > 0 ? filteredData[0] : null) : filteredData;
        return { data: result, error: null };
    }

    async insert(payload: Partial<T>): Promise<MockSupabaseResponse<T>> {
        const newItem: T = { ...payload, id: generateId(this.tableName) } as T;
        this.data.unshift(newItem); // Add to the front for "latest" behavior for most tables
        return { data: newItem, error: null };
    }

    async update(filters: Record<string, any>, payload: Partial<T>): Promise<MockSupabaseResponse<T>> {
        let updatedItems: T[] = [];
        this.data = this.data.map(item => {
            let matches = true;
            for (const key in filters) {
                if ((item as any)[key] !== filters[key]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                const updatedItem = { ...item, ...payload };
                updatedItems.push(updatedItem);
                return updatedItem;
            }
            return item;
        });
        return { data: updatedItems, error: null };
    }
}

// Concrete Handlers for specific tables
class MockTourOptionsHandler extends BaseMockTableHandler<TourOption> {
    constructor(dataStore: MockDataStore) {
        super('tour_options', dataStore.tourOptions, dataStore);
    }
}

class MockUserFootprintsHandler extends BaseMockTableHandler<UserFootprint> {
    constructor(dataStore: MockDataStore) {
        super('view_user_footprints', dataStore.userFootprints, dataStore);
    }
    async select(filters: Record<string, any>, isSingle: boolean): Promise<MockSupabaseResponse<UserFootprint>> {
        // User footprints are typically singular per user, so enforce single logic
        const filteredData = this.applyFilters(this.data, filters);
        return { data: filteredData.length > 0 ? filteredData[0] : null, error: null };
    }
}

class MockPublicTourDataHandler extends BaseMockTableHandler<PublicTourData> {
    constructor(dataStore: MockDataStore) {
        super('tour_series', dataStore.publicTourData, dataStore);
    }
    async select(filters: Record<string, any>, isSingle: boolean): Promise<MockSupabaseResponse<PublicTourData>> {
        // For 'tour_series', the original mock often returned a single object.
        const filteredData = this.applyFilters(this.data, filters);
        return { data: filteredData.length > 0 ? filteredData[0] : null, error: null };
    }
}

class MockBookingsHandler extends BaseMockTableHandler<Booking> {
    constructor(dataStore: MockDataStore) {
        super('bookings', dataStore.bookings, dataStore);
    }
    async insert(payload: Partial<Booking>): Promise<MockSupabaseResponse<Booking>> {
        const newItem: Booking = { 
            ...payload, 
            id: generateId('b'), 
            status: payload.status || 'pending_payment' // Default status for new bookings
        } as Booking;
        this.data.push(newItem); // Bookings often add to the end
        return { data: newItem, error: null };
    }
}

class MockUnpaidBookingsHandler extends BaseMockTableHandler<Booking> {
    constructor(dataStore: MockDataStore) {
        super('view_unpaid_bookings', dataStore.bookings, dataStore); // Filters from main bookings
    }
    async select(filters: Record<string, any>, isSingle: boolean): Promise<MockSupabaseResponse<Booking>> {
        const unpaidBookings = this.data.filter(b => b.status === 'pending_payment' || b.status === 'verifying');
        let filteredData = this.applyFilters(unpaidBookings, filters);
        let result: Booking | Booking[] | null = isSingle ? (filteredData.length > 0 ? filteredData[0] : null) : filteredData;
        return { data: result, error: null };
    }
}

class MockCompanyBudgetsHandler extends BaseMockTableHandler<CompanyBudget> {
    constructor(dataStore: MockDataStore) {
        super('company_budgets', dataStore.companyBudgets, dataStore);
    }
    async select(filters: Record<string, any>, isSingle: boolean): Promise<MockSupabaseResponse<CompanyBudget>> {
        // CompanyBudget is often a single record.
        const filteredData = this.applyFilters(this.data, filters);
        return { data: filteredData.length > 0 ? filteredData[0] : null, error: null };
    }
}

class MockPollsHandler extends BaseMockTableHandler<Poll> {
    constructor(dataStore: MockDataStore) {
        super('polls', dataStore.polls, dataStore);
    }
}

class MockPollOptionsHandler extends BaseMockTableHandler<PollOption> {
    constructor(dataStore: MockDataStore) {
        super('poll_options', dataStore.pollOptions, dataStore);
    }
    // This insert method also handles "voting" by incrementing vote_count
    async insert(payload: Partial<PollOption>): Promise<MockSupabaseResponse<PollOption>> {
        // If an option ID is provided, assume it's a vote to an existing option
        if (payload.id) {
            const option = this.data.find(o => o.id === payload.id);
            if (option) {
                option.vote_count = (option.vote_count || 0) + 1;
                // Also update the parent poll's total_votes if it exists
                const poll = this.dataStore.polls.find(p => p.id === option.poll_id);
                if (poll) {
                    poll.total_votes = (poll.total_votes || 0) + 1;
                }
                return { data: option, error: null };
            }
            return { data: null, error: { message: 'Poll option not found for voting.' } };
        }
        // Otherwise, it's a new poll option creation
        const newItem: PollOption = { 
            ...payload, 
            id: generateId('opt'), 
            vote_count: 0 
        } as PollOption;
        this.data.push(newItem);
        return { data: newItem, error: null };
    }
}

// Special handler for 'poll_votes' which is an action to increment a vote
class MockPollVotesHandler extends BaseMockTableHandler<any> { 
    constructor(dataStore: MockDataStore) {
        super('poll_votes', [], dataStore); // No direct data array for this "table"
    }
    async insert(payload: { option_id: string; user_id?: string }): Promise<MockSupabaseResponse<any>> {
        // Delegate the actual vote increment to the PollOptionsHandler
        const pollOptionHandler = new MockPollOptionsHandler(this.dataStore);
        return pollOptionHandler.insert({ id: payload.option_id } as Partial<PollOption>); 
    }
}

class MockChangeRequestsHandler extends BaseMockTableHandler<ChangeRequest> {
    constructor(dataStore: MockDataStore) {
        super('change_requests', dataStore.changeRequests, dataStore);
    }
    async insert(payload: Partial<ChangeRequest>): Promise<MockSupabaseResponse<ChangeRequest>> {
        const newItem: ChangeRequest = { 
            ...payload, 
            id: generateId('cr'), 
            status: payload.status || 'pending', 
            created_at: new Date().toISOString() 
        } as ChangeRequest;
        this.data.unshift(newItem);
        return { data: newItem, error: null };
    }
}

class MockIncidentsHandler extends BaseMockTableHandler<Incident> {
    constructor(dataStore: MockDataStore) {
        super('incidents', dataStore.incidents, dataStore);
    }
    async insert(payload: Partial<Incident>): Promise<MockSupabaseResponse<Incident>> {
        const newItem: Incident = { 
            ...payload, 
            id: generateId('inc'), 
            timestamp: new Date().toISOString(), 
            is_active: payload.is_active ?? true 
        } as Incident;
        this.data.unshift(newItem);
        return { data: newItem, error: null };
    }
}

class MockLineChatLogsHandler extends BaseMockTableHandler<LineChatLog> {
    private readonly emitChannelEvent: (event: string, payload: any) => void;

    constructor(dataStore: MockDataStore, emitChannelEvent: (event: string, payload: any) => void) {
        super('line_chat_logs', dataStore.lineChatLogs, dataStore);
        this.emitChannelEvent = emitChannelEvent;
    }

    async insert(payload: Partial<LineChatLog>): Promise<MockSupabaseResponse<LineChatLog>> {
        const newLog: LineChatLog = { 
            ...payload, 
            id: generateId('lcl'), 
            timestamp: new Date().toISOString() 
        } as LineChatLog;
        this.data.unshift(newLog); 
        this.emitChannelEvent('line_chat_update', newLog); // Emit event for new chat log
        return { data: newLog, error: null };
    }
}

// --- Refactored MockSupabase Class ---
// The main mock client, acting as a router to the specific table handlers.
class MockSupabase {
    private listeners: Record<string, Function[]> = {};
    private receiptCounter = 1;

    // Map table names to their respective handlers for delegation
    private tableHandlers: { [key: string]: MockTableHandler<any> } = {};

    constructor() {
        // Initialize all table handlers with the shared data store
        this.tableHandlers = {
            'tour_options': new MockTourOptionsHandler(mockDataStore),
            'view_user_footprints': new MockUserFootprintsHandler(mockDataStore),
            'tour_series': new MockPublicTourDataHandler(mockDataStore),
            'bookings': new MockBookingsHandler(mockDataStore),
            'view_unpaid_bookings': new MockUnpaidBookingsHandler(mockDataStore),
            'company_budgets': new MockCompanyBudgetsHandler(mockDataStore),
            'polls': new MockPollsHandler(mockDataStore),
            'poll_options': new MockPollOptionsHandler(mockDataStore),
            'poll_votes': new MockPollVotesHandler(mockDataStore), // Handle vote actions
            'change_requests': new MockChangeRequestsHandler(mockDataStore),
            'incidents': new MockIncidentsHandler(mockDataStore),
            'line_chat_logs': new MockLineChatLogsHandler(mockDataStore, this.emit.bind(this)),
        };
    }

    from(table: string) {
        const handler = this.tableHandlers[table];
        if (!handler) {
            console.warn(`MockSupabase: Handler for table '${table}' not found.`);
            // Return a builder that consistently returns an error
            return {
                select: () => this,
                eq: () => this,
                single: () => this,
                insert: () => this,
                update: () => this,
                then: (onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) => 
                    Promise.resolve<MockSupabaseResponse<any>>({ data: null, error: { message: `Handler for table '${table}' not found.` } }).then(onfulfilled, onrejected)
            };
        }

        let filters: Record<string, any> = {};
        let isSingle = false;
        let pendingOp: 'select' | 'insert' | 'update' | 'delete' = 'select'; // Added 'delete' for future expansion
        let pendingData: any = null;

        const execute = async (): Promise<MockSupabaseResponse<any>> => {
            switch (pendingOp) {
                case 'select':
                    return handler.select(filters, isSingle);
                case 'insert':
                    return handler.insert(pendingData);
                case 'update':
                    return handler.update(filters, pendingData);
                // case 'delete':
                //     return handler.delete(filters); // Future implementation
                default:
                    return { data: null, error: { message: `Unsupported operation: ${pendingOp}` } };
            }
        };

        const builder = {
            select: (columns?: string) => { // columns parameter is typically ignored in simple mocks
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

    async rpc(functionName: string, params?: any): Promise<MockSupabaseResponse<any>> {
        if (functionName === 'generate_receipt_number') {
            const date = new Date();
            const year = date.getFullYear().toString().substr(-2);
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const sequence = this.receiptCounter.toString().padStart(2, '0');
            this.receiptCounter++;
            return { data: `TR-${year}${month}-${sequence}`, error: null };
        }
        return { data: null, error: { message: `RPC function '${functionName}' not found.` } };
    }

    channel(name: string) {
        return {
            on: (event: string, filter: any, callback: Function) => {
                if (!this.listeners[name]) this.listeners[name] = [];
                this.listeners[name].push(callback);
                return { subscribe: () => { /* no-op in mock */ } };
            }
        };
    }

    removeChannel(channel: any) {
        // In a simple mock, removing specific channel listeners might not be necessary
        // but could be implemented by iterating and filtering this.listeners if 'channel' object contains identifiable info.
    }

    /**
     * Emits an event to all registered listeners.
     * This mimics Supabase's real-time functionality (simplified).
     */
    emit(event: string, payload: any) {
        // For simplicity, all listeners receive the payload regardless of channel name or filter.
        // A more robust mock would check channel names and filters.
        Object.values(this.listeners).forEach(callbacks => {
            callbacks.forEach(cb => cb(payload));
        });
    }
}

export const supabase = new MockSupabase();