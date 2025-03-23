
export interface Transaction {
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface SavingsGoal {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}
