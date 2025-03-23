
import React, { useState, useMemo } from 'react';
import { Transaction, Budget } from '@/components/types';

interface BudgetSetupProps {
  budgets: Budget[];
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  transactions: Transaction[];
}

export const BudgetSetup: React.FC<BudgetSetupProps> = ({ 
  budgets, 
  setBudgets, 
  transactions 
}) => {
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [error, setError] = useState('');
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  
  // Get unique expense categories from transactions
  const expenseCategories = useMemo(() => {
    const categories = new Set<string>();
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => categories.add(t.category));
    return Array.from(categories);
  }, [transactions]);
  
  // Predefined categories
  const predefinedCategories = [
    'Food', 'Housing', 'Transportation', 'Entertainment', 
    'Healthcare', 'Education', 'Utilities', 'Shopping', 'Personal', 'Other'
  ];
  
  // Combine predefined and transaction categories, removing duplicates
  const availableCategories = useMemo(() => {
    const combined = [...predefinedCategories];
    
    // Add categories from transactions that aren't in the predefined list
    expenseCategories.forEach(cat => {
      if (!combined.includes(cat)) {
        combined.push(cat);
      }
    });
    
    // Remove categories that already have budgets
    const budgetCategories = budgets.map(b => b.category);
    return combined.filter(cat => !editingBudget && !budgetCategories.includes(cat));
  }, [predefinedCategories, expenseCategories, budgets, editingBudget]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const finalCategory = showCustomCategory ? customCategory.trim() : category;
    
    if (!finalCategory) {
      setError('Please select or enter a category');
      return;
    }
    
    if (!limit || parseFloat(limit) <= 0) {
      setError('Please enter a valid limit amount');
      return;
    }
    
    if (editingBudget) {
      // Update existing budget
      const updatedBudget: Budget = {
        ...editingBudget,
        limit: parseFloat(limit)
      };
      
      setBudgets(prev => 
        prev.map(b => 
          b === editingBudget ? updatedBudget : b
        )
      );
      
      setEditingBudget(null);
    } else {
      // Check if budget for this category already exists
      if (budgets.some(b => b.category === finalCategory)) {
        setError(`A budget for ${finalCategory} already exists`);
        return;
      }
      
      // Create new budget
      const newBudget: Budget = {
        category: finalCategory,
        limit: parseFloat(limit)
      };
      
      setBudgets(prev => [...prev, newBudget]);
    }
    
    // Reset form
    setCategory('');
    setLimit('');
    setCustomCategory('');
    setShowCustomCategory(false);
    setError('');
  };
  
  const startEditing = (budget: Budget) => {
    setEditingBudget(budget);
    setCategory(budget.category);
    setLimit(budget.limit.toString());
    setError('');
  };
  
  const cancelEditing = () => {
    setEditingBudget(null);
    setCategory('');
    setLimit('');
    setError('');
  };
  
  const deleteBudget = (budget: Budget) => {
    if (window.confirm(`Are you sure you want to delete the budget for ${budget.category}?`)) {
      setBudgets(prev => prev.filter(b => b !== budget));
    }
  };
  
  // Calculate spending for each budget
  const budgetsWithSpending = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = (spent / budget.limit) * 100;
      
      return {
        ...budget,
        spent,
        percentage,
        status: percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : 'safe'
      };
    }).sort((a, b) => b.percentage - a.percentage); // Sort by percentage (highest first)
  }, [budgets, transactions]);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Budget Form */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {editingBudget ? 'Edit Budget' : 'Create Budget'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            
            {editingBudget ? (
              <input
                type="text"
                value={category}
                className="input-clean bg-gray-50"
                readOnly
              />
            ) : !showCustomCategory ? (
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
            ) : (
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
            )}
          </div>
          
          <div>
            <label htmlFor="limit" className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Limit ($)
            </label>
            <input
              type="number"
              id="limit"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              className="input-clean"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div className="flex space-x-3 pt-2">
            {editingBudget ? (
              <>
                <button type="submit" className="button-primary flex-1">
                  Save Changes
                </button>
                <button 
                  type="button" 
                  onClick={cancelEditing}
                  className="button-secondary"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button type="submit" className="button-primary w-full">
                Add Budget
              </button>
            )}
          </div>
        </form>
        
        {/* Budget tips */}
        {!editingBudget && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Budgeting Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• For essentials like rent and food, aim for 50-60% of income</li>
              <li>• Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
              <li>• Review and adjust your budgets monthly</li>
            </ul>
          </div>
        )}
      </div>
      
      {/* Budget List */}
      <div className="lg:col-span-2 glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Budgets</h2>
        
        {budgetsWithSpending.length > 0 ? (
          <div className="space-y-6">
            {budgetsWithSpending.map((budget, index) => (
              <div key={index} className="bg-white bg-opacity-60 p-4 rounded-lg hover-scale">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium text-gray-900">{budget.category}</h3>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEditing(budget)}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteBudget(budget)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">
                    ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                  </span>
                  <span className={`font-medium
                    ${budget.status === 'danger' ? 'text-red-600' : 
                      budget.status === 'warning' ? 'text-amber-600' : 'text-green-600'}`}
                  >
                    {budget.percentage.toFixed(0)}%
                  </span>
                </div>
                
                <div className="budget-progress">
                  <div 
                    className={`budget-progress-bar budget-${budget.status}`}
                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                  />
                </div>
                
                <div className="mt-3 text-xs text-gray-500">
                  {budget.status === 'danger' && (
                    <p className="text-red-600">Over budget! Consider reducing spending in this category.</p>
                  )}
                  {budget.status === 'warning' && (
                    <p className="text-amber-600">Approaching limit. Monitor your spending closely.</p>
                  )}
                  {budget.status === 'safe' && (
                    <p className="text-green-600">Within budget. You're doing well!</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white bg-opacity-50 rounded-lg">
            <p className="text-gray-500 mb-3">You haven't set any budgets yet.</p>
            <p className="text-sm text-gray-600">
              Create budgets to help track and control your spending in different categories.
            </p>
          </div>
        )}
        
        {/* Budget summary */}
        {budgetsWithSpending.length > 0 && (
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Budget Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Total Budgeted</p>
                <p className="text-base font-medium text-gray-900">
                  ${budgetsWithSpending.reduce((sum, b) => sum + b.limit, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Spent</p>
                <p className="text-base font-medium text-gray-900">
                  ${budgetsWithSpending.reduce((sum, b) => sum + b.spent, 0).toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-base font-medium">
                  {budgetsWithSpending.some(b => b.status === 'danger') ? (
                    <span className="text-red-600">Over Budget</span>
                  ) : budgetsWithSpending.some(b => b.status === 'warning') ? (
                    <span className="text-amber-600">Caution</span>
                  ) : (
                    <span className="text-green-600">On Track</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
