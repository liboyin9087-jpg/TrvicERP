import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register Chinese font from Google Fonts
Font.register({
  family: 'NotoSansTC',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829Oofr2wohFbTp9ifNAn722rq0MXz76Cy_CpOtma3uNQ.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosanstc/v35/-nFuOG829Oofr2wohFbTp9ifNAn722rq0MXz7_O9_CpOtma3uNQ.ttf',
      fontWeight: 'bold',
    },
  ],
});

// Types
export interface QuoteItem {
  id: string;
  category: string;
  name: string;
  unitPrice: number;
}

export interface QuotationPDFProps {
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
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'NotoSansTC',
    fontSize: 10,
    color: '#1a1a1a',
  },
  header: {
    borderBottomWidth: 3,
    borderBottomColor: '#000',
    paddingBottom: 20,
    marginBottom: 24,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  logoSub: {
    fontSize: 11,
    color: '#666',
  },
  tripInfo: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  tripName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metaText: {
    fontSize: 10,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemsContainer: {
    marginBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemCategory: {
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontSize: 8,
    color: '#666',
    marginRight: 8,
  },
  itemName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemPrice: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Helvetica',
  },
  summary: {
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#888',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Helvetica',
  },
  summaryValueAccent: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#06c167',
    fontFamily: 'Helvetica',
  },
  summaryDivider: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 10,
    paddingTop: 12,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06c167',
    fontFamily: 'Helvetica',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 8,
    color: '#888',
    textAlign: 'center',
  },
});

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return `NT$ ${amount.toLocaleString()}`;
};

// PDF Document Component
export default function QuotationPDF({
  tripName,
  paxCount,
  items,
  marginRate,
  totalCost,
  sellingPrice,
  totalRevenue,
  profit,
}: QuotationPDFProps) {
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
