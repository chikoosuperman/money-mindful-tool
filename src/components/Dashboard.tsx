
import React, { useMemo } from 'react';
import { Transaction, Budget, SavingsGoal } from '@/components/types';

interface DashboardProps {
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, 
  budgets, 
  savingsGoals 
}) => {
  // Calculate total income
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
  // Calculate total expenses
  const totalExpenses = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
  // Calculate balance
  const balance = totalIncome - totalExpenses;
  
  // Get recent transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);
  
  // Get top expense categories
  const topExpenseCategories = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
      });
    
    return Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category, amount]) => ({ category, amount }));
  }, [transactions]);
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Income</h3>
          <p className="text-3xl font-bold text-gray-900">${totalIncome.toFixed(2)}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>From {transactions.filter(t => t.type === 'income').length} source(s)</span>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Total Expenses</h3>
          <p className="text-3xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>From {transactions.filter(t => t.type === 'expense').length} transaction(s)</span>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Current Balance</h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(balance).toFixed(2)}
            <span className="text-sm font-normal ml-1">{balance >= 0 ? 'surplus' : 'deficit'}</span>
          </p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>Updated just now</span>
          </div>
        </div>
      </div>
      
      {/* Recent Activity and Budget Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-white bg-opacity-60 hover:bg-opacity-80 transition-all duration-200"
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center
                      ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">{transaction.category} • {new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No transactions yet. Add some to get started!
            </div>
          )}
          
          {recentTransactions.length > 0 && (
            <div className="mt-4 text-center">
              <button 
                className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
                onClick={() => {
                  // Find the transactions tab button and click it
                  const button = document.querySelector('button[data-tab="transactions"]') as HTMLButtonElement;
                  if (button) button.click();
                }}
              >
                View all transactions →
              </button>
            </div>
          )}
        </div>
        
        {/* Budget Overview */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Overview</h3>
          
          {budgets.length > 0 ? (
            <div className="space-y-4">
              {budgets.map((budget, index) => {
                // Calculate total spent in this category
                const spent = transactions
                  .filter(t => t.type === 'expense' && t.category === budget.category)
                  .reduce((sum, t) => sum + t.amount, 0);
                
                // Calculate percentage spent
                const percentage = (spent / budget.limit) * 100;
                
                // Determine status class based on percentage
                let statusClass = 'budget-safe';
                if (percentage >= 90) statusClass = 'budget-danger';
                else if (percentage >= 75) statusClass = 'budget-warning';
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{budget.category}</span>
                      <span className="text-sm text-gray-600">${spent.toFixed(2)} / ${budget.limit.toFixed(2)}</span>
                    </div>
                    <div className="budget-progress">
                      <div 
                        className={`budget-progress-bar ${statusClass}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No budgets set. Create some budget limits to track your spending!
            </div>
          )}
          
          {budgets.length > 0 && (
            <div className="mt-4 text-center">
              <button 
                className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
                onClick={() => {
                  // Find the budgets tab button and click it
                  const button = document.querySelector('button[data-tab="budgets"]') as HTMLButtonElement;
                  if (button) button.click();
                }}
              >
                Manage budgets →
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Savings Goals and Top Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Savings Goals */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Savings Goals</h3>
          
          {savingsGoals.length > 0 ? (
            <div className="space-y-6">
              {savingsGoals.map((goal, index) => {
                // Calculate progress percentage
                const percentage = (goal.currentAmount / goal.targetAmount) * 100;
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-800">{goal.name}</span>
                      <span className="text-sm text-gray-600">
                        ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="budget-progress">
                      <div 
                        className="budget-progress-bar bg-blue-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{percentage.toFixed(0)}% complete</span>
                      <span>Target date: {new Date(goal.targetDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No savings goals yet. Set some goals to track your progress!
            </div>
          )}
          
          {savingsGoals.length > 0 && (
            <div className="mt-4 text-center">
              <button 
                className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
                onClick={() => {
                  // Find the savings tab button and click it
                  const button = document.querySelector('button[data-tab="savings"]') as HTMLButtonElement;
                  if (button) button.click();
                }}
              >
                Manage savings goals →
              </button>
            </div>
          )}
        </div>
        
        {/* Top Expense Categories */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Expenses</h3>
          
          {topExpenseCategories.length > 0 ? (
            <div className="space-y-4">
              {topExpenseCategories.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-60 rounded-lg">
                  <span className="text-sm font-medium text-gray-800">{item.category}</span>
                  <span className="text-sm font-medium text-gray-900">${item.amount.toFixed(2)}</span>
                </div>
              ))}
              
              <div className="pt-2">
                <p className="text-sm text-gray-500">
                  These are your top spending categories. Consider setting budget limits for these areas.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              No expense data yet. Add some transactions to see your top spending categories.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
