/**
 * 資料驗證服務
 * Data Validation Service
 */

import type { Customer, Order, Quotation } from '../core/types'; // 假設這些類型定義在 '../core/types'

/**
 * 驗證規則類型
 */
export type ValidationRuleType =
  | 'required' | 'email' | 'phone' | 'id_number' | 'passport_number'
  | 'credit_card' | 'date' | 'age' | 'address' | 'zipcode'
  | 'name' | 'company_name' | 'emergency_contact' | 'medical_info'
  | 'dietary_restrictions' | 'allergies' | 'special_needs'
  | 'order_number' | 'order_date' | 'total_amount' | 'quotation_title' | 'valid_until';

/**
 * 驗證嚴重程度
 */
export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * 驗證結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 資料品質分數
  suggestions: string[];
}

/**
 * 驗證錯誤
 */
export interface ValidationError {
  field: string;
  type: ValidationRuleType;
  message: string;
  severity: ValidationSeverity;
  currentValue?: any;
  expectedValue?: string;
  fixSuggestion?: string;
}

/**
 * 驗證警告
 */
export interface ValidationWarning {
  field: string;
  type: ValidationRuleType;
  message: string;
  recommendation: string;
}

/**
 * 驗證規則配置
 */
export interface ValidationRule {
  type: ValidationRuleType;
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  // customValidator 現在可以接收一個上下文物件，用於更複雜的驗證邏輯
  customValidator?: (value: any, context?: any) => boolean | string;
  errorMessage?: string;
  warningMessage?: string;
  fixSuggestion?: string;
}

/**
 * 台灣地區特定驗證邏輯模組
 * 根據問題 [architect] 4 抽離，以增加彈性與可維護性。
 */
export const taiwanSpecificValidators = {
  // 台灣身份證號驗證算法
  isValidTaiwanIdNumber: (value: string): boolean => {
    if (!value || value.length !== 10) return false;

    const letters = 'ABCDEFGHJKLMNPQRSTUVXYWZIO';
    const firstChar = value.charAt(0).toUpperCase();
    const letterIndex = letters.indexOf(firstChar);

    if (letterIndex === -1) return false;

    const genderDigit = parseInt(value.charAt(1));
    if (genderDigit !== 1 && genderDigit !== 2) return false;

    let sum = (letterIndex + 10) % 10 * 9 + Math.floor((letterIndex + 10) / 10);

    for (let i = 1; i < 9; i++) {
      sum += parseInt(value.charAt(i)) * (9 - i);
    }

    sum += parseInt(value.charAt(9));

    return sum % 10 === 0;
  },
  // 台灣電話號碼正則
  taiwanPhoneNumberPattern: /^(\+886-?)?(\d{2,3}-?)?\d{7,8}$/,
  // 台灣郵遞區號正則
  taiwanZipcodePattern: /^\d{3}(\d{2})?$/,
};

/**
 * 驗證規則集合介面
 * DataValidationService 透過此介面接收外部規則配置，實現彈性 (問題 [architect] 3)。
 */
export interface IValidationRules {
  customer: Record<string, ValidationRule[]>;
  order: Record<string, ValidationRule[]>;
  quotation: Record<string, ValidationRule[]>;
  // 可擴展更多資料類型
}

/**
 * 預設資料驗證規則配置
 * 此規則為外部化規則的實例，可由其他機制（如設定檔、API）動態載入。
 */
export const DEFAULT_VALIDATION_RULES: IValidationRules = {
  customer: {
    personalInfo: [
      {
        type: 'name',
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[\u4e00-\u9fa5a-zA-Z\s]+$/,
        errorMessage: '姓名必須為2-50個字符，只能包含中文、英文和空格'
      },
      {
        type: 'email',
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: '請輸入有效的電子郵件地址'
      },
      {
        type: 'phone',
        required: true,
        pattern: taiwanSpecificValidators.taiwanPhoneNumberPattern,
        errorMessage: '請輸入有效的台灣電話號碼（格式：0912345678 或 +886-9-12345678）'
      },
      {
        type: 'id_number',
        required: true,
        customValidator: taiwanSpecificValidators.isValidTaiwanIdNumber,
        errorMessage: '請輸入有效的台灣身份證號碼'
      },
      {
        type: 'date', // 假設此規則用於出生日期 (birthDate)
        required: true,
        customValidator: (value: string) => {
          const date = new Date(value);
          const now = new Date();
          const age = now.getFullYear() - date.getFullYear();

          if (isNaN(date.getTime())) return false; // 檢查日期是否有效
          return age >= 0 && age <= 120; // 檢查年齡範圍（0-120歲）
        },
        errorMessage: '請輸入有效的出生日期（年齡需在0-120歲之間）'
      }
    ],
    passportInfo: [
      {
        type: 'passport_number',
        required: false,
        pattern: /^[A-Z0-9]{6,9}$/,
        errorMessage: '護照號碼格式不正確（應為6-9位大寫字母和數字）'
      },
      {
        type: 'date', // 假設此規則用於護照有效期 (expiryDate)
        required: false,
        customValidator: (value: string) => {
          if (!value) return true; // 非必填時，空值有效
          const expiryDate = new Date(value);
          const now = new Date();
          const sixMonthsLater = new Date(now.setMonth(now.getMonth() + 6));
          return expiryDate > sixMonthsLater;
        },
        errorMessage: '護照有效期不足6個月',
        warningMessage: '護照即將到期，建議提前更新'
      }
    ],
    addressInfo: [
      {
        type: 'address',
        required: true,
        minLength: 10,
        maxLength: 200,
        errorMessage: '地址長度需在10-200字符之間'
      },
      {
        type: 'zipcode',
        required: true,
        pattern: taiwanSpecificValidators.taiwanZipcodePattern,
        errorMessage: '請輸入有效的台灣郵遞區號（3位或5位數字）'
      }
    ],
    emergencyContact: [
      {
        type: 'name', // 緊急聯絡人姓名
        required: true,
        minLength: 2,
        maxLength: 50,
        errorMessage: '緊急聯絡人姓名長度需在2-50字符之間'
      },
      {
        type: 'phone', // 緊急聯絡人電話
        required: true,
        pattern: taiwanSpecificValidators.taiwanPhoneNumberPattern,
        errorMessage: '請輸入有效的緊急聯絡人電話號碼'
      },
      {
        type: 'emergency_contact', // 自定義規則：不能是客戶本人
        required: true,
        customValidator: (value: string, context?: any) => {
          return value !== context?.customerName;
        },
        errorMessage: '緊急聯絡人不能是客戶本人',
        fixSuggestion: '請更換緊急聯絡人資料'
      }
    ],
    medicalInfo: [
      {
        type: 'medical_info', // 一般醫療資訊
        required: false,
        maxLength: 500,
        warningMessage: '建議提供詳細的醫療資訊以確保旅行安全'
      },
      {
        type: 'allergies',
        required: false,
        customValidator: (value: string) => {
          if (!value) return true;

          const commonAllergens = ['花生', '堅果', '海鮮', '貓', '狗', '花粉', '藥物'];
          const hasCommonAllergen = commonAllergens.some(allergen =>
            value.toLowerCase().includes(allergen.toLowerCase())
          );
          return hasCommonAllergen || value.length >= 5; // 確保有一定長度或包含常見過敏原
        },
        warningMessage: '請詳細說明過敏原和症狀'
      },
      {
        type: 'dietary_restrictions',
        required: false,
        maxLength: 300,
        warningMessage: '飲食限制資訊有助於安排餐食'
      },
      {
        type: 'special_needs',
        required: false,
        maxLength: 300,
        warningMessage: '特殊需求資訊有助於提供更好的服務'
      }
    ]
  },
  order: {
    orderInfo: [
      {
        type: 'order_number',
        required: true,
        errorMessage: '訂單編號不能為空'
      },
      {
        type: 'order_date',
        required: true,
        customValidator: (value: string) => {
          const orderDate = new Date(value);
          const now = new Date();
          return orderDate <= now;
        },
        errorMessage: '訂單日期不能晚於當前日期'
      },
      {
        type: 'total_amount',
        required: true,
        min: 0.01,
        errorMessage: '訂單總金額必須大於0'
      }
    ],
    paymentInfo: [
      {
        type: 'credit_card',
        required: true,
        pattern: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
        customValidator: (value: string) => {
          // Luhn算法驗證信用卡號
          const cleaned = value.replace(/[-\s]/g, '');
          if (cleaned.length !== 16) return false;

          let sum = 0;
          let isEven = false;

          for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i]);
            if (isEven) {
              digit *= 2;
              if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
          }
          return sum % 10 === 0;
        },
        errorMessage: '請輸入有效的信用卡號碼'
      }
    ]
  },
  quotation: {
    quotationInfo: [
      {
        type: 'quotation_title',
        required: true,
        minLength: 1,
        maxLength: 100,
        errorMessage: '報價標題不能為空且長度不能超過100字符'
      },
      {
        type: 'total_amount', // 報價總價
        required: true,
        min: 0.01,
        errorMessage: '報價總價必須大於0'
      },
      {
        type: 'valid_until', // 報價有效期
        required: false,
        customValidator: (value: string) => {
          if (!value) return true;
          const validUntil = new Date(value);
          const now = new Date();
          return validUntil > now; // 必須晚於當前日期
        },
        errorMessage: '報價有效期已過期'
      }
    ]
  }
};

/**
 * 資料驗證服務類別
 * 封裝驗證邏輯與歷史記錄管理。
 */
export class DataValidationService {
  private validationHistory: Array<{
    id: string;
    dataType: string;
    dataId: string;
    result: ValidationResult;
    validatedAt: string;
    validatedBy: string;
  }> = [];

  private readonly rules: IValidationRules;

  /**
   * 建構函式，接收外部注入的驗證規則。
   * @param rules - 驗證規則配置物件。
   */
  constructor(rules: IValidationRules) {
    this.rules = rules;
  }

  /**
   * 驗證客戶資料
   * @param customer - 客戶資料物件。
   * @returns 驗證結果。
   */
  validateCustomer(customer: Partial<Customer>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 傳遞客戶姓名作為上下文，用於緊急聯絡人驗證
    const personalValidation = this.validateFieldGroup(
      customer,
      this.rules.customer.personalInfo,
      'personalInfo',
      { customerName: customer.name }
    );
    errors.push(...personalValidation.errors);
    warnings.push(...personalValidation.warnings);

    const passportValidation = this.validateFieldGroup(
      customer,
      this.rules.customer.passportInfo,
      'passportInfo'
    );
    errors.push(...passportValidation.errors);
    warnings.push(...passportValidation.warnings);

    const addressValidation = this.validateFieldGroup(
      customer,
      this.rules.customer.addressInfo,
      'addressInfo'
    );
    errors.push(...addressValidation.errors);
    warnings.push(...addressValidation.warnings);

    const emergencyValidation = this.validateFieldGroup(
      customer,
      this.rules.customer.emergencyContact,
      'emergencyContact',
      { customerName: customer.name, emergencyContactName: customer.emergencyContact?.name }
    );
    errors.push(...emergencyValidation.errors);
    warnings.push(...emergencyValidation.warnings);

    const medicalValidation = this.validateFieldGroup(
      customer,
      this.rules.customer.medicalInfo,
      'medicalInfo'
    );
    errors.push(...medicalValidation.errors);
    warnings.push(...medicalValidation.warnings);

    const score = this.calculateDataQualityScore(errors, warnings);
    const suggestions = this.generateSuggestions(errors, warnings);

    const result: ValidationResult = {
      isValid: errors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(100, score)), // 確保分數在 0-100 之間
      suggestions
    };

    this.recordValidationHistory('Customer', customer.id ?? 'new-customer', result);
    return result;
  }

  /**
   * 驗證訂單資料
   * @param order - 訂單資料物件。
   * @returns 驗證結果。
   */
  validateOrder(order: Partial<Order>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const orderValidation = this.validateFieldGroup(
      order,
      this.rules.order.orderInfo,
      'orderInfo'
    );
    errors.push(...orderValidation.errors);
    warnings.push(...orderValidation.warnings);

    const paymentValidation = this.validateFieldGroup(
      order,
      this.rules.order.paymentInfo,
      'paymentInfo'
    );
    errors.push(...paymentValidation.errors);
    warnings.push(...paymentValidation.warnings);

    // 驗證客戶關聯
    if (!order.customerId || order.customerId.trim().length === 0) {
      errors.push({
        field: 'customerId',
        type: 'required',
        message: '訂單必須關聯客戶',
        severity: 'error',
        fixSuggestion: '請指定訂單的客戶'
      });
    }

    const score = this.calculateDataQualityScore(errors, warnings);
    const suggestions = this.generateSuggestions(errors, warnings);

    const result: ValidationResult = {
      isValid: errors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(100, score)),
      suggestions
    };

    this.recordValidationHistory('Order', order.id ?? 'new-order', result);
    return result;
  }

  /**
   * 驗證報價資料
   * @param quotation - 報價資料物件。
   * @returns 驗證結果。
   */
  validateQuotation(quotation: Partial<Quotation>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const quotationValidation = this.validateFieldGroup(
      quotation,
      this.rules.quotation.quotationInfo,
      'quotationInfo'
    );
    errors.push(...quotationValidation.errors);
    warnings.push(...quotationValidation.warnings);

    // 報價有效期不足7天的警告 (非錯誤，單獨處理)
    if (quotation.validUntil) {
      const validUntil = new Date(quotation.validUntil);
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (validUntil > now && validUntil < sevenDaysLater) {
        warnings.push({
          field: 'validUntil',
          type: 'valid_until',
          message: '報價有效期不足7天',
          recommendation: '建議延長報價有效期以提高成交機會'
        });
      }
    }

    // 驗證客戶關聯 (如果報價有客戶ID，則不能為空)
    if (quotation.customerId && quotation.customerId.trim().length === 0) {
      errors.push({
        field: 'customerId',
        type: 'required',
        message: '報價若有關聯客戶，客戶ID不能為空',
        severity: 'error',
        fixSuggestion: '請指定報價的客戶ID'
      });
    }

    const score = this.calculateDataQualityScore(errors, warnings);
    const suggestions = this.generateSuggestions(errors, warnings);

    const result: ValidationResult = {
      isValid: errors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(100, score)),
      suggestions
    };

    this.recordValidationHistory('Quotation', quotation.id ?? 'new-quotation', result);
    return result;
  }

  /**
   * 批量驗證資料
   * @param data - 資料陣列。
   * @param dataType - 資料類型名稱，用於記錄歷史。
   * @param validator - 針對單一資料項的驗證函式。
   * @returns 批量驗證結果及摘要。
   */
  validateBatch<T extends { id?: string }>(
    data: T[],
    dataType: string,
    validator: (item: T) => ValidationResult
  ): {
    results: ValidationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      averageScore: number;
      commonErrors: Array<{
        field: string;
        count: number;
        message: string;
      }>;
    };
  } {
    const results = data.map((item, index) => {
      const validationResult = validator(item);
      this.recordValidationHistory(dataType, item.id ?? `batch-item-${index}`, validationResult);
      return validationResult;
    });

    const validCount = results.filter(r => r.isValid).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = results.length > 0 ? totalScore / results.length : 0;

    const errorCounts = new Map<string, { count: number; message: string }>();
    results.forEach(result => {
      result.errors.forEach(error => {
        const key = `${error.field}_${error.type}_${error.message}`; // 包含 message 以區分相同 field/type 但不同原因的錯誤
        if (!errorCounts.has(key)) {
          errorCounts.set(key, { count: 0, message: error.message });
        }
        errorCounts.get(key)!.count++;
      });
    });

    const commonErrors = Array.from(errorCounts.entries())
      .map(([key, data]) => ({
        field: key.split('_')[0],
        count: data.count,
        message: data.message
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // 只顯示前五個常見錯誤

    return {
      results,
      summary: {
        total: data.length,
        valid: validCount,
        invalid: data.length - validCount,
        averageScore: Math.round(averageScore),
        commonErrors
      }
    };
  }

  /**
   * 取得驗證歷史記錄
   * @param filters - 過濾條件。
   * @returns 篩選並排序後的驗證歷史記錄。
   */
  getValidationHistory(filters?: {
    dataType?: string;
    dataId?: string;
    startDate?: string;
    endDate?: string;
    validatedBy?: string;
  }): Array<{
    id: string;
    dataType: string;
    dataId: string;
    result: ValidationResult;
    validatedAt: string;
    validatedBy: string;
  }> {
    let history = [...this.validationHistory];

    if (filters) {
      if (filters.dataType) {
        history = history.filter(h => h.dataType === filters.dataType);
      }
      if (filters.dataId) {
        history = history.filter(h => h.dataId === filters.dataId);
      }
      if (filters.startDate) {
        const start = new Date(filters.startDate).getTime();
        history = history.filter(h => new Date(h.validatedAt).getTime() >= start);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate).getTime();
        history = history.filter(h => new Date(h.validatedAt).getTime() <= end);
      }
      if (filters.validatedBy) {
        history = history.filter(h => h.validatedBy === filters.validatedBy);
      }
    }

    return history.sort((a, b) =>
      new Date(b.validatedAt).getTime() - new Date(a.validatedAt).getTime()
    ); // 依時間倒序排列
  }

  /**
   * 產生資料品質報告
   * @returns 包含整體分數、分類分數、常見問題和建議的報告。
   */
  generateDataQualityReport(): {
    overallScore: number;
    categoryScores: Record<string, number>;
    commonIssues: Array<{
      type: string;
      count: number;
      severity: string;
      description: string;
    }>;
    recommendations: string[];
    trends: Array<{
      date: string;
      score: number;
      validationCount: number;
    }>;
  } {
    const recentHistory = this.getValidationHistory({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 過去30天的歷史記錄
    });

    if (recentHistory.length === 0) {
      return {
        overallScore: 0,
        categoryScores: {},
        commonIssues: [],
        recommendations: ['暫無足夠的驗證數據產生報告'],
        trends: []
      };
    }

    const totalScore = recentHistory.reduce((sum, h) => sum + h.result.score, 0);
    const overallScore = Math.round(totalScore / recentHistory.length);

    const categoryScores: Record<string, number[]> = {};
    recentHistory.forEach(h => {
      if (!categoryScores[h.dataType]) {
        categoryScores[h.dataType] = [];
      }
      categoryScores[h.dataType].push(h.result.score);
    });

    const finalCategoryScores: Record<string, number> = {};
    Object.entries(categoryScores).forEach(([category, scores]) => {
      finalCategoryScores[category] = Math.round(
        scores.reduce((sum, score) => sum + score, 0) / scores.length
      );
    });

    const issueCounts = new Map<string, { count: number; severity: string; description: string }>();
    recentHistory.forEach(h => {
      h.result.errors.forEach(error => {
        const key = `${error.type}_${error.severity}_${error.message}`;
        if (!issueCounts.has(key)) {
          issueCounts.set(key, {
            count: 0,
            severity: error.severity,
            description: error.message
          });
        }
        issueCounts.get(key)!.count++;
      });
    });

    const commonIssues = Array.from(issueCounts.entries())
      .map(([key, data]) => ({
        type: key.split('_')[0],
        count: data.count,
        severity: data.severity,
        description: data.description
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 只顯示前十個常見問題

    const recommendations = this.generateQualityRecommendations(overallScore, commonIssues);
    const trends = this.generateQualityTrends(recentHistory);

    return {
      overallScore,
      categoryScores: finalCategoryScores,
      commonIssues,
      recommendations,
      trends
    };
  }

  // 私有輔助方法

  /**
   * 記錄驗證歷史。
   * @param dataType - 資料類型。
   * @param dataId - 資料ID。
   * @param result - 驗證結果。
   */
  private recordValidationHistory(dataType: string, dataId: string, result: ValidationResult): void {
    this.validationHistory.push({
      id: crypto.randomUUID(), // 使用 Web Crypto API 生成唯一 ID
      dataType,
      dataId,
      result,
      validatedAt: new Date().toISOString(),
      validatedBy: 'system' // 在真實應用中，應替換為當前登入用戶
    });
  }

  /**
   * 根據一系列規則驗證資料物件中的欄位群組。
   * @param data - 待驗證的資料物件。
   * @param rules - 該群組的驗證規則陣列。
   * @param groupName - 規則群組名稱 (用於上下文或偵錯)。
   * @param context - 傳遞給自定義驗證器的上下文物件。
   * @returns 包含錯誤和警告的物件。
   */
  private validateFieldGroup(
    data: any,
    rules: ValidationRule[],
    groupName: string,
    context?: any
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    rules.forEach(rule => {
      const fieldName = this.getFieldNameFromRuleType(rule.type);
      const fieldValue = this.getFieldValue(data, fieldName); // 使用輔助函式處理巢狀路徑
      const effectiveValue = fieldValue;

      // 檢查必填欄位
      if (rule.required && this.isEmpty(effectiveValue)) {
        errors.push({
          field: fieldName,
          type: rule.type,
          message: rule.errorMessage || `${fieldName} 為必填欄位`,
          severity: 'error',
          currentValue: effectiveValue,
          fixSuggestion: `請填寫 ${fieldName} 欄位`
        });
        return; // 必填欄位為空時，跳過該欄位的其他驗證
      }

      // 如果欄位為空且非必填，則只生成警告 (如果設定了)
      if (this.isEmpty(effectiveValue)) {
        if (rule.warningMessage) {
          warnings.push({
            field: fieldName,
            type: rule.type,
            message: rule.warningMessage,
            recommendation: `建議完善 ${fieldName} 資訊以提高資料品質`
          });
        }
        return; // 非必填欄位為空時，跳過其他驗證
      }

      // 長度驗證 (僅適用於字串)
      if (typeof effectiveValue === 'string') {
        if (rule.minLength !== undefined && effectiveValue.length < rule.minLength) {
          errors.push({
            field: fieldName,
            type: rule.type,
            message: rule.errorMessage || `${fieldName} 長度不能少於 ${rule.minLength} 個字符`,
            severity: 'error',
            currentValue: effectiveValue,
            fixSuggestion: `請至少輸入 ${rule.minLength} 個字符`
          });
        }
        if (rule.maxLength !== undefined && effectiveValue.length > rule.maxLength) {
          errors.push({
            field: fieldName,
            type: rule.type,
            message: rule.errorMessage || `${fieldName} 長度不能超過 ${rule.maxLength} 個字符`,
            severity: 'error',
            currentValue: effectiveValue,
            fixSuggestion: `請將長度控制在 ${rule.maxLength} 個字符以內`
          });
        }
      }

      // 數值範圍驗證
      if (typeof effectiveValue === 'number' || (typeof effectiveValue === 'string' && !isNaN(parseFloat(effectiveValue)))) {
        const numValue = typeof effectiveValue === 'number' ? effectiveValue : parseFloat(effectiveValue);
        if (rule.min !== undefined && numValue < rule.min) {
          errors.push({
            field: fieldName,
            type: rule.type,
            message: rule.errorMessage || `${fieldName} 不能小於 ${rule.min}`,
            severity: 'error',
            currentValue: effectiveValue,
            fixSuggestion: `請輸入不小於 ${rule.min} 的值`
          });
        }
        if (rule.max !== undefined && numValue > rule.max) {
          errors.push({
            field: fieldName,
            type: rule.type,
            message: rule.errorMessage || `${fieldName} 不能大於 ${rule.max}`,
            severity: 'error',
            currentValue: effectiveValue,
            fixSuggestion: `請輸入不大於 ${rule.max} 的值`
          });
        }
      }

      // 正則表達式驗證
      if (rule.pattern && !rule.pattern.test(String(effectiveValue))) {
        errors.push({
          field: fieldName,
          type: rule.type,
          message: rule.errorMessage || `${fieldName} 格式不正確`,
          severity: 'error',
          currentValue: effectiveValue,
          expectedValue: rule.pattern.toString(),
          fixSuggestion: `請按照正確格式填寫 ${fieldName}`
        });
      }

      // 自定義驗證 (提供 context)
      if (rule.customValidator) {
        const validationResult = rule.customValidator(effectiveValue, context);
        if (validationResult === false) {
          errors.push({
            field: fieldName,
            type: rule.type,
            message: rule.errorMessage || `${fieldName} 驗證失敗`,
            severity: 'error',
            currentValue: effectiveValue,
            fixSuggestion: `請檢查 ${fieldName} 的填寫內容`
          });
        } else if (typeof validationResult === 'string') {
          errors.push({
            field: fieldName,
            type: rule.type,
            message: validationResult, // 允許自定義驗證器返回具體錯誤訊息
            severity: 'error',
            currentValue: effectiveValue,
            fixSuggestion: `請修正 ${fieldName} 的錯誤`
          });
        }
      }

      // 生成警告 (獨立於驗證失敗，只有當該欄位沒有錯誤時才生成警告)
      if (rule.warningMessage && !errors.some(e => e.field === fieldName)) {
        warnings.push({
          field: fieldName,
          type: rule.type,
          message: rule.warningMessage,
          recommendation: `建議完善 ${fieldName} 資訊以提高資料品質`
        });
      }
    });

    return { errors, warnings };
  }

  /**
   * 根據 ValidationRuleType 獲取資料對應的欄位名稱或路徑。
   * 此映射定義了 `ValidationRuleType` 與實際資料物件屬性之間的關係。
   */
  private getFieldNameFromRuleType(fieldType: ValidationRuleType): string {
    const fieldMapping: Record<ValidationRuleType, string> = {
      'required': 'id', // 通用，通常會被更具體的欄位覆蓋
      'email': 'email',
      'phone': 'phone',
      'id_number': 'idNumber',
      'passport_number': 'passportNumber',
      'credit_card': 'creditCardNumber',
      'date': 'date', // 通用，需依上下文解釋
      'age': 'age',
      'address': 'address',
      'zipcode': 'zipcode',
      'name': 'name',
      'company_name': 'companyName',
      'emergency_contact': 'emergencyContact.name', // 支援巢狀屬性
      'medical_info': 'medicalInfo',
      'dietary_restrictions': 'dietaryRestrictions',
      'allergies': 'allergies',
      'special_needs': 'specialNeeds',
      'order_number': 'orderNumber',
      'order_date': 'orderDate',
      'total_amount': 'totalAmount',
      'quotation_title': 'title',
      'valid_until': 'validUntil',
    };

    const fieldPath = fieldMapping[fieldType];
    if (!fieldPath) {
        console.warn(`未為 ValidationRuleType: ${fieldType} 定義欄位映射。將使用類型名稱作為欄位。`);
        return fieldType;
    }
    return fieldPath;
  }
  
  /**
   * 根據路徑從物件中獲取巢狀屬性值。
   * @param data - 源資料物件。
   * @param path - 屬性路徑，例如 'emergencyContact.name'。
   * @returns 屬性值或 undefined。
   */
  private getFieldValue(data: any, path: string): any {
    if (!data || !path) return undefined;
    return path.split('.').reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, data);
  }

  /**
   * 檢查值是否為空 (null, undefined, 空字串, 只含空白的字串, 空陣列)。
   * @param value - 任何值。
   * @returns 如果為空則為 true，否則為 false。
   */
  private isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' ||
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'string' && value.trim() === '');
  }

  /**
   * 根據錯誤和警告計算資料品質分數。
   * @param errors - 錯誤陣列。
   * @param warnings - 警告陣列。
   * @returns 計算後的分數 (0-100)。
   */
  private calculateDataQualityScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;

    errors.forEach(error => {
      switch (error.severity) {
        case 'critical': score -= 25; break;
        case 'error': score -= 15; break;
        case 'warning': score -= 5; break; // 嚴格意義上，錯誤列表不應包含 warning 級別
        case 'info': score -= 2; break;
      }
    });

    warnings.forEach(() => {
      score -= 3;
    });

    return Math.max(0, score); // 確保分數不低於0
  }

  /**
   * 根據錯誤和警告生成改進建議。
   * @param errors - 錯誤陣列。
   * @param warnings - 警告陣列。
   * @returns 建議字串陣列。
   */
  private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];
    const errorTypes = new Set(errors.map(e => e.type));
    const warningTypes = new Set(warnings.map(w => w.type));

    if (errorTypes.has('email')) suggestions.push('請確認電子郵件地址的格式正確性。');
    if (errorTypes.has('phone') || errorTypes.has('emergency_contact')) suggestions.push('請確認電話號碼包含區域號碼且格式正確。');
    if (errorTypes.has('id_number')) suggestions.push('請仔細檢查身份證號碼是否正確。');
    if (warningTypes.has('passport_number') || warningTypes.has('valid_until')) suggestions.push('建議檢查護照和報價有效期，確保有效時間充足。');
    if (warningTypes.has('medical_info') || warningTypes.has('allergies') || warningTypes.has('dietary_restrictions') || warningTypes.has('special_needs')) suggestions.push('建議提供詳細的醫療與特殊需求資訊以確保服務品質與安全。');
    if (errorTypes.has('credit_card')) suggestions.push('請確認信用卡號碼正確且在有效期內。');
    if (errorTypes.has('address') || errorTypes.has('zipcode')) suggestions.push('請檢查地址和郵遞區號的完整性與正確性。');
    if (errorTypes.has('total_amount')) suggestions.push('請確保金額填寫正確且大於零。');
    if (errorTypes.has('name') || errorTypes.has('quotation_title')) suggestions.push('請確認名稱或標題的長度與內容符合規範。');
    if (errorTypes.has('date') || errorTypes.has('order_date')) suggestions.push('請檢查日期是否為有效日期且符合時間邏輯。');
    if (errorTypes.has('required')) suggestions.push('部分必填欄位為空，請補充完整。');

    return Array.from(new Set(suggestions)); // 移除重複建議
  }

  /**
   * 根據整體分數和常見問題生成資料品質建議。
   * @param overallScore - 整體資料品質分數。
   * @param commonIssues - 常見錯誤問題陣列。
   * @returns 建議字串陣列。
   */
  private generateQualityRecommendations(
    overallScore: number,
    commonIssues: Array<{ type: string; count: number; severity: string; description: string }>
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 60) {
      recommendations.push('整體資料品質較差，建議立即進行全面審查和修正，尤其關注關鍵業務資料。');
    } else if (overallScore < 80) {
      recommendations.push('整體資料品質中等，建議重點關注並修復排名靠前的常見錯誤，以提高數據可靠性。');
    } else {
      recommendations.push('整體資料品質良好，請繼續保持高標準，並定期審核數據以防退化。');
    }

    if (commonIssues.some(issue => issue.type === 'phone' || issue.type === 'emergency_contact')) {
      recommendations.push('常見的電話號碼錯誤提示您需要加強電話格式的驗證規則或對資料輸入人員進行培訓。');
    }
    if (commonIssues.some(issue => issue.type === 'email')) {
      recommendations.push('電子郵件格式錯誤頻繁，考慮導入自動驗證工具或標準化輸入流程。');
    }
    if (commonIssues.some(issue => issue.type === 'id_number')) {
      recommendations.push('身份證號碼驗證問題突出，建議導入官方驗證API或增強前端驗證邏輯。');
    }
    if (commonIssues.some(issue => issue.type === 'date' || issue.type === 'valid_until' || issue.type === 'order_date')) {
      recommendations.push('日期相關錯誤較多，請確保日期輸入格式一致性，並檢查時間邏輯（例如，未來日期、過期日期）。');
    }
    if (commonIssues.some(issue => issue.severity === 'critical')) {
        recommendations.push('存在多個關鍵性錯誤，可能導致業務流程中斷，請優先處理這些問題。');
    }

    return Array.from(new Set(recommendations));
  }

  /**
   * 計算資料品質分數趨勢。
   * @param history - 驗證歷史記錄。
   * @returns 每日平均分數和驗證次數的趨勢陣列。
   */
  private generateQualityTrends(history: Array<{
    result: ValidationResult;
    validatedAt: string;
  }>): Array<{ date: string; score: number; validationCount: number }> {
    const dailyScores: Record<string, { total: number; count: number }> = {};

    history.forEach(h => {
      const date = new Date(h.validatedAt).toISOString().split('T')[0]; // 以 YYYY-MM-DD 格式分組
      if (!dailyScores[date]) {
        dailyScores[date] = { total: 0, count: 0 };
      }
      dailyScores[date].total += h.result.score;
      dailyScores[date].count++;
    });

    return Object.entries(dailyScores)
      .map(([date, data]) => ({
        date,
        score: Math.round(data.total / data.count),
        validationCount: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // 依日期排序
  }
}

// 建立全域實例，使用預設規則初始化。
// 外部模組可以直接導入此實例進行資料驗證。
export const dataValidationService = new DataValidationService(DEFAULT_VALIDATION_RULES);

export default DataValidationService;