
import React, { useState } from 'react';
import { Transaction } from '@/components/types';

interface TransactionFormProps {
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  transactions: Transaction[];
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ setTransactions, transactions }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [error, setError] = useState('');
  
  // Get unique categories from existing transactions
  const existingCategories = React.useMemo(() => {
    const categories = new Set<string>();
    transactions.forEach(t => categories.add(t.category));
    return Array.from(categories);
  }, [transactions]);
  
  // Predefined categories based on transaction type
  const expenseCategories = [
    'Food', 'Housing', 'Transportation', 'Entertainment', 
    'Healthcare', 'Education', 'Utilities', 'Shopping', 'Personal', 'Other'
  ];
  
  const incomeCategories = [
    'Salary', 'Freelance', 'Investments', 'Gifts', 'Refunds', 'Other'
  ];
  
  // Combine predefined and existing categories, removing duplicates
  const availableCategories = React.useMemo(() => {
    const combined = type === 'expense' ? [...expenseCategories] : [...incomeCategories];
    
    // Add categories from existing transactions of the same type that aren't in the predefined list
    existingCategories.forEach(cat => {
      if (!combined.includes(cat)) {
        combined.push(cat);
      }
    });
    
    return combined;
  }, [type, existingCategories, expenseCategories, incomeCategories]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    const finalCategory = showCustomCategory ? customCategory.trim() : category;
    
    if (!finalCategory) {
      setError('Please select or enter a category');
      return;
    }
    
    // Create new transaction
    const newTransaction: Transaction = {
      description: description.trim(),
      amount: parseFloat(amount),
      category: finalCategory,
      type,
      date
    };
    
    // Add to transactions list
    setTransactions(prev => [...prev, newTransaction]);
    
    // Reset form
    setDescription('');
    setAmount('');
    setCategory(finalCategory); // Set the current category as the selected one
    setCustomCategory('');
    setShowCustomCategory(false);
    setError('');
    
    // Show success animation (add a class then remove it)
    const form = document.getElementById('transaction-form');
    if (form) {
      form.classList.add('animate-scale-in');
      setTimeout(() => {
        form.classList.remove('animate-scale-in');
      }, 300);
    }
  };
  
  return (
    <div className="glass-card p-6 animate-slide-in">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Add Transaction</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
          {error}
        </div>
      )}
      
      <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transaction Type
          </label>
          <div className="flex rounded-lg overflow-hidden">
            <button
              type="button"
              className={`flex-1 py-2 text-center text-sm font-medium transition-colors
                ${type === 'expense' 
                  ? 'bg-red-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setType('expense')}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-center text-sm font-medium transition-colors
                ${type === 'income' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
              onClick={() => setType('income')}
            >
              Income
            </button>
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <input
            type="text"
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-clean"
            placeholder={type === 'expense' ? 'e.g., Grocery shopping' : 'e.g., Monthly salary'}
          />
        </div>
        
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount ($)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input-clean"
            placeholder="0.00"
            min="0"
            step="0.01"
          />
        </div>
        
        {!showCustomCategory ? (
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <div className="flex">
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-clean rounded-r-none flex-1"
              >
                <option value="">Select a category</option>
                {availableCategories.map((cat, index) => (
                  <option key={index} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setShowCustomCategory(true);
                  setCustomCategory('');
                }}
                className="bg-gray-200 text-gray-800 px-3 rounded-r-lg hover:bg-gray-300 transition-colors"
                title="Add custom category"
              >
                +
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="custom-category" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Category
            </label>
            <div className="flex">
              <input
                type="text"
                id="custom-category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="input-clean rounded-r-none flex-1"
                placeholder="Enter custom category"
              />
              <button
                type="button"
                onClick={() => {
                  setShowCustomCategory(false);
                  setCategory('');
                }}
                className="bg-gray-200 text-gray-800 px-3 rounded-r-lg hover:bg-gray-300 transition-colors"
                title="Use predefined category"
              >
                ←
              </button>
            </div>
          </div>
        )}
        
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-clean"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
        
        <div className="pt-2">
          <button type="submit" className="button-primary w-full">
            Add Transaction
          </button>
        </div>
      </form>
    </div>
  );
};
