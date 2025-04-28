export interface ExpenseData {
  id: string;
  userId: string;
  date: string;
  amount: number;
  category?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Context {
  user: User;
  db: {
    query: {
      expenses: {
        findMany: (options: {
          where: {
            userId: string;
            date?: {
              gte?: Date;
              lte?: Date;
            };
          };
        }) => Promise<ExpenseData[]>;
      };
    };
  };
}

export interface ReportGenerationResult {
  url: string;
  filename: string;
}