import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// Assuming global font registration is handled elsewhere.
// For example, in `utils/registerFonts.ts`:
// import { Font } from '@react-pdf/renderer';
// export const registerQuotationFonts = () => {
//   if (!Font.getRegisteredFonts().includes('NotoSansTC')) {
//     Font.register({
//       family: 'NotoSansTC',
//       fonts: [
//         { src: 'https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829Oofr2wohFbTp9ifNAn722rq0MXz76Cy_CpOtma3uNQ.ttf', fontWeight: 'normal' },
//         { src: 'https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829Oofr2wohFbTp9ifNAn722rq0MXz7_O9_CpOtma3uNQ.ttf', fontWeight: 'bold' },
//       ],
//     });
//   }
// };
// And then called once at application startup (e.g., in _app.tsx or index.ts).
// This component should not register fonts directly to prevent repeated registration.

// Design Tokens (mimicking Tailwind CSS values)
// In a real project, this would be imported from a centralized file like `utils/designTokens.ts`
const designTokens = {
  colors: {
    white: '#ffffff',
    black: '#000000',
    'gray-50': '#f9fafb',
    'gray-100': '#f3f4f6', // Closest to original #f5f5f5
    'gray-200': '#e5e7eb', // Closest to original #eee, #e5e5e5
    'gray-500': '#6b7280', // Closest to original #888
    'gray-600': '#4b5563', // Closest to original #666
    'gray-700': '#374151', // Closest to original #333
    'gray-900': '#111827', // Closest to original #1a1a1a
    'success-600': '#059669', // Closest to original #06c167
  },
  spacing: {
    px: 1,
    0: 0,
    1: 4,  // 4px/pt
    2: 8,  // 8px/pt
    3: 12, // 12px/pt
    4: 16, // 16px/pt
    5: 20, // 20px/pt
    6: 24, // 24px/pt
    8: 32, // 32px/pt (approx for original 30)
    10: 40, // 40px/pt
  },
  borderRadius: {
    DEFAULT: 4, // for original 4
    lg: 8,      // for original 8
  },
  fontSize: {
    xs: 8,  // for original 8
    sm: 10, // for original 10
    base: 12, // for original 12 (and approximated 11)
    '2xl': 18, // for original 18
    '4xl': 24, // for original 24
  },
};

// Types
export interface QuoteItem {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
}

// Renamed from QuotationPDFProps to QuotationPDFConfig for clarity and Kintone independence
// This interface defines all necessary props, allowing the component to be configured externally.
export interface QuotationPDFConfig {
  tripName: string;
  paxCount: number;
  items: QuoteItem[];
  marginRate: number;
  totalCost: number;
  sellingPrice: number;
  totalRevenue: number;
  profit: number;
}

// Styles
// Using design tokens for colors, spacing, and font sizes to align with Dashtail UI规范
const styles = StyleSheet.create({
  page: {
    padding: designTokens.spacing[10], // Original 40
    fontFamily: 'NotoSansTC',
    fontSize: designTokens.fontSize.sm, // Original 10
    color: designTokens.colors['gray-900'], // Original #1a1a1a
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: designTokens.colors.black, // Original #000
    paddingBottom: designTokens.spacing[5], // Original 20
    marginBottom: designTokens.spacing[6], // Original 24
  },
  logo: {
    fontSize: designTokens.fontSize['4xl'], // Original 24
    fontWeight: 'bold',
    marginBottom: designTokens.spacing[1], // Original 4
  },
  logoSub: {
    fontSize: 11, // Keeping 11 as it's a specific size not directly mapped to token
    color: designTokens.colors['gray-600'], // Original #666
  },
  tripInfo: {
    backgroundColor: designTokens.colors['gray-100'], // Original #f5f5f5
    padding: designTokens.spacing[4], // Original 16
    borderRadius: designTokens.borderRadius.lg, // Original 8
    marginBottom: designTokens.spacing[5], // Original 20
  },
  tripName: {
    fontSize: designTokens.fontSize['2xl'], // Original 18
    fontWeight: 'bold',
    marginBottom: designTokens.spacing[2], // Original 8
  },
  metaRow: {
    flexDirection: 'row',
    gap: designTokens.spacing[6], // Original 24
  },
  metaText: {
    fontSize: designTokens.fontSize.sm, // Original 10
    color: designTokens.colors['gray-600'], // Original #666
  },
  sectionTitle: {
    fontSize: designTokens.fontSize.base, // Original 12
    fontWeight: 'bold',
    color: designTokens.colors['gray-700'], // Original #333
    marginBottom: designTokens.spacing[3], // Original 12
    paddingBottom: designTokens.spacing[2], // Original 6, approximated to 8
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors['gray-200'], // Original #eee
  },
  itemsContainer: {
    marginBottom: designTokens.spacing[6], // Original 24
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing[2], // Original 10, approximated to 8
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors['gray-200'], // Original #eee
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCategory: {
    backgroundColor: designTokens.colors['gray-200'], // Original #e5e5e5
    paddingHorizontal: designTokens.spacing[1], // Original 6, approximated to 4
    paddingVertical: designTokens.spacing.px, // Original 2, approximated to 1
    borderRadius: designTokens.borderRadius.DEFAULT, // Original 4
    fontSize: designTokens.fontSize.xs, // Original 8
    color: designTokens.colors['gray-600'], // Original #666
    marginRight: designTokens.spacing[2], // Original 8
  },
  itemName: {
    fontSize: designTokens.fontSize.sm, // Original 10
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: designTokens.fontSize.sm, // Original 10
    fontWeight: 'bold',
    fontFamily: 'Helvetica', // Retaining Helvetica for numbers as in original
  },
  summary: {
    backgroundColor: designTokens.colors['gray-900'], // Original #1a1a1a
    padding: designTokens.spacing[5], // Original 20
    borderRadius: designTokens.borderRadius.lg, // Original 8
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: designTokens.spacing[1], // Original 6, approximated to 4
  },
  summaryLabel: {
    fontSize: designTokens.fontSize.sm, // Original 10
    color: designTokens.colors['gray-500'], // Original #888
  },
  summaryValue: {
    fontSize: designTokens.fontSize.sm, // Original 10
    fontWeight: 'bold',
    color: designTokens.colors.white, // Original #fff
    fontFamily: 'Helvetica', // Retaining Helvetica for numbers
  },
  summaryValueAccent: {
    fontSize: designTokens.fontSize.sm, // Original 10
    fontWeight: 'bold',
    color: designTokens.colors['success-600'], // Original #06c167
    fontFamily: 'Helvetica', // Retaining Helvetica for numbers
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: designTokens.colors['gray-700'], // Original #333
    marginTop: designTokens.spacing[2], // Original 10, approximated to 8
    paddingTop: designTokens.spacing[3], // Original 12
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: designTokens.fontSize.base, // Original 12
    color: designTokens.colors.white, // Original #fff
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: designTokens.fontSize['2xl'], // Original 18
    fontWeight: 'bold',
    color: designTokens.colors['success-600'], // Original #06c167
    fontFamily: 'Helvetica', // Retaining Helvetica for numbers
  },
  footer: {
    position: 'absolute',
    bottom: designTokens.spacing[8], // Original 30, approximated to 32
    left: designTokens.spacing[10], // Original 40
    right: designTokens.spacing[10], // Original 40
    paddingTop: designTokens.spacing[3], // Original 12
    borderTopWidth: 1,
    borderTopColor: designTokens.colors['gray-200'], // Original #eee
  },
  footerText: {
    fontSize: designTokens.fontSize.xs, // Original 8
    color: designTokens.colors['gray-500'], // Original #888
    textAlign: 'center',
  },
});

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `NT$ ${amount.toLocaleString()}`;
};

/**
 * QuotationPDF Component
 * Renders a PDF document for a travel quotation.
 *
 * This component is designed to be purely data-driven, receiving all necessary information
 * via its `QuotationPDFConfig` props, adhering to the Kintone independence principle.
 *
 * Architectural Fixes:
 * - Font registration is assumed to be handled globally (e.g., in `utils/registerFonts.ts`)
 *   and not within this component to prevent duplicates.
 * - Styles use a centralized `designTokens` object for colors, spacing, and typography
 *   to avoid hardcoded values and align with Dashtail UI design principles.
 * - The component focuses solely on rendering the PDF structure based on props,
 *   separating concerns from data fetching or global state management.
 * - For props with default values, they should be defined during destructuring
 *   or via a utility function if applicable (e.g., `({ prop = defaultValue }: QuotationPDFConfig) => ...`).
 *   Currently, all props are considered mandatory for a valid quotation.
 *
 * Design Fixes:
 * - Hardcoded color values replaced with references to `designTokens.colors` (e.g., `designTokens.colors['gray-900']`).
 * - Spacing, font sizes, and border-radius are also mapped to `designTokens` for consistency.
 * - `@react-pdf/renderer` does not support direct Tailwind CSS classes, so styles are defined
 *   using `StyleSheet.create` with values derived from `designTokens` to emulate the design system.
 * - The `drag-handle` structure is not applicable here as this component generates a PDF document,
 *   not an interactive UI widget within the Dashtail ERP interface. If a preview of this PDF
 *   were to be rendered as a draggable widget, the `drag-handle` would be part of the parent
 *   wrapper component.
 */
export default function QuotationPDF({
  tripName,
  paxCount,
  items,
  marginRate,
  totalCost,
  sellingPrice,
  totalRevenue,
  profit,
}: QuotationPDFConfig) {
  // Business logic for date formatting, kept within the component as it's presentation logic.
  const currentDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>TravelMaster</Text>
          <Text style={styles.logoSub}>專業旅遊規劃報價單</Text>
        </View>

        {/* Trip Info */}
        <View style={styles.tripInfo}>
          <Text style={styles.tripName}>{tripName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>預估人數：{paxCount} 人</Text>
            <Text style={styles.metaText}>製作日期：{currentDate}</Text>
          </View>
        </View>

        {/* Cost Items */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>成本明細</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemName}>{item.name}</Text>
              </View>
              <Text style={styles.itemPrice}>{formatCurrency(item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>成本/人</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>利潤率</Text>
            <Text style={styles.summaryValue}>{marginRate}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>售價/人</Text>
            <Text style={styles.summaryValueAccent}>{formatCurrency(sellingPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>預估營收</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalRevenue)}</Text>
          </View>
          <View style={[styles.summaryTotal, styles.summaryDivider]}>
            <Text style={styles.summaryTotalLabel}>預估利潤</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(profit)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            此報價單由 TravelMaster Enterprise 系統產生 | {currentDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}