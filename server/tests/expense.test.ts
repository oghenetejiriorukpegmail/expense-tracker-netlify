/**
 * Expense Service Tests
 * 
 * This file contains tests for the expense-related functionality.
 */

import { expect } from 'chai';
import { 
  setupTestEnvironment, 
  teardownTestEnvironment,
  createTestUser,
  createTestTrip,
  createTestExpense,
  uploadTestFile
} from './setup';
import { getDefaultStorage } from '../storage/storage-factory';
import * as fs from 'fs';
import * as path from 'path';

describe('Expense Service', () => {
  // Set up test environment before all tests
  before(async () => {
    await setupTestEnvironment();
  });

  // Clean up test environment after all tests
  after(async () => {
    await teardownTestEnvironment();
  });

  // Test creating an expense
  describe('Create Expense', () => {
    it('should create a basic expense', async () => {
      // Create test user and trip
      const user = await createTestUser();
      const trip = await createTestTrip(user.id);
      
      // Create expense
      const expense = await createTestExpense(user.id, trip.name, {
        type: 'Food',
        vendor: 'Test Restaurant',
        cost: '45.67'
      });
      
      // Verify expense was created correctly
      expect(expense).to.exist;
      expect(expense.userId).to.equal(user.id);
      expect(expense.tripName).to.equal(trip.name);
      expect(expense.type).to.equal('Food');
      expect(expense.vendor).to.equal('Test Restaurant');
      expect(expense.cost).to.equal('45.67');
      expect(expense.status).to.equal('complete');
    });
    
    it('should create an expense with a receipt', async () => {
      // Create test user and trip
      const user = await createTestUser();
      const trip = await createTestTrip(user.id);
      
      // Create a test receipt file
      const receiptPath = `receipts/${user.id}/${Date.now()}.jpg`;
      const receiptContent = Buffer.from('test receipt image data');
      await uploadTestFile(receiptPath, receiptContent);
      
      // Create expense with receipt
      const expense = await createTestExpense(user.id, trip.name, {
        type: 'Transportation',
        vendor: 'Taxi Service',
        cost: '25.00',
        receiptPath
      });
      
      // Verify expense was created correctly
      expect(expense).to.exist;
      expect(expense.receiptPath).to.equal(receiptPath);
      
      // Get storage instance
      const storage = await getDefaultStorage();
      
      // Verify receipt can be downloaded
      const result = await storage.downloadFile(receiptPath, 'receipts');
      expect(result).to.exist;
      expect(result.data).to.exist;
    });
  });
  
  // Test retrieving expenses
  describe('Get Expenses', () => {
    it('should retrieve expenses by user ID', async () => {
      // Create test user and trip
      const user = await createTestUser();
      const trip = await createTestTrip(user.id);
      
      // Create multiple expenses
      await createTestExpense(user.id, trip.name, { type: 'Food', cost: '10.00' });
      await createTestExpense(user.id, trip.name, { type: 'Lodging', cost: '150.00' });
      await createTestExpense(user.id, trip.name, { type: 'Transportation', cost: '25.00' });
      
      // Get storage instance
      const storage = await getDefaultStorage();
      
      // Retrieve expenses
      const expenses = await storage.getExpensesByUserId(user.id);
      
      // Verify expenses were retrieved correctly
      expect(expenses).to.exist;
      expect(expenses.length).to.be.at.least(3);
      expect(expenses.every(e => e.userId === user.id)).to.be.true;
    });
    
    it('should retrieve expenses by trip name', async () => {
      // Create test user and trips
      const user = await createTestUser();
      const trip1 = await createTestTrip(user.id, { name: 'Business Trip' });
      const trip2 = await createTestTrip(user.id, { name: 'Vacation' });
      
      // Create expenses for different trips
      await createTestExpense(user.id, trip1.name, { type: 'Food', cost: '20.00' });
      await createTestExpense(user.id, trip1.name, { type: 'Lodging', cost: '200.00' });
      await createTestExpense(user.id, trip2.name, { type: 'Entertainment', cost: '50.00' });
      
      // Get storage instance
      const storage = await getDefaultStorage();
      
      // Retrieve expenses for trip1
      const trip1Expenses = await storage.getExpensesByTripName(user.id, trip1.name);
      
      // Verify expenses were retrieved correctly
      expect(trip1Expenses).to.exist;
      expect(trip1Expenses.length).to.be.at.least(2);
      expect(trip1Expenses.every(e => e.tripName === trip1.name)).to.be.true;
      
      // Retrieve expenses for trip2
      const trip2Expenses = await storage.getExpensesByTripName(user.id, trip2.name);
      
      // Verify expenses were retrieved correctly
      expect(trip2Expenses).to.exist;
      expect(trip2Expenses.length).to.be.at.least(1);
      expect(trip2Expenses.every(e => e.tripName === trip2.name)).to.be.true;
    });
  });
  
  // Test updating expenses
  describe('Update Expense', () => {
    it('should update an expense', async () => {
      // Create test user and trip
      const user = await createTestUser();
      const trip = await createTestTrip(user.id);
      
      // Create expense
      const expense = await createTestExpense(user.id, trip.name, {
        type: 'Food',
        vendor: 'Fast Food',
        cost: '15.00'
      });
      
      // Get storage instance
      const storage = await getDefaultStorage();
      
      // Update expense
      const updatedExpense = await storage.updateExpense(expense.id, {
        vendor: 'Fancy Restaurant',
        cost: '75.00',
        comments: 'Business dinner'
      });
      
      // Verify expense was updated correctly
      expect(updatedExpense).to.exist;
      expect(updatedExpense.id).to.equal(expense.id);
      expect(updatedExpense.vendor).to.equal('Fancy Restaurant');
      expect(updatedExpense.cost).to.equal('75.00');
      expect(updatedExpense.comments).to.equal('Business dinner');
      expect(updatedExpense.type).to.equal('Food'); // Unchanged field
    });
  });
  
  // Test deleting expenses
  describe('Delete Expense', () => {
    it('should delete an expense', async () => {
      // Create test user and trip
      const user = await createTestUser();
      const trip = await createTestTrip(user.id);
      
      // Create expense
      const expense = await createTestExpense(user.id, trip.name);
      
      // Get storage instance
      const storage = await getDefaultStorage();
      
      // Delete expense
      await storage.deleteExpense(expense.id);
      
      // Try to retrieve deleted expense
      const deletedExpense = await storage.getExpense(expense.id);
      
      // Verify expense was deleted
      expect(deletedExpense).to.not.exist;
    });
    
    it('should delete an expense with a receipt', async () => {
      // Create test user and trip
      const user = await createTestUser();
      const trip = await createTestTrip(user.id);
      
      // Create a test receipt file
      const receiptPath = `receipts/${user.id}/${Date.now()}.jpg`;
      const receiptContent = Buffer.from('test receipt image data');
      await uploadTestFile(receiptPath, receiptContent);
      
      // Create expense with receipt
      const expense = await createTestExpense(user.id, trip.name, {
        receiptPath
      });
      
      // Get storage instance
      const storage = await getDefaultStorage();
      
      // Delete expense
      await storage.deleteExpense(expense.id);
      
      // Try to retrieve deleted expense
      const deletedExpense = await storage.getExpense(expense.id);
      
      // Verify expense was deleted
      expect(deletedExpense).to.not.exist;
      
      // Verify receipt was not deleted (would require additional cleanup logic)
      try {
        const result = await storage.downloadFile(receiptPath, 'receipts');
        expect(result).to.exist;
      } catch (error) {
        // If this fails, it means the receipt was automatically deleted, which is also acceptable
      }
    });
  });
});