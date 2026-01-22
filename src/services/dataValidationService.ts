/**
 * 資料驗證服務
 * Data Validation Service
 */

import type { Customer, Order, Quotation } from '../core/types';

/**
 * 驗證規則類型
 */
export type ValidationRuleType = 
  | 'required' | 'email' | 'phone' | 'id_number' | 'passport_number'
  | 'credit_card' | 'date' | 'age' | 'address' | 'zipcode'
  | 'name' | 'company_name' | 'emergency_contact' | 'medical_info'
  | 'dietary_restrictions' | 'allergies' | 'special_needs';

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
interface ValidationRule {
  type: ValidationRuleType;
  required: boolean;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  customValidator?: (value: any, context?: any) => boolean | string;
  errorMessage?: string;
  warningMessage?: string;
}

/**
 * 客戶資料驗證規則
 */
const CUSTOMER_VALIDATION_RULES: Record<string, ValidationRule[]> = {
  // 基本資訊
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
      pattern: /^(\+886-?)?(\d{2,3}-?)?\d{7,8}$/,
      errorMessage: '請輸入有效的台灣電話號碼（格式：0912345678 或 +886-9-12345678）'
    },
    {
      type: 'id_number',
      required: true,
      pattern: /^[A-Z][12]\d{8}$/,
      customValidator: (value: string) => {
        if (!value || value.length !== 10) return false;
        
        // 台灣身份證號驗證算法
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
      errorMessage: '請輸入有效的台灣身份證號碼'
    },
    {
      type: 'date',
      required: true,
      customValidator: (value: string) => {
        const date = new Date(value);
        const now = new Date();
        const age = now.getFullYear() - date.getFullYear();
        
        // 檢查日期是否有效
        if (isNaN(date.getTime())) return false;
        
        // 檢查年齡範圍（0-120歲）
        return age >= 0 && age <= 120;
      },
      errorMessage: '請輸入有效的出生日期（年齡需在0-120歲之間）'
    }
  ],
  
  // 護照資訊
  passportInfo: [
    {
      type: 'passport_number',
      required: false,
      pattern: /^[A-Z0-9]{6,9}$/,
      errorMessage: '護照號碼格式不正確（應為6-9位大寫字母和數字）'
    },
    {
      type: 'date',
      required: false,
      customValidator: (value: string) => {
        if (!value) return true; // 護照資訊為可選
        const expiryDate = new Date(value);
        const now = new Date();
        const sixMonthsLater = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000);
        
        return expiryDate > sixMonthsLater;
      },
      errorMessage: '護照有效期不足6個月',
      warningMessage: '護照即將到期，建議提前更新'
    }
  ],
  
  // 地址資訊
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
      pattern: /^\d{3}(\d{2})?$/,
      errorMessage: '請輸入有效的台灣郵遞區號（3位或5位數字）'
    }
  ],
  
  // 緊急聯絡人
  emergencyContact: [
    {
      type: 'name',
      required: true,
      minLength: 2,
      maxLength: 50,
      errorMessage: '緊急聯絡人姓名長度需在2-50字符之間'
    },
    {
      type: 'phone',
      required: true,
      pattern: /^(\+886-?)?(\d{2,3}-?)?\d{7,8}$/,
      errorMessage: '請輸入有效的緊急聯絡人電話號碼'
    },
    {
      type: 'emergency_contact',
      required: true,
      customValidator: (value: string, context: any) => {
        // 確保緊急聯絡人不是客戶本人
        return value !== context.customerName;
      },
      errorMessage: '緊急聯絡人不能是客戶本人'
    }
  ],
  
  // 醫療資訊
  medicalInfo: [
    {
      type: 'medical_info',
      required: false,
      maxLength: 500,
      warningMessage: '建議提供詳細的醫療資訊以確保旅行安全'
    },
    {
      type: 'allergies',
      required: false,
      customValidator: (value: string) => {
        if (!value) return true;
        
        // 檢查常見過敏原關鍵字
        const commonAllergens = ['花生', '堅果', '海鮮', '貓', '狗', '花粉', '藥物'];
        const hasCommonAllergen = commonAllergens.some(allergen => 
          value.toLowerCase().includes(allergen.toLowerCase())
        );
        
        return hasCommonAllergen || value.length >= 5;
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
};

/**
 * 訂單驗證規則
 */
const ORDER_VALIDATION_RULES: Record<string, ValidationRule[]> = {
  orderInfo: [
    {
      type: 'required',
      required: true,
      errorMessage: '訂單編號不能為空'
    },
    {
      type: 'date',
      required: true,
      customValidator: (value: string) => {
        const orderDate = new Date(value);
        const now = new Date();
        return orderDate <= now;
      },
      errorMessage: '訂單日期不能晚於當前日期'
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
};

/**
 * 資料驗證服務類別
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

  /**
   * 驗證客戶資料
   */
  validateCustomer(customer: Partial<Customer>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let totalScore = 100;

    // 驗證基本資訊
    const personalErrors = this.validateFieldGroup(
      customer,
      CUSTOMER_VALIDATION_RULES.personalInfo,
      'personalInfo'
    );
    errors.push(...personalErrors.errors);
    warnings.push(...personalErrors.warnings);

    // 驗證護照資訊
    const passportErrors = this.validateFieldGroup(
      customer,
      CUSTOMER_VALIDATION_RULES.passportInfo,
      'passportInfo',
      customer
    );
    errors.push(...passportErrors.errors);
    warnings.push(...passportErrors.warnings);

    // 驗證地址資訊
    const addressErrors = this.validateFieldGroup(
      customer,
      CUSTOMER_VALIDATION_RULES.addressInfo,
      'addressInfo'
    );
    errors.push(...addressErrors.errors);
    warnings.push(...addressErrors.warnings);

    // 驗證緊急聯絡人
    const emergencyErrors = this.validateFieldGroup(
      customer,
      CUSTOMER_VALIDATION_RULES.emergencyContact,
      'emergencyContact',
      { customerName: customer.name }
    );
    errors.push(...emergencyErrors.errors);
    warnings.push(...emergencyErrors.warnings);

    // 驗證醫療資訊
    const medicalErrors = this.validateFieldGroup(
      customer,
      CUSTOMER_VALIDATION_RULES.medicalInfo,
      'medicalInfo'
    );
    errors.push(...medicalErrors.errors);
    warnings.push(...medicalErrors.warnings);

    // 計算資料品質分數
    totalScore = this.calculateDataQualityScore(errors, warnings);

    // 生成建議
    const suggestions = this.generateSuggestions(errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
      errors,
      warnings,
      score: totalScore,
      suggestions
    };
  }

  /**
   * 驗證訂單資料
   */
  validateOrder(order: Partial<Order>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 驗證訂單基本資訊
    const orderErrors = this.validateFieldGroup(
      order,
      ORDER_VALIDATION_RULES.orderInfo,
      'orderInfo'
    );
    errors.push(...orderErrors.errors);
    warnings.push(...orderErrors.warnings);

    // 驗證付款資訊
    const paymentErrors = this.validateFieldGroup(
      order,
      ORDER_VALIDATION_RULES.paymentInfo,
      'paymentInfo'
    );
    errors.push(...paymentErrors.errors);
    warnings.push(...paymentErrors.warnings);

    // 驗證客戶關聯
    if (!order.customerId) {
      errors.push({
        field: 'customerId',
        type: 'required',
        message: '訂單必須關聯客戶',
        severity: 'error'
      });
    }

    // 驗證金額
    if (order.totalAmount && order.totalAmount <= 0) {
      errors.push({
        field: 'totalAmount',
        type: 'required',
        message: '訂單總金額必須大於0',
        severity: 'error'
      });
    }

    const score = this.calculateDataQualityScore(errors, warnings);
    const suggestions = this.generateSuggestions(errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
      errors,
      warnings,
      score,
      suggestions
    };
  }

  /**
   * 驗證報價資料
   */
  validateQuotation(quotation: Partial<Quotation>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // 驗證報價基本資訊
    if (!quotation.quotationNumber || quotation.quotationNumber.trim().length === 0) {
      errors.push({
        field: 'quotationNumber',
        type: 'required',
        message: '報價單號不能為空',
        severity: 'error'
      });
    }

    if (quotation.quotationNumber && quotation.quotationNumber.length > 100) {
      errors.push({
        field: 'quotationNumber',
        type: 'name',
        message: '報價單號長度不能超過100字符',
        severity: 'error'
      });
    }

    // 驗證金額
    if (!quotation.totalAmount || quotation.totalAmount <= 0) {
      errors.push({
        field: 'totalAmount',
        type: 'required',
        message: '報價總金額必須大於0',
        severity: 'error'
      });
    }

    // 驗證有效期
    if (quotation.validUntil) {
      const validUntil = new Date(quotation.validUntil);
      const now = new Date();
      
      if (validUntil <= now) {
        errors.push({
          field: 'validUntil',
          type: 'date',
          message: '報價有效期已過期',
          severity: 'error'
        });
      } else if (validUntil.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        warnings.push({
          field: 'validUntil',
          type: 'date',
          message: '報價有效期不足7天',
          recommendation: '建議延長報價有效期以提高成交機會'
        });
      }
    }

    const score = this.calculateDataQualityScore(errors, warnings);
    const suggestions = this.generateSuggestions(errors, warnings);

    return {
      isValid: errors.filter(e => e.severity === 'error' || e.severity === 'critical').length === 0,
      errors,
      warnings,
      score,
      suggestions
    };
  }

  /**
   * 批量驗證資料
   */
  validateBatch<T>(
    data: T[],
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
    const results = data.map(item => validator(item));
    
    const validCount = results.filter(r => r.isValid).length;
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = totalScore / results.length;

    // 統計常見錯誤
    const errorCounts = new Map<string, { count: number; message: string }>();
    results.forEach(result => {
      result.errors.forEach(error => {
        const key = `${error.field}_${error.type}`;
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
      .slice(0, 5);

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
   * 取得驗證歷史
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
        history = history.filter(h => h.validatedAt >= filters.startDate!);
      }
      if (filters.endDate) {
        history = history.filter(h => h.validatedAt <= filters.endDate!);
      }
      if (filters.validatedBy) {
        history = history.filter(h => h.validatedBy === filters.validatedBy);
      }
    }

    return history.sort((a, b) => 
      new Date(b.validatedAt).getTime() - new Date(a.validatedAt).getTime()
    );
  }

  /**
   * 產生資料品質報告
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
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
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

    // 計算整體分數
    const totalScore = recentHistory.reduce((sum, h) => sum + h.result.score, 0);
    const overallScore = Math.round(totalScore / recentHistory.length);

    // 計算分類分數
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

    // 統計常見問題
    const issueCounts = new Map<string, { count: number; severity: string; description: string }>();
    recentHistory.forEach(h => {
      h.result.errors.forEach(error => {
        const key = `${error.type}_${error.severity}`;
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
      .slice(0, 10);

    // 生成建議
    const recommendations = this.generateQualityRecommendations(overallScore, commonIssues);

    // 生成趨勢
    const trends = this.generateQualityTrends(recentHistory);

    return {
      overallScore,
      categoryScores: finalCategoryScores,
      commonIssues,
      recommendations,
      trends
    };
  }

  // 私有方法

  private validateFieldGroup(
    data: any,
    rules: ValidationRule[],
    groupName: string,
    context?: any
  ): { errors: ValidationError[]; warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    rules.forEach(rule => {
      const fieldValue = this.getFieldValue(data, rule.type);
      
      // 檢查必填欄位
      if (rule.required && this.isEmpty(fieldValue)) {
        errors.push({
          field: rule.type,
          type: rule.type,
          message: rule.errorMessage || `${rule.type} 為必填欄位`,
          severity: 'error',
          currentValue: fieldValue,
          fixSuggestion: `請填寫 ${rule.type} 欄位`
        });
        return;
      }

      // 如果欄位為空且非必填，跳過其他驗證
      if (this.isEmpty(fieldValue)) {
        return;
      }

      // 長度驗證
      if (rule.minLength && fieldValue.length < rule.minLength) {
        errors.push({
          field: rule.type,
          type: rule.type,
          message: rule.errorMessage || `${rule.type} 長度不能少於 ${rule.minLength} 個字符`,
          severity: 'error',
          currentValue: fieldValue,
          fixSuggestion: `請至少輸入 ${rule.minLength} 個字符`
        });
      }

      if (rule.maxLength && fieldValue.length > rule.maxLength) {
        errors.push({
          field: rule.type,
          type: rule.type,
          message: rule.errorMessage || `${rule.type} 長度不能超過 ${rule.maxLength} 個字符`,
          severity: 'error',
          currentValue: fieldValue,
          fixSuggestion: `請將長度控制在 ${rule.maxLength} 個字符以內`
        });
      }

      // 數值範圍驗證
      if (rule.min !== undefined && fieldValue < rule.min) {
        errors.push({
          field: rule.type,
          type: rule.type,
          message: rule.errorMessage || `${rule.type} 不能小於 ${rule.min}`,
          severity: 'error',
          currentValue: fieldValue,
          fixSuggestion: `請輸入不小於 ${rule.min} 的值`
        });
      }

      if (rule.max !== undefined && fieldValue > rule.max) {
        errors.push({
          field: rule.type,
          type: rule.type,
          message: rule.errorMessage || `${rule.type} 不能大於 ${rule.max}`,
          severity: 'error',
          currentValue: fieldValue,
          fixSuggestion: `請輸入不大於 ${rule.max} 的值`
        });
      }

      // 正則表達式驗證
      if (rule.pattern && !rule.pattern.test(fieldValue)) {
        errors.push({
          field: rule.type,
          type: rule.type,
          message: rule.errorMessage || `${rule.type} 格式不正確`,
          severity: 'error',
          currentValue: fieldValue,
          expectedValue: rule.pattern.toString(),
          fixSuggestion: `請按照正確格式填寫 ${rule.type}`
        });
      }

      // 自定義驗證
      if (rule.customValidator) {
        const result = rule.customValidator(fieldValue, context);
        if (result === false) {
          errors.push({
            field: rule.type,
            type: rule.type,
            message: rule.errorMessage || `${rule.type} 驗證失敗`,
            severity: 'error',
            currentValue: fieldValue,
            fixSuggestion: `請檢查 ${rule.type} 的填寫內容`
          });
        } else if (typeof result === 'string') {
          errors.push({
            field: rule.type,
            type: rule.type,
            message: result,
            severity: 'error',
            currentValue: fieldValue,
            fixSuggestion: `請修正 ${rule.type} 的錯誤`
          });
        }
      }

      // 生成警告
      if (rule.warningMessage) {
        warnings.push({
          field: rule.type,
          type: rule.type,
          message: rule.warningMessage,
          recommendation: `建議完善 ${rule.type} 資訊以提高資料品質`
        });
      }
    });

    return { errors, warnings };
  }

  private getFieldValue(data: any, fieldType: ValidationRuleType): any {
    const fieldMapping: Record<ValidationRuleType, string> = {
      'required': 'id',
      'email': 'email',
      'phone': 'phone',
      'id_number': 'idNumber',
      'passport_number': 'passportNumber',
      'credit_card': 'creditCard',
      'date': 'date',
      'age': 'age',
      'address': 'address',
      'zipcode': 'zipcode',
      'name': 'name',
      'company_name': 'companyName',
      'emergency_contact': 'emergencyContact',
      'medical_info': 'medicalInfo',
      'dietary_restrictions': 'dietaryRestrictions',
      'allergies': 'allergies',
      'special_needs': 'specialNeeds'
    };

    const fieldName = fieldMapping[fieldType];
    return data ? data[fieldName] : undefined;
  }

  private isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0);
  }

  private calculateDataQualityScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;

    // 根據錯誤嚴重程度扣分
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 2;
          break;
      }
    });

    // 根據警告扣分
    warnings.forEach(() => {
      score -= 3;
    });

    return Math.max(0, score);
  }

  private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];

    // 根據錯誤類型生成建議
    const errorTypes = new Set(errors.map(e => e.type));
    const warningTypes = new Set(warnings.map(w => w.type));

    if (errorTypes.has('email')) {
      suggestions.push('請確認電子郵件地址的格式正確性');
    }

    if (errorTypes.has('phone')) {
      suggestions.push('請確認電話號碼包含區域號碼且格式正確');
    }

    if (errorTypes.has('id_number')) {
      suggestions.push('請仔細檢查身份證號碼是否正確');
    }

    if (warningTypes.has('passport_number')) {
      suggestions.push('建議檢查護照有效期，確保旅行期間有效');
    }

    if (warningTypes.has('medical_info')) {
      suggestions.push('建議提供詳細的醫療資訊以確保旅行安全');
    }

    if (errorTypes.has('credit_card')) {
      suggestions.push('請確認信用卡號碼正確且在有效期內');
    }

    return suggestions;
  }

  private generateQualityRecommendations(
    overallScore: number,
    commonIssues: Array<{ type: string; count: number; severity: string }>
  ): string[] {
    const recommendations: string[] = [];

    if (overallScore < 60) {
      recommendations.push('資料品質較低，建議全面檢查和修正資料');
    } else if (overallScore < 80) {
      recommendations.push('資料品質中等，建議重點修正常見錯誤');
    } else {
      recommendations.push('資料品質良好，繼續保持');
    }

    // 根據常見問題生成建議
    const issueTypes = commonIssues.map(issue => issue.type);
    
    if (issueTypes.includes('phone')) {
      recommendations.push('加強電話號碼格式驗證培訓');
    }

    if (issueTypes.includes('email')) {
      recommendations.push('建立電子郵件格式標準化流程');
    }

    if (issueTypes.includes('id_number')) {
      recommendations.push('使用身份證號碼驗證工具');
    }

    return recommendations;
  }

  private generateQualityTrends(history: Array<{
    result: ValidationResult;
    validatedAt: string;
  }>): Array<{ date: string; score: number; validationCount: number }> {
    const dailyScores: Record<string, { total: number; count: number }> = {};

    history.forEach(h => {
      const date = h.validatedAt.split('T')[0];
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
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

// 建立全域實例
export const dataValidationService = new DataValidationService();

export default DataValidationService;
