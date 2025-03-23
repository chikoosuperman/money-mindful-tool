
import React, { useState } from 'react';
import { Transaction, SavingsGoal as SavingsGoalType } from '@/components/types';

interface SavingsGoalProps {
  savingsGoals: SavingsGoalType[];
  setSavingsGoals: React.Dispatch<React.SetStateAction<SavingsGoalType[]>>;
  transactions: Transaction[];
}

export const SavingsGoal: React.FC<SavingsGoalProps> = ({ 
  savingsGoals, 
  setSavingsGoals,
  transactions
}) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [error, setError] = useState('');
  const [editingGoal, setEditingGoal] = useState<SavingsGoalType | null>(null);
  
  // Calculate total savings
  const totalSavings = React.useMemo(() => {
    return savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  }, [savingsGoals]);
  
  // Get income and expenses
  const { totalIncome, totalExpenses } = React.useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return { totalIncome: income, totalExpenses: expenses };
  }, [transactions]);
  
  // Calculate savings potential
  const savingsPotential = Math.max(0, totalIncome - totalExpenses);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!name.trim()) {
      setError('Please enter a name for this goal');
      return;
    }
    
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Please enter a valid target amount');
      return;
    }
    
    if (!currentAmount || parseFloat(currentAmount) < 0) {
      setError('Please enter a valid current amount');
      return;
    }
    
    if (parseFloat(currentAmount) > parseFloat(targetAmount)) {
      setError('Current amount cannot be greater than target amount');
      return;
    }
    
    if (!targetDate) {
      setError('Please set a target date');
      return;
    }
    
    if (new Date(targetDate) < new Date()) {
      setError('Target date cannot be in the past');
      return;
    }
    
    if (editingGoal) {
      // Update existing goal
      const updatedGoal: SavingsGoalType = {
        ...editingGoal,
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        targetDate
      };
      
      setSavingsGoals(prev => 
        prev.map(g => 
          g === editingGoal ? updatedGoal : g
        )
      );
      
      setEditingGoal(null);
    } else {
      // Create new goal
      const newGoal: SavingsGoalType = {
        name: name.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: parseFloat(currentAmount),
        targetDate
      };
      
      setSavingsGoals(prev => [...prev, newGoal]);
    }
    
    // Reset form
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setError('');
  };
  
  const startEditing = (goal: SavingsGoalType) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(goal.targetAmount.toString());
    setCurrentAmount(goal.currentAmount.toString());
    setTargetDate(goal.targetDate);
    setError('');
  };
  
  const cancelEditing = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setTargetDate('');
    setError('');
  };
  
  const deleteGoal = (goal: SavingsGoalType) => {
    if (window.confirm(`Are you sure you want to delete the goal "${goal.name}"?`)) {
      setSavingsGoals(prev => prev.filter(g => g !== goal));
    }
  };
  
  // Calculate days remaining and monthly saving needed for each goal
  const goalsWithDetails = React.useMemo(() => {
    return savingsGoals.map(goal => {
      const today = new Date();
      const target = new Date(goal.targetDate);
      const daysRemaining = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      const monthsRemaining = Math.max(0.1, daysRemaining / 30); // Approximate
      
      const amountRemaining = goal.targetAmount - goal.currentAmount;
      const monthlySavingNeeded = amountRemaining / monthsRemaining;
      
      const percentage = (goal.currentAmount / goal.targetAmount) * 100;
      
      return {
        ...goal,
        daysRemaining,
        monthsRemaining,
        amountRemaining,
        monthlySavingNeeded,
        percentage
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining); // Sort by urgency (closest target date first)
  }, [savingsGoals]);
  
  // Function to update current amount
  const updateGoalAmount = (goal: SavingsGoalType, amount: number) => {
    const updatedGoal = {
      ...goal,
      currentAmount: Math.min(goal.targetAmount, goal.currentAmount + amount)
    };
    
    setSavingsGoals(prev => 
      prev.map(g => 
        g === goal ? updatedGoal : g
      )
    );
  };
  
  // Calculate time ago for display
  const formatTimeAgo = (date: string) => {
    const targetDate = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
    return `${Math.ceil(diffDays / 365)} years`;
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
      {/* Savings Goal Form */}
      <div className="glass-card p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {editingGoal ? 'Edit Savings Goal' : 'Create Savings Goal'}
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-clean"
              placeholder="e.g., New Laptop, Vacation"
            />
          </div>
          
          <div>
            <label htmlFor="targetAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Target Amount ($)
            </label>
            <input
              type="number"
              id="targetAmount"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="input-clean"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label htmlFor="currentAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount ($)
            </label>
            <input
              type="number"
              id="currentAmount"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="input-clean"
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
              Target Date
            </label>
            <input
              type="date"
              id="targetDate"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="input-clean"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="flex space-x-3 pt-2">
            {editingGoal ? (
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
                Add Goal
              </button>
            )}
          </div>
        </form>
        
        {/* Savings potential */}
        {!editingGoal && transactions.length > 0 && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Savings Potential</h3>
            <p className="text-xs text-blue-700 mb-2">
              Based on your income and expenses, you could save up to:
            </p>
            <p className="text-xl font-bold text-blue-900">${savingsPotential.toFixed(2)}</p>
            <p className="text-xs text-blue-700 mt-2">
              Consider allocating some of this to your savings goals!
            </p>
          </div>
        )}
      </div>
      
      {/* Savings Goals List */}
      <div className="lg:col-span-2 glass-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Savings Goals</h2>
          <div className="text-sm">
            <span className="text-gray-500">Total Saved: </span>
            <span className="font-semibold text-blue-600">${totalSavings.toFixed(2)}</span>
          </div>
        </div>
        
        {goalsWithDetails.length > 0 ? (
          <div className="space-y-6">
            {goalsWithDetails.map((goal, index) => (
              <div key={index} className="bg-white bg-opacity-60 p-5 rounded-lg shadow-sm hover-scale">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{goal.name}</h3>
                    <p className="text-sm text-gray-500">
                      Target date: {new Date(goal.targetDate).toLocaleDateString()} 
                      <span className="ml-1 text-blue-600">({formatTimeAgo(goal.targetDate)})</span>
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => startEditing(goal)}
                      className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteGoal(goal)}
                      className="p-1 text-red-600 hover:text-red-800 transition-colors"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Progress</p>
                    <p className="text-sm font-medium text-gray-900">
                      ${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Remaining</p>
                    <p className="text-sm font-medium text-gray-900">
                      ${goal.amountRemaining.toFixed(2)} 
                      <span className="text-xs text-gray-500 ml-1">
                        (${goal.monthlySavingNeeded.toFixed(2)}/month)
                      </span>
                    </p>
                  </div>
                </div>
                
                <div className="budget-progress mb-4">
                  <div 
                    className="budget-progress-bar bg-blue-400"
                    style={{ width: `${goal.percentage}%` }}
                  />
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={() => updateGoalAmount(goal, 10)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    +$10
                  </button>
                  <button
                    onClick={() => updateGoalAmount(goal, 25)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    +$25
                  </button>
                  <button
                    onClick={() => updateGoalAmount(goal, 50)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    +$50
                  </button>
                  <button
                    onClick={() => updateGoalAmount(goal, 100)}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    +$100
                  </button>
                  
                  {goal.amountRemaining > 0 && (
                    <button
                      onClick={() => updateGoalAmount(goal, goal.amountRemaining)}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors ml-auto"
                    >
                      Complete Goal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white bg-opacity-50 rounded-lg">
            <p className="text-gray-500 mb-3">You haven't set any savings goals yet.</p>
            <p className="text-sm text-gray-600">
              Create a goal to start tracking your progress toward your financial aspirations.
            </p>
          </div>
        )}
        
        {/* Savings tips */}
        {goalsWithDetails.length > 0 && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Savings Tips</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Try the 24-hour rule: Wait 24 hours before making non-essential purchases</li>
              <li>• Set up automatic transfers to your savings account</li>
              <li>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
              <li>• Track your expenses to identify areas where you can cut back</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
