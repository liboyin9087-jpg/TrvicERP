import React, { memo } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

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

import { formatCurrency } from '@/lib/utils/formatting';

const QuotationPDF: React.FC<QuotationPDFProps> = memo(({
  tripName,
  paxCount,
  items,
  marginRate,
  totalCost,
  sellingPrice,
  totalRevenue,
  profit,
}) => {
  const currentDate = new Date().toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document aria-label="旅遊報價單">
      <Page size="A4" style={styles.page} aria-label="報價單內容">
        <View style={styles.header} aria-label="標題區">
          <Text style={styles.logo} aria-label="系統名稱">TrvicERP</Text>
          <Text style={styles.logoSub} aria-label="文件類型">專業旅遊規劃報價單</Text>
        </View>

        <View style={styles.tripInfo} aria-label="行程資訊">
          <Text style={styles.tripName} aria-label="行程名稱">{tripName}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText} aria-label="預估人數">預估人數：{paxCount} 人</Text>
            <Text style={styles.metaText} aria-label="製作日期">製作日期：{currentDate}</Text>
          </View>
        </View>

        <View style={styles.itemsContainer} aria-label="成本明細">
          <Text style={styles.sectionTitle}>成本明細</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow} aria-label={`項目-${item.name}`}>
              <View style={styles.itemLeft}>
                <Text style={styles.itemCategory} aria-label="項目類別">{item.category}</Text>
                <Text style={styles.itemName} aria-label="項目名稱">{item.name}</Text>
              </View>
              <Text style={styles.itemPrice} aria-label="項目價格">{formatCurrency(item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary} aria-label="總結資訊">
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>成本/人</Text>
            <Text style={styles.summaryValue} aria-label="每人成本">{formatCurrency(totalCost)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>利潤率</Text>
            <Text style={styles.summaryValue} aria-label="利潤率">{marginRate}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>售價/人</Text>
            <Text style={styles.summaryValueAccent} aria-label="每人售價">{formatCurrency(sellingPrice)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>預估營收</Text>
            <Text style={styles.summaryValue} aria-label="預估營收">{formatCurrency(totalRevenue)}</Text>
          </View>
          <View style={[styles.summaryTotal, styles.summaryDivider]}>
            <Text style={styles.summaryTotalLabel}>預估利潤</Text>
            <Text style={styles.summaryTotalValue} aria-label="預估利潤">{formatCurrency(profit)}</Text>
          </View>
        </View>

        <View style={styles.footer} aria-label="頁尾資訊">
          <Text style={styles.footerText}>
            此報價單由 TrvicERP 系統產生 | {currentDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
});

export default QuotationPDF;