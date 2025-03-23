
import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Budget } from '@/components/types';

interface MonthlyOverviewProps {
  transactions: Transaction[];
  budgets: Budget[];
}

export const MonthlyOverview: React.FC<MonthlyOverviewProps> = ({ 
  transactions, 
  budgets 
}) => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Initialize with current month and year
  useEffect(() => {
    const now = new Date();
    setSelectedMonth((now.getMonth() + 1).toString().padStart(2, '0'));
    setSelectedYear(now.getFullYear().toString());
  }, []);
  
  // Generate available months and years from transactions
  const { availableMonths, availableYears } = useMemo(() => {
    const months = new Set<string>();
    const years = new Set<string>();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      
      months.add(month);
      years.add(year);
    });
    
    // Add current month and year if not in the set
    const now = new Date();
    const currentMonth = (now.getMonth() + 1).toString().padStart(2, '0');
    const currentYear = now.getFullYear().toString();
    
    months.add(currentMonth);
    years.add(currentYear);
    
    return {
      availableMonths: Array.from(months).sort(),
      availableYears: Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)) // Recent years first
    };
  }, [transactions]);
  
  // Filter transactions for selected month and year
  const filteredTransactions = useMemo(() => {
    if (!selectedMonth || !selectedYear) return [];
    
    return transactions.filter(transaction => {
      const date = new Date(transaction.date);
      const transactionMonth = (date.getMonth() + 1).toString().padStart(2, '0');
      const transactionYear = date.getFullYear().toString();
      
      return transactionMonth === selectedMonth && transactionYear === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);
  
  // Calculate monthly summary
  const summary = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;
    
    // Category breakdown
    const expensesByCategory: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
      });
    
    const incomeByCategory: Record<string, number> = {};
    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      });
    
    // Budget compliance
    const budgetCompliance = budgets.map(budget => {
      const spent = filteredTransactions
        .filter(t => t.type === 'expense' && t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = (spent / budget.limit) * 100;
      const status = percentage >= 100 ? 'exceeded' : 'within';
      
      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        percentage,
        status
      };
    });
    
    return {
      totalIncome,
      totalExpenses,
      balance,
      savingsRate,
      expensesByCategory,
      incomeByCategory,
      budgetCompliance,
      transactionCount: filteredTransactions.length
    };
  }, [filteredTransactions, budgets]);
  
  // Prepare chart data
  useEffect(() => {
    // Expense chart data
    const expenseData = Object.entries(summary.expensesByCategory)
      .sort((a, b) => b[1] - a[1]) // Sort by amount (highest first)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        color: getRandomColor(category)
      }));
    
    setChartData(expenseData);
  }, [summary]);
  
  // Generate consistent colors for categories
  const getRandomColor = (seed: string) => {
    // Simple hash function to generate a consistent color for each category
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#4F46E5', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
      '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316'
    ];
    
    // Use the hash to pick a color
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };
  
  // Render pie chart
  const renderPieChart = () => {
    if (chartData.length === 0) return null;
    
    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;
    
    return (
      <div className="relative w-full h-64">
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {chartData.map((item, index) => {
            const percentage = (item.value / totalValue) * 100;
            const startAngle = cumulativePercentage * 3.6; // 3.6 = 360 / 100
            cumulativePercentage += percentage;
            const endAngle = cumulativePercentage * 3.6;
            
            // Convert angles to radians
            const startRad = (startAngle - 90) * Math.PI / 180;
            const endRad = (endAngle - 90) * Math.PI / 180;
            
            // Calculate points on circle
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);
            
            // Create SVG arc path
            const largeArcFlag = percentage > 50 ? 1 : 0;
            const pathData = `
              M 50 50
              L ${x1} ${y1}
              A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}
              Z
            `;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                stroke="#fff"
                strokeWidth="0.5"
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
            );
          })}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>
        
        {/* Legend */}
        <div className="absolute top-0 right-0 bg-white bg-opacity-80 p-2 rounded text-xs max-h-full overflow-y-auto max-w-[40%]">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center mb-1">
              <div 
                className="w-3 h-3 mr-1 rounded-sm"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate">{item.name}</span>
              <span className="ml-1 whitespace-nowrap">
                ${item.value.toFixed(2)} ({((item.value / totalValue) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Format month name
  const getMonthName = (monthNum: string) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[parseInt(monthNum) - 1];
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Month/Year Selector */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Overview</h2>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              id="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input-clean"
            >
              {availableMonths.map((month) => (
                <option key={month} value={month}>
                  {getMonthName(month)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              id="year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="input-clean"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Monthly Summary */}
      {filteredTransactions.length > 0 ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Income</h3>
              <p className="text-2xl font-bold text-green-600">${summary.totalIncome.toFixed(2)}</p>
            </div>
            
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Expenses</h3>
              <p className="text-2xl font-bold text-red-600">${summary.totalExpenses.toFixed(2)}</p>
            </div>
            
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Balance</h3>
              <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${Math.abs(summary.balance).toFixed(2)}
                <span className="text-sm font-normal ml-1">{summary.balance >= 0 ? 'surplus' : 'deficit'}</span>
              </p>
            </div>
            
            <div className="glass-card p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Savings Rate</h3>
              <p className="text-2xl font-bold text-blue-600">{summary.savingsRate.toFixed(1)}%</p>
            </div>
          </div>
          
          {/* Expense Breakdown and Budget Compliance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Expense Breakdown */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Expense Breakdown</h3>
              
              {Object.keys(summary.expensesByCategory).length > 0 ? (
                <div>
                  {renderPieChart()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No expense data available for this period.
                </div>
              )}
            </div>
            
            {/* Budget Compliance */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Budget Compliance</h3>
              
              {summary.budgetCompliance.length > 0 ? (
                <div className="space-y-4">
                  {summary.budgetCompliance.map((budget, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-800">{budget.category}</span>
                        <span className="text-sm">
                          ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="budget-progress">
                        <div 
                          className={`budget-progress-bar ${
                            budget.percentage >= 100 ? 'bg-red-500' : 
                            budget.percentage >= 75 ? 'bg-amber-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                      
                      <div className="text-xs text-right">
                        <span className={`font-medium ${
                          budget.percentage >= 100 ? 'text-red-600' : 
                          budget.percentage >= 75 ? 'text-amber-600' : 
                          'text-green-600'
                        }`}>
                          {budget.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No budget data available for this period.
                </div>
              )}
              
              {/* Budget Summary */}
              {summary.budgetCompliance.length > 0 && (
                <div className="mt-6 bg-white bg-opacity-70 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Budget Summary</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xs text-gray-500">Within Budget</p>
                      <p className="text-base font-medium text-green-600">
                        {summary.budgetCompliance.filter(b => b.percentage < 100).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Exceeded</p>
                      <p className="text-base font-medium text-red-600">
                        {summary.budgetCompliance.filter(b => b.percentage >= 100).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Compliance Rate</p>
                      <p className="text-base font-medium text-blue-600">
                        {Math.round((summary.budgetCompliance.filter(b => b.percentage < 100).length / summary.budgetCompliance.length) * 100)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Income Sources and Monthly Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Income Sources */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Income Sources</h3>
              
              {Object.keys(summary.incomeByCategory).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(summary.incomeByCategory)
                    .sort((a, b) => b[1] - a[1]) // Sort by amount (highest first)
                    .map(([category, amount], index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white bg-opacity-70 rounded-lg">
                        <span className="text-sm font-medium text-gray-800">{category}</span>
                        <span className="text-sm font-medium text-green-600">${amount.toFixed(2)}</span>
                      </div>
                    ))
                  }
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No income data available for this period.
                </div>
              )}
            </div>
            
            {/* Monthly Stats */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Stats</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white bg-opacity-70 p-4 rounded-lg text-center">
                  <h4 className="text-sm text-gray-500 mb-1">Transactions</h4>
                  <p className="text-2xl font-bold text-gray-900">{summary.transactionCount}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600">{filteredTransactions.filter(t => t.type === 'income').length} income</span>
                    <span className="mx-1">•</span>
                    <span className="text-red-600">{filteredTransactions.filter(t => t.type === 'expense').length} expenses</span>
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-70 p-4 rounded-lg text-center">
                  <h4 className="text-sm text-gray-500 mb-1">Avg. Transaction</h4>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(summary.totalExpenses / Math.max(1, filteredTransactions.filter(t => t.type === 'expense').length)).toFixed(2)}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    Average expense amount
                  </div>
                </div>
                
                <div className="bg-white bg-opacity-70 p-4 rounded-lg text-center">
                  <h4 className="text-sm text-gray-500 mb-1">Largest Expense</h4>
                  {filteredTransactions.filter(t => t.type === 'expense').length > 0 ? (
                    <>
                      <p className="text-xl font-bold text-gray-900">
                        ${Math.max(...filteredTransactions.filter(t => t.type === 'expense').map(t => t.amount)).toFixed(2)}
                      </p>
                      <div className="text-xs text-gray-500 mt-1">
                        Highest single expense
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">No expenses</p>
                  )}
                </div>
                
                <div className="bg-white bg-opacity-70 p-4 rounded-lg text-center">
                  <h4 className="text-sm text-gray-500 mb-1">Daily Average</h4>
                  <p className="text-xl font-bold text-gray-900">
                    ${(summary.totalExpenses / 30).toFixed(2)}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    Avg. daily spending
                  </div>
                </div>
              </div>
              
              {/* Money-saving tips */}
              <div className="mt-6 bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Insights</h4>
                <div className="text-xs text-blue-700">
                  {summary.balance < 0 ? (
                    <p>You spent more than you earned this month. Consider reviewing your budget categories.</p>
                  ) : summary.savingsRate < 10 ? (
                    <p>Your savings rate is quite low. Aim for at least 20% of your income in savings.</p>
                  ) : summary.savingsRate >= 30 ? (
                    <p>Great job! Your savings rate is excellent. Keep up the good work.</p>
                  ) : (
                    <p>Your finances are balanced. Look for opportunities to increase your savings rate.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-lg text-gray-600 mb-3">No transactions found for {getMonthName(selectedMonth)} {selectedYear}.</p>
          <p className="text-sm text-gray-500">
            Add some transactions for this period to see your monthly overview.
          </p>
        </div>
      )}
    </div>
  );
};
