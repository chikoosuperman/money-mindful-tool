
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { TransactionForm } from '@/components/TransactionForm';
import { TransactionList } from '@/components/TransactionList';
import { BudgetSetup } from '@/components/BudgetSetup';
import { SavingsGoal } from '@/components/SavingsGoal';
import { MonthlyOverview } from '@/components/MonthlyOverview';

const Index = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Animation state
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  useEffect(() => {
    // Trigger entrance animation
    setIsPageLoaded(true);
    
    // Load data from localStorage if available
    const savedData = localStorage.getItem('budgetData');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setTransactions(parsedData.transactions || []);
        setBudgets(parsedData.budgets || []);
        setSavingsGoals(parsedData.savingsGoals || []);
      } catch (error) {
        console.error('Error loading saved data', error);
      }
    }
  }, []);
  
  // Main state
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  
  // Save data to localStorage whenever it changes
  useEffect(() => {
    const dataToSave = {
      transactions,
      budgets,
      savingsGoals
    };
    
    localStorage.setItem('budgetData', JSON.stringify(dataToSave));
  }, [transactions, budgets, savingsGoals]);
  
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 transition-opacity duration-700 ${isPageLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="mt-8">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              budgets={budgets} 
              savingsGoals={savingsGoals} 
            />
          )}
          
          {activeTab === 'transactions' && (
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <TransactionForm 
                  setTransactions={setTransactions} 
                  transactions={transactions}
                />
              </div>
              <div className="lg:col-span-2">
                <TransactionList 
                  transactions={transactions} 
                  setTransactions={setTransactions} 
                />
              </div>
            </div>
          )}
          
          {activeTab === 'budgets' && (
            <BudgetSetup 
              budgets={budgets} 
              setBudgets={setBudgets} 
              transactions={transactions}
            />
          )}
          
          {activeTab === 'savings' && (
            <SavingsGoal 
              savingsGoals={savingsGoals} 
              setSavingsGoals={setSavingsGoals} 
              transactions={transactions}
            />
          )}
          
          {activeTab === 'reports' && (
            <MonthlyOverview 
              transactions={transactions} 
              budgets={budgets}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
