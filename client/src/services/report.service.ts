import jsPDF from 'jspdf';
import 'jspdf-autotable';
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

interface ChartData {
  type: 'pie' | 'line' | 'bar';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

interface TableData {
  headers: string[];
  rows: any[][];
}

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

  private static async generatePDF(options: ReportOptions): Promise<Blob> {
    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text(options.title, 20, yPos);
    yPos += 10;

    // Description & Period
    if (options.description || options.period) {
      doc.setFontSize(12);
      if (options.description) {
        doc.text(options.description, 20, yPos);
        yPos += 10;
      }
      if (options.period) {
        const periodText = `Period: ${this.formatDate(options.period.start)} - ${this.formatDate(options.period.end)}`;
        doc.text(periodText, 20, yPos);
        yPos += 15;
      }
    }

    // Sections
    for (const section of options.sections) {
      // Section Title
      doc.setFontSize(14);
      doc.text(section.title, 20, yPos);
      yPos += 10;

      switch (section.type) {
        case 'summary':
          doc.setFontSize(12);
          Object.entries(section.data).forEach(([key, value]) => {
            const text = `${key}: ${typeof value === 'number' ? this.formatCurrency(value as number) : value}`;
            doc.text(text, 25, yPos);
            yPos += 7;
          });
          yPos += 5;
          break;

        case 'table':
          const tableData = section.data as TableData;
          (doc as any).autoTable({
            startY: yPos,
            head: [tableData.headers],
            body: tableData.rows,
            margin: { left: 20 },
          });
          yPos = (doc as any).lastAutoTable.finalY + 15;
          break;

        case 'insights':
          doc.setFontSize(12);
          section.data.forEach((insight: string) => {
            doc.text('• ' + insight, 25, yPos);
            yPos += 7;
          });
          yPos += 5;
          break;
      }

      // Add page if needed
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    }

    return doc.output('blob');
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
    return new Blob([wbout], { type: options.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  static async generateReport(options: ReportOptions): Promise<Blob> {
    switch (options.format) {
      case 'pdf':
        return this.generatePDF(options);
      case 'excel':
      case 'csv':
        return this.generateExcel(options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
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
            type: 'chart',
            title: 'Expense Distribution',
            data: { type: 'pie', labels: [], datasets: [] }
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
            type: 'chart',
            title: 'Monthly Trends',
            data: { type: 'line', labels: [], datasets: [] }
          },
          {
            type: 'chart',
            title: 'Category Distribution',
            data: { type: 'pie', labels: [], datasets: [] }
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
            type: 'chart',
            title: 'Category Trends',
            data: { type: 'line', labels: [], datasets: [] }
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