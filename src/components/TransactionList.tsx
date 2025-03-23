
import React, { useState, useMemo } from 'react';
import { Transaction } from '@/components/types';

interface TransactionListProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  setTransactions 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  const itemsPerPage = 10;
  
  // Add state for edit form
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDate, setEditDate] = useState('');
  
  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(transaction => {
        // Filter by search term
        const searchMatch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Filter by type
        const typeMatch = filterType === 'all' || transaction.type === filterType;
        
        return searchMatch && typeMatch;
      })
      .sort((a, b) => {
        // Sort by selected field
        if (sortBy === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        } else {
          return sortOrder === 'asc' ? a.amount - b.amount : b.amount - a.amount;
        }
      });
  }, [transactions, searchTerm, filterType, sortBy, sortOrder]);
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage]);
  
  // Handle edit transaction
  const startEditing = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEditDescription(transaction.description);
    setEditAmount(transaction.amount.toString());
    setEditCategory(transaction.category);
    setEditDate(transaction.date);
  };
  
  const cancelEditing = () => {
    setEditingTransaction(null);
  };
  
  const saveEdit = () => {
    if (!editingTransaction) return;
    
    const updatedTransaction: Transaction = {
      ...editingTransaction,
      description: editDescription,
      amount: parseFloat(editAmount),
      category: editCategory,
      date: editDate
    };
    
    setTransactions(prev => 
      prev.map(t => 
        t === editingTransaction ? updatedTransaction : t
      )
    );
    
    setEditingTransaction(null);
  };
  
  // Delete transaction
  const deleteTransaction = (transaction: Transaction) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setTransactions(prev => prev.filter(t => t !== transaction));
    }
  };
  
  // Handle page change
  const changePage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Toggle sort order
  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Get totals
  const { totalIncome, totalExpenses, balance } = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      balance: income - expenses
    };
  }, [filteredTransactions]);
  
  return (
    <div className="glass-card p-6 animate-fade-in">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Transactions</h2>
      
      {/* Filter and search controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-clean"
            />
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${filterType === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('income')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${filterType === 'income' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Income
            </button>
            <button
              onClick={() => setFilterType('expense')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${filterType === 'expense' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Expenses
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {Math.min(filteredTransactions.length, 1 + (currentPage - 1) * itemsPerPage)}-
            {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => toggleSort('date')}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center transition-colors
                ${sortBy === 'date' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-gray-50 text-gray-600'}`}
            >
              Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button
              onClick={() => toggleSort('amount')}
              className={`px-3 py-1 rounded text-xs font-medium flex items-center transition-colors
                ${sortBy === 'amount' 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'bg-gray-50 text-gray-600'}`}
            >
              Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          </div>
        </div>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white bg-opacity-60 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-500 mb-1">Total Income</h3>
          <p className="text-xl font-medium text-green-600">${totalIncome.toFixed(2)}</p>
        </div>
        
        <div className="bg-white bg-opacity-60 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-500 mb-1">Total Expenses</h3>
          <p className="text-xl font-medium text-red-600">${totalExpenses.toFixed(2)}</p>
        </div>
        
        <div className="bg-white bg-opacity-60 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm text-gray-500 mb-1">Balance</h3>
          <p className={`text-xl font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${Math.abs(balance).toFixed(2)}
            <span className="text-sm font-normal ml-1">{balance >= 0 ? 'surplus' : 'deficit'}</span>
          </p>
        </div>
      </div>
      
      {/* Transactions list */}
      {paginatedTransactions.length > 0 ? (
        <div className="bg-white bg-opacity-50 rounded-lg overflow-hidden shadow-sm">
          {paginatedTransactions.map((transaction, index) => (
            <div 
              key={index}
              className={`transaction-item ${editingTransaction === transaction ? 'bg-blue-50' : ''}`}
            >
              {editingTransaction === transaction ? (
                <div className="w-full space-y-3 p-2">
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Description</label>
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="input-clean py-1 px-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Amount</label>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="input-clean py-1 px-2 text-sm w-24"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-3 sm:space-y-0">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-500 mb-1">Category</label>
                      <input
                        type="text"
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="input-clean py-1 px-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Date</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="input-clean py-1 px-2 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2 justify-end">
                    <button 
                      onClick={cancelEditing}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveEdit}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3
                      ${transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{transaction.description}</h4>
                      <div className="flex items-center mt-1">
                        <span className="category-pill bg-gray-100 text-gray-700">{transaction.category}</span>
                        <span className="text-xs text-gray-500">{new Date(transaction.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'} mr-4`}>
                      {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                    </span>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => startEditing(transaction)}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => deleteTransaction(transaction)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-white bg-opacity-50 rounded-lg">
          <p className="text-gray-500">No transactions found.</p>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-1">
              Try adjusting your search or filters.
            </p>
          )}
        </div>
      )}
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <button
              onClick={() => changePage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => changePage(page)}
                className={`px-3 py-1 rounded-md text-sm ${
                  currentPage === page
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => changePage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}
      
      {/* Reset button */}
      {transactions.length > 0 && (
        <div className="mt-8 text-center">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete ALL transactions? This cannot be undone.')) {
                setTransactions([]);
              }
            }}
            className="button-danger text-sm"
          >
            Reset All Transactions
          </button>
        </div>
      )}
    </div>
  );
};
