import { Pool } from 'pg';
import type { Expense, CreateExpense, UpdateExpense, ExpenseFilter } from '../types/expense';

export class ExpenseService {
  constructor(private pool: Pool) {}

  private buildWhereClause(filter: ExpenseFilter, params: any[]): string {
    const conditions: string[] = ['user_id = $1'];
    params.push(filter.userId);

    if (filter.startDate) {
      params.push(filter.startDate);
      conditions.push(`date >= $${params.length}`);
    }

    if (filter.endDate) {
      params.push(filter.endDate);
      conditions.push(`date <= $${params.length}`);
    }

    if (filter.category) {
      params.push(filter.category);
      conditions.push(`category = $${params.length}`);
    }

    if (filter.minAmount) {
      params.push(filter.minAmount);
      conditions.push(`amount >= $${params.length}`);
    }

    if (filter.maxAmount) {
      params.push(filter.maxAmount);
      conditions.push(`amount <= $${params.length}`);
    }

    if (filter.search) {
      params.push(`%${filter.search}%`);
      conditions.push(`(description ILIKE $${params.length} OR vendor ILIKE $${params.length})`);
    }

    return conditions.join(' AND ');
  }

  private buildOrderClause(filter: ExpenseFilter): string {
    const orderColumn = filter.sortBy || 'date';
    const orderDirection = filter.sortOrder || 'desc';
    return `ORDER BY ${orderColumn} ${orderDirection.toUpperCase()}`;
  }

  private buildPaginationClause(filter: ExpenseFilter, params: any[]): string {
    const limit = filter.limit || 10;
    const offset = ((filter.page || 1) - 1) * limit;
    params.push(limit, offset);
    return `LIMIT $${params.length - 1} OFFSET $${params.length}`;
  }

  async listExpenses(filter: ExpenseFilter): Promise<{ expenses: Expense[]; totalCount: number }> {
    const params: any[] = [];
    const whereClause = this.buildWhereClause(filter, params);
    const orderClause = this.buildOrderClause(filter);
    const paginationClause = this.buildPaginationClause(filter, params);

    const countQuery = `
      SELECT COUNT(*) as total
      FROM expenses
      WHERE ${whereClause}
    `;

    const selectQuery = `
      SELECT 
        id,
        user_id as "userId",
        amount,
        currency,
        date,
        category,
        description,
        location,
        vendor,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM expenses
      WHERE ${whereClause}
      ${orderClause}
      ${paginationClause}
    `;

    const [countResult, selectResult] = await Promise.all([
      this.pool.query(countQuery, params.slice(0, -2)),
      this.pool.query(selectQuery, params)
    ]);

    return {
      expenses: selectResult.rows,
      totalCount: parseInt(countResult.rows[0].total)
    };
  }

  async createExpense(expense: CreateExpense): Promise<Expense> {
    const query = `
      INSERT INTO expenses (
        user_id,
        amount,
        currency,
        date,
        category,
        description,
        location,
        vendor
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id,
        user_id as "userId",
        amount,
        currency,
        date,
        category,
        description,
        location,
        vendor,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const params = [
      expense.userId,
      expense.amount,
      expense.currency,
      expense.date,
      expense.category,
      expense.description,
      expense.location,
      expense.vendor
    ];

    const result = await this.pool.query(query, params);
    return result.rows[0];
  }

  async updateExpense(expense: UpdateExpense): Promise<Expense> {
    const setColumns: string[] = [];
    const params: any[] = [expense.id];
    let paramCount = 1;

    // Build dynamic SET clause
    if (expense.amount !== undefined) {
      paramCount++;
      params.push(expense.amount);
      setColumns.push(`amount = $${paramCount}`);
    }
    if (expense.currency !== undefined) {
      paramCount++;
      params.push(expense.currency);
      setColumns.push(`currency = $${paramCount}`);
    }
    if (expense.date !== undefined) {
      paramCount++;
      params.push(expense.date);
      setColumns.push(`date = $${paramCount}`);
    }
    if (expense.category !== undefined) {
      paramCount++;
      params.push(expense.category);
      setColumns.push(`category = $${paramCount}`);
    }
    if (expense.description !== undefined) {
      paramCount++;
      params.push(expense.description);
      setColumns.push(`description = $${paramCount}`);
    }
    if (expense.location !== undefined) {
      paramCount++;
      params.push(expense.location);
      setColumns.push(`location = $${paramCount}`);
    }
    if (expense.vendor !== undefined) {
      paramCount++;
      params.push(expense.vendor);
      setColumns.push(`vendor = $${paramCount}`);
    }

    const query = `
      UPDATE expenses
      SET ${setColumns.join(', ')}
      WHERE id = $1
      RETURNING 
        id,
        user_id as "userId",
        amount,
        currency,
        date,
        category,
        description,
        location,
        vendor,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.pool.query(query, params);
    if (result.rows.length === 0) {
      throw new Error('Expense not found');
    }
    return result.rows[0];
  }

  async deleteExpense(id: string): Promise<void> {
    const query = 'DELETE FROM expenses WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    if (result.rowCount === 0) {
      throw new Error('Expense not found');
    }
  }

  async getExpenseById(id: string): Promise<Expense> {
    const query = `
      SELECT 
        id,
        user_id as "userId",
        amount,
        currency,
        date,
        category,
        description,
        location,
        vendor,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM expenses
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    if (result.rows.length === 0) {
      throw new Error('Expense not found');
    }
    return result.rows[0];
  }
}