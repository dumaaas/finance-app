import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { Card } from "../components/ui/Card";
import { Icon } from "../components/ui/Icon";
import { EmptyState } from "../components/ui/EmptyState";
import { useTransactions } from "../hooks/useFirestore";
import {
  useCategories,
  useInstallments,
  useRecurringBills,
  useSavingsGoals,
} from "../hooks/useFirestore";
import { useAppStore } from "../lib/store";
import { formatCurrency, cn } from "../lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function DashboardPage() {
  const { selectedMonth, theme, currency } = useAppStore();
  const { data: transactions = [], isLoading } = useTransactions(selectedMonth);
  const { data: categories = [] } = useCategories();
  const { data: installments = [] } = useInstallments();
  const { data: recurringBills = [] } = useRecurringBills();
  const { data: savingsGoals = [] } = useSavingsGoals();

  const savingsStats = useMemo(() => {
    const activeGoals = savingsGoals.filter((g) => !g.isWithdrawn);
    const totalSaved = activeGoals.reduce((s, g) => s + g.currentAmount, 0);
    const totalTarget = activeGoals.reduce((s, g) => s + g.targetAmount, 0);
    const activeCount = activeGoals.filter((g) => !g.isCompleted).length;
    return { totalSaved, totalTarget, activeCount };
  }, [savingsGoals]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    const activeInstallments = installments.filter((i) => i.isActive);
    const monthlyInstallments = activeInstallments.reduce(
      (s, i) => s + i.monthlyAmount,
      0,
    );
    const activeBills = recurringBills.filter((b) => b.isActive);
    const monthlyBills = activeBills.reduce((s, b) => s + b.amount, 0);

    // Category breakdown
    const catMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        catMap.set(t.categoryId, (catMap.get(t.categoryId) || 0) + t.amount);
      });
    const breakdown = Array.from(catMap.entries())
      .map(([categoryId, total]) => {
        const cat = categories.find((c) => c.id === categoryId);
        return {
          categoryId,
          total,
          name: cat?.name || "Ostalo",
          color: cat?.color || "#64748b",
          icon: cat?.icon || "Circle",
        };
      })
      .sort((a, b) => b.total - a.total);

    // Daily spending for chart
    const dayMap = new Map<string, number>();
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const day = format(new Date(t.date), "dd");
        dayMap.set(day, (dayMap.get(day) || 0) + t.amount);
      });
    const dailyData = Array.from(dayMap.entries())
      .map(([day, amount]) => ({ day, amount }))
      .sort((a, b) => a.day.localeCompare(b.day));

    return {
      income,
      expenses,
      balance: income - expenses,
      monthlyInstallments,
      monthlyBills,
      breakdown,
      dailyData,
    };
  }, [transactions, categories, installments, recurringBills]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <motion.div variants={itemVariants}>
          <Card className="gradient-mesh">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-primary-500/20">
                <Wallet size={18} className="text-primary-400" />
              </div>
              <span className="text-xs font-medium opacity-60">Bilans</span>
            </div>
            <p
              className={cn(
                "text-xl sm:text-2xl font-black",
                stats.balance >= 0 ? "text-accent-400" : "text-danger-400",
              )}
            >
              {formatCurrency(stats.balance, currency)}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-accent-500/20">
                <TrendingUp size={18} className="text-accent-400" />
              </div>
              <span className="text-xs font-medium opacity-60">Prihodi</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-accent-400">
              {formatCurrency(stats.income, currency)}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-danger-500/20">
                <TrendingDown size={18} className="text-danger-400" />
              </div>
              <span className="text-xs font-medium opacity-60">Rashodi</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-danger-400">
              {formatCurrency(stats.expenses, currency)}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-warning-500/20">
                <CreditCard size={18} className="text-warning-400" />
              </div>
              <span className="text-xs font-medium opacity-60">
                Rate + Racuni
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-warning-400">
              {formatCurrency(
                stats.monthlyInstallments + stats.monthlyBills,
                currency,
              )}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-xl bg-primary-500/20">
                <PiggyBank size={18} className="text-primary-400" />
              </div>
              <span className="text-xs font-medium opacity-60">Stednja</span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-primary-400">
              {formatCurrency(savingsStats.totalSaved, currency)}
            </p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Spending chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <h3 className="text-sm font-bold mb-4 opacity-80">
              Dnevna potrosnja
            </h3>
            {stats.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.dailyData}>
                  <defs>
                    <linearGradient
                      id="colorAmount"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#64748b" }}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: theme === "dark" ? "#1e293b" : "#fff",
                      border: "none",
                      borderRadius: 12,
                      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                      fontSize: 12,
                    }}
                    formatter={(value) => [
                      formatCurrency(Number(value), currency),
                      "Potrosnja",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-55 flex items-center justify-center opacity-40 text-sm">
                Nema podataka za ovaj mjesec
              </div>
            )}
          </Card>
        </motion.div>

        {/* Category pie */}
        <motion.div variants={itemVariants}>
          <Card>
            <h3 className="text-sm font-bold mb-4 opacity-80">
              Po kategorijama
            </h3>
            {stats.breakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={stats.breakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      dataKey="total"
                      strokeWidth={0}
                    >
                      {stats.breakdown.map((entry) => (
                        <Cell key={entry.categoryId} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-2">
                  {stats.breakdown.slice(0, 5).map((item) => (
                    <div
                      key={item.categoryId}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="opacity-80">{item.name}</span>
                      </div>
                      <span className="font-semibold">
                        {formatCurrency(item.total, currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-55 flex items-center justify-center opacity-40 text-sm">
                Nema rashoda
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Recent transactions */}
      <motion.div variants={itemVariants}>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold opacity-80">Zadnje transakcije</h3>
          </div>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.slice(0, 8).map((t) => {
                const cat = categories.find((c) => c.id === t.categoryId);
                return (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-colors",
                      theme === "dark"
                        ? "hover:bg-dark-800/60"
                        : "hover:bg-dark-50",
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: (cat?.color || "#64748b") + "20",
                      }}
                    >
                      <Icon
                        name={cat?.icon || "Circle"}
                        size={18}
                        style={{ color: cat?.color || "#64748b" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {t.description}
                      </p>
                      <p className="text-xs opacity-50">
                        {cat?.name} &middot;{" "}
                        {format(new Date(t.date), "dd. MMM")}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm font-bold",
                        t.type === "income"
                          ? "text-accent-400"
                          : "text-danger-400",
                      )}
                    >
                      {t.type === "income" ? (
                        <ArrowUpRight size={14} />
                      ) : (
                        <ArrowDownRight size={14} />
                      )}
                      {formatCurrency(t.amount, currency)}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon="ArrowLeftRight"
              title="Nema transakcija"
              description="Dodaj prvu transakciju za ovaj mjesec"
            />
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
