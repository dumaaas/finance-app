import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit3,
} from "lucide-react";
import { format } from "date-fns";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { Icon } from "../components/ui/Icon";
import { EmptyState } from "../components/ui/EmptyState";
import {
  useInfiniteTransactions,
  useTransactionMutations,
  useCategories,
} from "../hooks/useFirestore";
import { useAppStore } from "../lib/store";
import { formatCurrency, cn } from "../lib/utils";
import toast from "react-hot-toast";

export function TransactionsPage() {
  const { selectedMonth, theme, currency } = useAppStore();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteTransactions(selectedMonth);
  const { data: categories = [] } = useCategories();
  const { create, update, remove, userId } = useTransactionMutations();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<
    (typeof allTransactions)[0] | null
  >(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">(
    "all",
  );
  const [filterCategory] = useState("all");

  // Form state
  const [formType, setFormType] = useState<"expense" | "income">("expense");
  const [formAmount, setFormAmount] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formSubcategoryId, setFormSubcategoryId] = useState("");
  const [formDate, setFormDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // Flatten all pages into a single list
  const allTransactions = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((t) => {
      if (filterType !== "all" && t.type !== filterType) return false;
      if (filterCategory !== "all" && t.categoryId !== filterCategory)
        return false;
      if (search && !t.description.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [allTransactions, filterType, filterCategory, search]);

  // Intersection observer for infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleObserver]);

  const selectedCategory = categories.find((c) => c.id === formCategoryId);
  const filteredCategories = categories.filter((c) => c.type === formType);

  const resetForm = () => {
    setFormType("expense");
    setFormAmount("");
    setFormDescription("");
    setFormCategoryId("");
    setFormSubcategoryId("");
    setFormDate(format(new Date(), "yyyy-MM-dd"));
    setEditingId(null);
  };

  const openEdit = (t: (typeof allTransactions)[0]) => {
    setEditingId(t.id);
    setFormType(t.type);
    setFormAmount(t.amount.toString());
    setFormDescription(t.description);
    setFormCategoryId(t.categoryId);
    setFormSubcategoryId(t.subcategoryId || "");
    setFormDate(format(new Date(t.date), "yyyy-MM-dd"));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    if (!formCategoryId) {
      toast.error("Odaberi kategoriju");
      return;
    }

    const dateObj = new Date(formDate);
    const selectedCat = categories.find((c) => c.id === formCategoryId);
    const validSubId = selectedCat?.subcategories.some(
      (s) => s.id === formSubcategoryId,
    )
      ? formSubcategoryId
      : undefined;
    const txData = {
      amount: parseFloat(formAmount),
      description: formDescription,
      categoryId: formCategoryId,
      ...(validSubId != null &&
        validSubId !== "" && { subcategoryId: validSubId }),
      type: formType,
      date: dateObj.getTime(),
      month: format(dateObj, "yyyy-MM"),
      userId,
      createdAt: Date.now(),
    };

    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, ...txData });
        toast.success("Transakcija azurirana");
      } else {
        await create.mutateAsync(txData);
        toast.success("Transakcija dodana");
      }
      setShowModal(false);
      resetForm();
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: string }).code
          : "";
      const msg = err instanceof Error ? err.message : "";
      if (code === "permission-denied") {
        toast.error(
          "Nemate dozvolu. Provjerite Firestore pravila (transakcije i kategorije).",
        );
      } else {
        toast.error(msg || "Greska pri cuvanju");
      }
    }
  };

  const totals = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense };
  }, [filteredTransactions]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4 sm:space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-black">Transakcije</h2>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          size="sm"
        >
          <Plus size={18} /> Dodaj
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
            />
            <input
              type="text"
              placeholder="Pretrazi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all",
                theme === "dark"
                  ? "bg-dark-800 border border-dark-700 text-dark-100 placeholder:text-dark-500"
                  : "bg-dark-50 border border-dark-200 text-dark-900",
              )}
            />
          </div>
          <div className="flex gap-2">
            {(["all", "income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-xs font-semibold transition-all",
                  filterType === t
                    ? "gradient-primary text-white"
                    : theme === "dark"
                      ? "bg-dark-800 text-dark-400"
                      : "bg-dark-100 text-dark-500",
                )}
              >
                {t === "all" ? "Sve" : t === "income" ? "Prihodi" : "Rashodi"}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Transaction list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          icon="ArrowLeftRight"
          title="Nema transakcija"
          description="Dodaj prvu transakciju koristeci dugme iznad"
        />
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            const sub = cat?.subcategories.find(
              (s) => s.id === t.subcategoryId,
            );
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card hover className="!p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: (cat?.color || "#64748b") + "20",
                      }}
                    >
                      <Icon
                        name={cat?.icon || "Circle"}
                        size={20}
                        style={{ color: cat?.color || "#64748b" }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {t.description}
                      </p>
                      <p className="text-xs opacity-50">
                        {cat?.name}
                        {sub ? ` / ${sub.name}` : ""} &middot;{" "}
                        {format(new Date(t.date), "dd. MMM yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-sm font-bold",
                          t.type === "income"
                            ? "text-accent-400"
                            : "text-danger-400",
                        )}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatCurrency(t.amount, currency)}
                      </span>
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 rounded-lg hover:bg-dark-700/50 transition-colors"
                      >
                        <Edit3 size={14} className="opacity-50" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(t)}
                        className="p-1.5 rounded-lg hover:bg-danger-500/20 transition-colors"
                      >
                        <Trash2
                          size={14}
                          className="text-danger-400 opacity-50"
                        />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {/* Infinite scroll sentinel + loader */}
          <div ref={sentinelRef} className="py-4 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs opacity-50">Ucitavanje...</span>
              </div>
            )}
            {!hasNextPage && allTransactions.length > 10 && (
              <span className="text-xs opacity-30">
                Sve transakcije su ucitane
              </span>
            )}
          </div>
        </div>
      )}

      {/* Potvrda brisanja transakcije */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Obrisati transakciju?"
        size="sm"
      >
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-sm opacity-80">
              Transakcija <strong>{confirmDelete.description}</strong> (
              {formatCurrency(confirmDelete.amount, currency)}) ce biti trajno
              obrisana. Ova akcija se ne moze ponistiti.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                Odustani
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={async () => {
                  try {
                    await remove.mutateAsync(confirmDelete.id);
                    toast.success("Obrisano");
                    setConfirmDelete(null);
                  } catch {
                    toast.error("Greska pri brisanju");
                  }
                }}
              >
                Obrisi
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? "Uredi transakciju" : "Nova transakcija"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex bg-dark-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => {
                setFormType("expense");
                setFormCategoryId("");
                setFormSubcategoryId("");
              }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                formType === "expense"
                  ? "gradient-danger text-white"
                  : "text-dark-400",
              )}
            >
              Rashod
            </button>
            <button
              type="button"
              onClick={() => {
                setFormType("income");
                setFormCategoryId("");
                setFormSubcategoryId("");
              }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all",
                formType === "income"
                  ? "gradient-success text-white"
                  : "text-dark-400",
              )}
            >
              Prihod
            </button>
          </div>

          <Input
            label="Iznos"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formAmount}
            onChange={(e) => setFormAmount(e.target.value)}
            required
          />
          <Input
            label="Opis"
            placeholder="Npr. Kupovina namirnica"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            required
          />

          {formType === "income" && filteredCategories.length === 0 && (
            <p className="text-sm text-amber-500 bg-amber-500/10 rounded-xl px-3 py-2">
              Nemate kategorija za prihode. Idite na <strong>Kategorije</strong>{" "}
              → tab <strong>Prihodi</strong> i dodajte ih, ili učitajte
              &quot;Podrazumjevane&quot;.
            </p>
          )}
          <Select
            label="Kategorija"
            value={formCategoryId}
            onChange={(e) => {
              setFormCategoryId(e.target.value);
              setFormSubcategoryId("");
            }}
            options={[
              { value: "", label: "Odaberi kategoriju" },
              ...filteredCategories.map((c) => ({
                value: c.id,
                label: c.name,
              })),
            ]}
          />

          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <Select
              label="Podkategorija"
              value={formSubcategoryId}
              onChange={(e) => setFormSubcategoryId(e.target.value)}
              options={[
                { value: "", label: "Bez podkategorije" },
                ...selectedCategory.subcategories.map((s) => ({
                  value: s.id,
                  label: s.name,
                })),
              ]}
            />
          )}

          <Input
            label="Datum"
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            required
          />

          <Button
            type="submit"
            className="w-full"
            loading={create.isPending || update.isPending}
          >
            {editingId ? "Sacuvaj izmjene" : "Dodaj transakciju"}
          </Button>
        </form>
      </Modal>
    </motion.div>
  );
}
