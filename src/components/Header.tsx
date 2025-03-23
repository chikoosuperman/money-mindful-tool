
import React from 'react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'savings', label: 'Savings' },
    { id: 'reports', label: 'Reports' }
  ];
  
  return (
    <header className="animate-fade-in">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Budget Planner
            </span>
          </h1>
          <p className="text-gray-600 mt-1">Manage your finances with precision</p>
        </div>
        
        <div className="glass-morphism rounded-xl px-1 py-1">
          <nav className="flex space-x-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${activeTab === tab.id 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white hover:bg-opacity-50'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};
