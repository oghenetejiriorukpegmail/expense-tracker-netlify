import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer';
import { utils, write } from 'xlsx';

interface ReportOptions {
  title: string;
  description?: string;
  period?: {
    start: Date;
    end: Date;
  };
  format: 'pdf' | 'excel' | 'csv';
  sections: ReportSection[];
}

interface ReportSection {
  type: 'summary' | 'chart' | 'table' | 'insights';
  title: string;
  data: any;
}

interface TableData {
  headers: string[];
  rows: any[][];
}

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  description: {
    fontSize: 12,
    marginBottom: 15,
    color: '#666666',
  },
  period: {
    fontSize: 12,
    marginBottom: 20,
    color: '#666666',
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#bfbfbf',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#bfbfbf',
    minHeight: 30,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
  },
  summaryItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insight: {
    fontSize: 12,
    marginBottom: 5,
    color: '#333333',
  },
});

export class ReportService {
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static PDFDocument({ options }: { options: ReportOptions }) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text style={styles.title}>{options.title}</Text>
          
          {options.description && (
            <Text style={styles.description}>{options.description}</Text>
          )}
          
          {options.period && (
            <Text style={styles.period}>
              Period: {this.formatDate(options.period.start)} - {this.formatDate(options.period.end)}
            </Text>
          )}

          {options.sections.map((section, index) => (
            <View key={index}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              
              {section.type === 'summary' && (
                <View>
                  {Object.entries(section.data).map(([key, value], idx) => (
                    <View key={idx} style={styles.summaryItem}>
                      <Text style={styles.summaryLabel}>{key}:</Text>
                      <Text style={styles.summaryValue}>
                        {typeof value === 'number' ? this.formatCurrency(value as number) : value}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {section.type === 'table' && (
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    {(section.data as TableData).headers.map((header, idx) => (
                      <Text key={idx} style={styles.tableCell}>{header}</Text>
                    ))}
                  </View>
                  {(section.data as TableData).rows.map((row, rowIdx) => (
                    <View key={rowIdx} style={styles.tableRow}>
                      {row.map((cell, cellIdx) => (
                        <Text key={cellIdx} style={styles.tableCell}>
                          {typeof cell === 'number' ? this.formatCurrency(cell) : cell}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              {section.type === 'insights' && (
                <View>
                  {(section.data as string[]).map((insight, idx) => (
                    <Text key={idx} style={styles.insight}>• {insight}</Text>
                  ))}
                </View>
              )}
            </View>
          ))}
        </Page>
      </Document>
    );
  }

  private static generateExcel(options: ReportOptions): Blob {
    const wb = utils.book_new();

    options.sections.forEach((section) => {
      let wsData: any[][] = [];

      switch (section.type) {
        case 'summary':
          wsData = Object.entries(section.data).map(([key, value]) => [
            key,
            typeof value === 'number' ? this.formatCurrency(value as number) : value
          ]);
          break;

        case 'table':
          const tableData = section.data as TableData;
          wsData = [tableData.headers, ...tableData.rows];
          break;

        case 'insights':
          wsData = section.data.map((insight: string) => [insight]);
          break;
      }

      const ws = utils.aoa_to_sheet(wsData);
      utils.book_append_sheet(wb, ws, section.title);
    });

    const wbout = write(wb, { bookType: options.format === 'csv' ? 'csv' : 'xlsx', type: 'array' });
    return new Blob([wbout], { 
      type: options.format === 'csv' 
        ? 'text/csv' 
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }

  static getReportComponent(options: ReportOptions) {
    if (options.format === 'pdf') {
      return (
        <PDFDownloadLink
          document={<this.PDFDocument options={options} />}
          fileName={`${options.title.toLowerCase().replace(/\s+/g, '-')}.pdf`}
        >
          {({ blob, url, loading, error }) =>
            loading ? 'Generating PDF...' : 'Download PDF'
          }
        </PDFDownloadLink>
      );
    }
    return null;
  }

  static async generateReport(options: ReportOptions): Promise<Blob> {
    switch (options.format) {
      case 'excel':
      case 'csv':
        return this.generateExcel(options);
      default:
        throw new Error(`Direct blob generation not supported for format: ${options.format}. Use getReportComponent for PDF.`);
    }
  }

  static getDefaultTemplate(type: 'monthly' | 'annual' | 'category'): ReportOptions {
    const now = new Date();
    const templates: Record<string, ReportOptions> = {
      monthly: {
        title: 'Monthly Expense Report',
        period: {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        },
        format: 'pdf',
        sections: [
          {
            type: 'summary',
            title: 'Monthly Overview',
            data: {}
          },
          {
            type: 'table',
            title: 'Expense Details',
            data: { headers: [], rows: [] }
          },
          {
            type: 'insights',
            title: 'Key Insights',
            data: []
          }
        ]
      },
      annual: {
        title: 'Annual Expense Report',
        period: {
          start: new Date(now.getFullYear(), 0, 1),
          end: new Date(now.getFullYear(), 11, 31)
        },
        format: 'pdf',
        sections: [
          {
            type: 'summary',
            title: 'Annual Overview',
            data: {}
          },
          {
            type: 'table',
            title: 'Monthly Breakdown',
            data: { headers: [], rows: [] }
          },
          {
            type: 'insights',
            title: 'Annual Insights',
            data: []
          }
        ]
      },
      category: {
        title: 'Category Analysis Report',
        period: {
          start: new Date(now.getFullYear(), now.getMonth() - 11, 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        },
        format: 'pdf',
        sections: [
          {
            type: 'summary',
            title: 'Category Overview',
            data: {}
          },
          {
            type: 'table',
            title: 'Category Details',
            data: { headers: [], rows: [] }
          },
          {
            type: 'insights',
            title: 'Category Insights',
            data: []
          }
        ]
      }
    };

    return templates[type];
  }
}