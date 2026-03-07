import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { fetchDocs, fetchPaginatedDocs, createDoc, updateDocument, deleteDocument, where, orderBy, type PaginatedResult } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { Category, Transaction, Installment, RecurringBill, Budget, SavingsGoal } from '../types';
import type { DocumentSnapshot } from 'firebase/firestore';

// Categories
export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['categories', user?.uid],
    queryFn: () =>
      fetchDocs<Category>('categories', where('userId', '==', user!.uid), orderBy('name')),
    enabled: !!user,
  });
}

export function useCategoryMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  const create = useMutation({
    mutationFn: (data: Omit<Category, 'id'>) => createDoc('categories', data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Category>) =>
      updateDocument('categories', id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument('categories', id),
    onSuccess: invalidate,
  });

  return { create, update, remove, userId: user?.uid };
}

// Transactions
export function useTransactions(month: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['transactions', user?.uid, month],
    queryFn: () =>
      fetchDocs<Transaction>(
        'transactions',
        where('userId', '==', user!.uid),
        where('month', '==', month),
        orderBy('date', 'desc')
      ),
    enabled: !!user,
  });
}

const TX_PAGE_SIZE = 10;

export function useInfiniteTransactions(month: string) {
  const { user } = useAuth();
  return useInfiniteQuery<PaginatedResult<Transaction>, Error, { pages: PaginatedResult<Transaction>[]; pageParams: (DocumentSnapshot | null)[] }, string[], DocumentSnapshot | null>({
    queryKey: ['transactions-infinite', user?.uid ?? '', month],
    queryFn: ({ pageParam }) =>
      fetchPaginatedDocs<Transaction>(
        'transactions',
        TX_PAGE_SIZE,
        pageParam,
        where('userId', '==', user!.uid),
        where('month', '==', month),
        orderBy('date', 'desc')
      ),
    initialPageParam: null,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.lastDoc : undefined),
    enabled: !!user,
  });
}

export function useTransactionMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] });
    qc.invalidateQueries({ queryKey: ['transactions-infinite'] });
  };

  const create = useMutation({
    mutationFn: (data: Omit<Transaction, 'id'>) => createDoc('transactions', data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Transaction>) =>
      updateDocument('transactions', id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument('transactions', id),
    onSuccess: invalidate,
  });

  return { create, update, remove, userId: user?.uid };
}

// Installments
export function useInstallments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['installments', user?.uid],
    queryFn: () =>
      fetchDocs<Installment>(
        'installments',
        where('userId', '==', user!.uid),
        orderBy('createdAt', 'desc')
      ),
    enabled: !!user,
  });
}

export function useInstallmentMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['installments'] });

  const create = useMutation({
    mutationFn: (data: Omit<Installment, 'id'>) => createDoc('installments', data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Installment>) =>
      updateDocument('installments', id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument('installments', id),
    onSuccess: invalidate,
  });

  return { create, update, remove, userId: user?.uid };
}

// Recurring Bills
export function useRecurringBills() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['recurringBills', user?.uid],
    queryFn: () =>
      fetchDocs<RecurringBill>(
        'recurringBills',
        where('userId', '==', user!.uid),
        orderBy('dueDay')
      ),
    enabled: !!user,
  });
}

export function useRecurringBillMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['recurringBills'] });

  const create = useMutation({
    mutationFn: (data: Omit<RecurringBill, 'id'>) => createDoc('recurringBills', data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<RecurringBill>) =>
      updateDocument('recurringBills', id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument('recurringBills', id),
    onSuccess: invalidate,
  });

  return { create, update, remove, userId: user?.uid };
}

// Budgets
export function useBudgets(month: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['budgets', user?.uid, month],
    queryFn: () =>
      fetchDocs<Budget>(
        'budgets',
        where('userId', '==', user!.uid),
        where('month', '==', month)
      ),
    enabled: !!user,
  });
}

export function useBudgetMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['budgets'] });

  const create = useMutation({
    mutationFn: (data: Omit<Budget, 'id'>) => createDoc('budgets', data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Budget>) =>
      updateDocument('budgets', id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument('budgets', id),
    onSuccess: invalidate,
  });

  return { create, update, remove, userId: user?.uid };
}

// Savings Goals
export function useSavingsGoals() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['savingsGoals', user?.uid],
    queryFn: () =>
      fetchDocs<SavingsGoal>(
        'savingsGoals',
        where('userId', '==', user!.uid),
        orderBy('createdAt', 'desc')
      ),
    enabled: !!user,
  });
}

export function useSavingsGoalMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['savingsGoals'] });

  const create = useMutation({
    mutationFn: (data: Omit<SavingsGoal, 'id'>) => createDoc('savingsGoals', data),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<SavingsGoal>) =>
      updateDocument('savingsGoals', id, data),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteDocument('savingsGoals', id),
    onSuccess: invalidate,
  });

  return { create, update, remove, userId: user?.uid };
}
