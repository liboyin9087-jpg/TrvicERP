// =====================================================
// TravelCanvas - Form Validation Schemas (Zod)
// 統一的表單驗證規則
// =====================================================

import { z } from 'zod';

// =====================================================
// Common Validation Rules
// =====================================================

const phoneRegex = /^[0-9\-\+\s\(\)]+$/;
const emailSchema = z.string().email('請輸入有效的電子郵件');
const phoneSchema = z.string().regex(phoneRegex, '請輸入有效的電話號碼').optional();

// =====================================================
// RFP (Request for Proposal) Schemas
// =====================================================

export const createRFPSchema = z.object({
  companyName: z
    .string()
    .min(2, '公司名稱至少需要 2 個字')
    .max(100, '公司名稱不可超過 100 字'),
  
  contactPerson: z
    .string()
    .min(2, '聯絡人姓名至少需要 2 個字')
    .max(50, '聯絡人姓名不可超過 50 字'),
  
  contactEmail: emailSchema,
  
  contactPhone: phoneSchema,
  
  headcount: z
    .number()
    .min(1, '人數至少需要 1 人')
    .max(500, '人數不可超過 500 人'),
  
  budgetMin: z
    .number()
    .min(1000, '預算下限至少需要 NT$ 1,000'),
  
  budgetMax: z
    .number()
    .min(1000, '預算上限至少需要 NT$ 1,000'),
  
  destination: z
    .string()
    .min(1, '請選擇目的地'),
  
  durationDays: z
    .number()
    .min(1, '天數至少需要 1 天')
    .max(30, '天數不可超過 30 天'),
  
  departureDate: z
    .string()
    .optional(),
  
  specialRequirements: z
    .array(z.string())
    .default([]),
  
  customRequirements: z
    .string()
    .max(1000, '自訂需求不可超過 1000 字')
    .optional(),
  
  deadline: z
    .string()
    .min(1, '請選擇截止日期')
}).refine(data => data.budgetMax >= data.budgetMin, {
  message: '預算上限不可小於下限',
  path: ['budgetMax']
});

export type CreateRFPInput = z.infer<typeof createRFPSchema>;

// =====================================================
// Quote Submission Schema
// =====================================================

export const submitQuoteSchema = z.object({
  rfpId: z.string().uuid(),
  
  agencyName: z
    .string()
    .min(2, '旅行社名稱至少需要 2 個字'),
  
  pricePerPerson: z
    .number()
    .min(1000, '單價至少需要 NT$ 1,000'),
  
  features: z
    .array(z.string())
    .min(1, '請至少填寫一個特色'),
  
  itinerarySummary: z
    .string()
    .min(10, '行程摘要至少需要 10 個字')
    .max(2000, '行程摘要不可超過 2000 字'),
  
  validUntil: z
    .string()
    .min(1, '請選擇報價有效期限'),
  
  notes: z
    .string()
    .max(500, '備註不可超過 500 字')
    .optional()
});

export type SubmitQuoteInput = z.infer<typeof submitQuoteSchema>;

// =====================================================
// Warning Report Schema
// =====================================================

export const reportWarningSchema = z.object({
  supplierName: z
    .string()
    .min(2, '供應商名稱至少需要 2 個字')
    .max(100, '供應商名稱不可超過 100 字'),
  
  supplierType: z.enum(['hotel', 'restaurant', 'transport', 'attraction', 'guide', 'other'], {
    errorMap: () => ({ message: '請選擇供應商類型' })
  }),
  
  location: z
    .string()
    .max(100, '地點不可超過 100 字')
    .optional(),
  
  severity: z.enum(['low', 'medium', 'high', 'critical'], {
    errorMap: () => ({ message: '請選擇嚴重程度' })
  }),
  
  issueTitle: z
    .string()
    .min(5, '問題標題至少需要 5 個字')
    .max(100, '問題標題不可超過 100 字'),
  
  issueDescription: z
    .string()
    .min(20, '問題描述至少需要 20 個字')
    .max(2000, '問題描述不可超過 2000 字'),
  
  incidentDate: z
    .string()
    .optional(),
  
  evidenceUrls: z
    .array(z.string().url('請輸入有效的網址'))
    .max(5, '最多上傳 5 個證據連結')
    .default([]),
  
  reporterAgency: z
    .string()
    .max(100, '旅行社名稱不可超過 100 字')
    .optional()
});

export type ReportWarningInput = z.infer<typeof reportWarningSchema>;

// =====================================================
// Voting Poll Schema
// =====================================================

export const createPollSchema = z.object({
  title: z
    .string()
    .min(3, '投票標題至少需要 3 個字')
    .max(100, '投票標題不可超過 100 字'),
  
  description: z
    .string()
    .max(500, '描述不可超過 500 字')
    .optional(),
  
  deadline: z
    .string()
    .min(1, '請選擇截止日期'),
  
  options: z
    .array(z.string().min(1, '選項不可為空'))
    .min(2, '至少需要 2 個選項')
    .max(10, '最多 10 個選項')
});

export type CreatePollInput = z.infer<typeof createPollSchema>;

// =====================================================
// User Profile Schema
// =====================================================

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, '姓名至少需要 2 個字')
    .max(50, '姓名不可超過 50 字'),
  
  email: emailSchema,
  
  phone: phoneSchema,
  
  department: z
    .string()
    .max(50, '部門名稱不可超過 50 字')
    .optional(),
  
  emergencyContact: z
    .string()
    .max(100, '緊急聯絡人不可超過 100 字')
    .optional(),
  
  dietaryRestrictions: z
    .array(z.string())
    .default([]),
  
  specialNeeds: z
    .string()
    .max(500, '特殊需求不可超過 500 字')
    .optional()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// =====================================================
// Booking Schema
// =====================================================

export const createBookingSchema = z.object({
  packageId: z.string().min(1, '請選擇行程'),
  
  travelDate: z.string().min(1, '請選擇出發日期'),
  
  returnDate: z.string().min(1, '請選擇回程日期'),
  
  numberOfTravelers: z
    .number()
    .min(1, '至少需要 1 位旅客')
    .max(100, '單次預訂不可超過 100 人'),
  
  customerName: z
    .string()
    .min(2, '客戶名稱至少需要 2 個字'),
  
  customerEmail: emailSchema,
  
  customerPhone: z
    .string()
    .min(1, '請輸入聯絡電話'),
  
  notes: z
    .string()
    .max(1000, '備註不可超過 1000 字')
    .optional()
}).refine(data => {
  const travel = new Date(data.travelDate);
  const returnD = new Date(data.returnDate);
  return returnD >= travel;
}, {
  message: '回程日期不可早於出發日期',
  path: ['returnDate']
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

// =====================================================
// Validation Helper Functions
// =====================================================

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = error.message;
    }
  }
  
  return { success: false, errors };
}

export function getFieldError(
  errors: Record<string, string> | undefined,
  field: string
): string | undefined {
  return errors?.[field];
}
