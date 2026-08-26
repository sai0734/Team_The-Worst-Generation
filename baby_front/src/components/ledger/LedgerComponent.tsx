import { ChangeEvent, KeyboardEvent, useEffect, useState } from "react";
import * as ledgerApi from "../../api/ledgerApi";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type Ledger,
  type LedgerCategory,
  type LedgerSummary,
  type LedgerType,
} from "../../api/ledgerApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import CategoryDonutChart from "./CategoryDonutChart";

interface PendingItem {
  id: string;
  memo: string;
  type: LedgerType;
  category: LedgerCategory | "";
  amount: string;
  txDate: string;
}

interface EditDraft {
  memo: string;
  type: LedgerType;
  category: LedgerCategory;
  amount: string;
  txDate: string;
}

const formatWon = (n: number) => `${n.toLocaleString()}원`;

const splitMemo = (memo: string): { title: string; detail: string | null } => {
  const match = memo.match(/^(.+?)(\(.+\))$/);
  if (match) {
    return { title: match[1].trim(), detail: match[2] };
  }
  return { title: memo, detail: null };
};
const PAGE_SIZE = 5;
const YEAR_RANGE = 6;

const todayStr = () => new Date().toISOString().slice(0, 10);

const getCurrentYM = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
};

const monthRange = (year: number, month: number) => {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: fmt(start), end: fmt(end) };
};

const isSameMonth = (dateStr: string, year: number, month: number) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getFullYear() === year && d.getMonth() + 1 === month;
};

const sumByType = (list: Ledger[], type: LedgerType) =>
  list.filter((entry) => entry.type === type).reduce((sum, entry) => sum + entry.amount, 0);

const LedgerComponent = () => {
  const { exceptionHandle } = useCustomLogin();

  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [entries, setEntries] = useState<Ledger[]>([]);

  const [briefingText, setBriefingText] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(false);

  const [bulkText, setBulkText] = useState("");
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [batchDate, setBatchDate] = useState(todayStr());
  const [aiLoading, setAiLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<LedgerCategory | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState(getCurrentYM().year);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentYM().month);
  const [monthEntries, setMonthEntries] = useState<Ledger[] | null>(null);
  const [monthLoading, setMonthLoading] = useState(false);

  const [editingLno, setEditingLno] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadAll = async () => {
    try {
      const summaryRes = await ledgerApi.getSummary();
      setSummary(summaryRes);

      const entriesRes = await ledgerApi.getLedgerList(summaryRes.cycleStart, summaryRes.cycleEnd);

      setEntries(entriesRes);

      // 이번 달이 아닌 다른 년/월을 보고 있는 상태에서 항목을 추가/수정/삭제했을 때도
      // 그 목록이 같이 갱신되도록 함께 새로고침한다.
      const current = getCurrentYM();
      if (selectedYear !== current.year || selectedMonth !== current.month) {
        const { start, end } = monthRange(selectedYear, selectedMonth);
        const monthList = await ledgerApi.getLedgerList(start, end);
        setMonthEntries(monthList);
      }
    } catch (err) {
      exceptionHandle(err);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMonthChange = async (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setActiveCategoryTab("ALL");
    setPage(1);

    const current = getCurrentYM();
    if (year === current.year && month === current.month) {
      setMonthEntries(null);
      return;
    }

    const { start, end } = monthRange(year, month);
    setMonthLoading(true);
    try {
      const list = await ledgerApi.getLedgerList(start, end);
      setMonthEntries(list);
    } catch (err) {
      exceptionHandle(err);
    } finally {
      setMonthLoading(false);
    }
  };

  const addBlankItem = () => {
    setPendingItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        memo: "",
        type: "EXPENSE",
        category: "",
        amount: "",
        txDate: batchDate,
      },
    ]);
  };

  const updateItem = (id: string, patch: Partial<PendingItem>) => {
    setPendingItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 일부 환경(브라우저 확장/입력기 등)에서 textarea의 기본 줄바꿈 동작이 먹지 않는 경우가 있어서,
  // 커서 위치에 직접 줄바꿈을 넣어주는 방식으로 항상 동작하게 함
  const handleBulkTextKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) {
      return;
    }
    e.preventDefault();

    const target = e.currentTarget;
    const { selectionStart, selectionEnd, value } = target;
    const next = value.slice(0, selectionStart) + "\n" + value.slice(selectionEnd);
    setBulkText(next);

    const caret = selectionStart + 1;
    requestAnimationFrame(() => {
      target.selectionStart = target.selectionEnd = caret;
    });
  };

  const handleClassifyBulk = async () => {
    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) return;

    setAiLoading(true);
    try {
      const results = await ledgerApi.classifyMemoBulk(lines);

      const items: PendingItem[] = lines.map((line, i) => {
        const result = results[i];
        return {
          id: `${Date.now()}-${i}`,
          memo: result?.description?.trim() || line,
          type: result?.type ?? "EXPENSE",
          category: result?.category && CATEGORY_ORDER.includes(result.category) ? result.category : "",
          amount: result?.amount != null ? String(result.amount) : "",
          txDate: batchDate,
        };
      });

      setPendingItems((prev) => [...prev, ...items]);
      setBulkText("");
    } catch (err) {
      alert("AI 분류에 실패했습니다. '직접 추가'로 넣어주세요.");
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleReceiptUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = ""; // 같은 파일 다시 선택해도 onChange가 다시 뜨도록
    if (files.length === 0) return;

    setReceiptLoading(true);
    try {
      const items: PendingItem[] = [];
      let failedCount = 0;

      for (let i = 0; i < files.length; i++) {
        try {
          const results = await ledgerApi.classifyReceiptImage(files[i]);

          if (results.length === 0) {
            failedCount += 1;
            continue;
          }

          results.forEach((result, j) => {
            items.push({
              id: `${Date.now()}-receipt-${i}-${j}`,
              memo: result.description?.trim() || `영수증 ${i + 1} 항목`,
              type: result.type,
              category: result.category && CATEGORY_ORDER.includes(result.category) ? result.category : "",
              amount: result.amount != null ? String(result.amount) : "",
              txDate: result.txDate || batchDate,
            });
          });
        } catch (err) {
          failedCount += 1;
          console.error(err);
        }
      }

      if (items.length > 0) {
        setPendingItems((prev) => [...prev, ...items]);
      }

      if (files.length > 1) {
        alert(`영수증 ${files.length}장 중 ${files.length - failedCount}장을 인식했어요.`);
      } else if (items.length === 0) {
        alert("영수증에서 항목을 찾지 못했어요. '직접 추가'로 넣어주세요.");
      }
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (pendingItems.length === 0) return;

    if (pendingItems.some((item) => !item.category)) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    if (pendingItems.some((item) => !item.amount || Number(item.amount) <= 0)) {
      alert("금액이 비어있는 항목이 있어요.");
      return;
    }

    setSavingAll(true);
    try {
      for (const item of pendingItems) {
        await ledgerApi.registerLedger({
          type: item.type,
          category: item.category as LedgerCategory,
          amount: Number(item.amount),
          memo: item.memo || undefined,
          txDate: item.txDate,
        });
      }

      setPendingItems([]);
      setBatchDate(todayStr());
      loadAll();
    } catch (err) {
      alert("추가 중 일부 항목이 실패했을 수 있어요. 목록을 확인해주세요.");
      console.error(err);
      loadAll();
    } finally {
      setSavingAll(false);
    }
  };

  const handleRemove = async (lno?: number) => {
    if (!lno) return;
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;

    try {
      await ledgerApi.removeLedger(lno);
      loadAll();
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  const handleStartEdit = (entry: Ledger) => {
    if (!entry.lno) return;
    setEditingLno(entry.lno);
    setEditDraft({
      memo: entry.memo ?? "",
      type: entry.type,
      category: entry.category,
      amount: String(entry.amount),
      txDate: entry.txDate ?? todayStr(),
    });
  };

  const handleCancelEdit = () => {
    setEditingLno(null);
    setEditDraft(null);
  };

  const handleSaveEdit = async () => {
    if (!editingLno || !editDraft) return;

    if (!editDraft.amount || Number(editDraft.amount) <= 0) {
      alert("금액을 입력해주세요.");
      return;
    }

    setSavingEdit(true);
    try {
      await ledgerApi.modifyLedger(editingLno, {
        type: editDraft.type,
        category: editDraft.category,
        amount: Number(editDraft.amount),
        memo: editDraft.memo || undefined,
        txDate: editDraft.txDate,
      });

      setEditingLno(null);
      setEditDraft(null);
      loadAll();
    } catch (err) {
      alert("수정에 실패했습니다.");
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleBriefing = async () => {
    setBriefingLoading(true);
    try {
      const result = await ledgerApi.getBriefing();
      setBriefingText(result.summary);
    } catch (err) {
      alert("AI 브리핑 생성에 실패했습니다.");
      console.error(err);
    } finally {
      setBriefingLoading(false);
    }
  };

  const expenseDelta = summary ? summary.totalExpense - summary.prevTotalExpense : 0;

  const isCurrentMonth =
    selectedYear === getCurrentYM().year && selectedMonth === getCurrentYM().month;
  const monthLabel = isCurrentMonth ? "이번 달" : `${selectedYear}년 ${selectedMonth}월`;

  const displayEntries = isCurrentMonth ? entries : (monthEntries ?? []);

  const monthIncome =
    isCurrentMonth && summary ? summary.totalIncome : sumByType(displayEntries, "INCOME");
  const monthExpense =
    isCurrentMonth && summary ? summary.totalExpense : sumByType(displayEntries, "EXPENSE");
  const monthCategoryBreakdown: Partial<Record<LedgerCategory, number>> =
    isCurrentMonth && summary
      ? summary.categoryBreakdown
      : displayEntries
          .filter((entry) => entry.type === "EXPENSE")
          .reduce<Partial<Record<LedgerCategory, number>>>((acc, entry) => {
            acc[entry.category] = (acc[entry.category] ?? 0) + entry.amount;
            return acc;
          }, {});

  const presentCategories = CATEGORY_ORDER.filter((cat) =>
    displayEntries.some((entry) => entry.category === cat),
  );

  const filteredEntries =
    activeCategoryTab === "ALL"
      ? displayEntries
      : displayEntries.filter((entry) => entry.category === activeCategoryTab);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleCategoryTabClick = (tab: LedgerCategory | "ALL") => {
    setActiveCategoryTab(tab);
    setPage(1);
  };

  return (
    <section className="ledger-page">
      <h2 className="page-hero-title">우리집 가계부</h2>

      <div className="month-select-row">
        <select
          value={selectedYear}
          onChange={(e) => handleMonthChange(Number(e.target.value), selectedMonth)}
          disabled={monthLoading}
        >
          {Array.from({ length: YEAR_RANGE }, (_, i) => getCurrentYM().year - i).map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(selectedYear, Number(e.target.value))}
          disabled={monthLoading}
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m}월
            </option>
          ))}
        </select>
        {isCurrentMonth ? (
          <span className="current-month-badge">이번 달</span>
        ) : (
          <button
            type="button"
            className="current-month-badge current-month-jump"
            onClick={() => handleMonthChange(getCurrentYM().year, getCurrentYM().month)}
            disabled={monthLoading}
          >
            이번 달로
          </button>
        )}
      </div>

      {summary && (
        <div className="ledger-top-grid">
          <div className="card donut-card area-donut">
            <div className="head">
              <h2>카테고리별 지출</h2>
            </div>
            <CategoryDonutChart categoryBreakdown={monthCategoryBreakdown} />
          </div>

          <div className="card stat-card income area-income">
            <small>{monthLabel} 수입</small>
            <strong>{formatWon(monthIncome)}</strong>
          </div>
          <div className="card stat-card expense area-expense">
            <small>{monthLabel} 지출</small>
            <strong>{formatWon(monthExpense)}</strong>
            {isCurrentMonth && (
              <div className="delta">
                {expenseDelta === 0
                  ? "지난 달과 동일해요"
                  : expenseDelta > 0
                    ? `지난 달보다 ${formatWon(expenseDelta)} 더 썼어요`
                    : `지난 달보다 ${formatWon(-expenseDelta)} 아꼈어요`}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="quick-add-form">
        <div className="quick-add-row">
          {isCurrentMonth && (
            <button
              type="button"
              className="tool"
              onClick={handleBriefing}
              disabled={briefingLoading}
            >
              {briefingLoading ? (
                <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <i>✦</i>
              )}
              <span>
                {briefingLoading
                  ? "브리핑 생성 중..."
                  : briefingText
                    ? "AI 브리핑 다시 받기"
                    : "AI 브리핑 받기"}
              </span>
            </button>
          )}
          <div className="quick-add-row-right">
            <button
              type="button"
              className="tool"
              onClick={handleClassifyBulk}
              disabled={aiLoading || !bulkText.trim()}
            >
              {aiLoading ? (
                <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <i>✦</i>
              )}
              <span>{aiLoading ? "분류 중..." : "AI로 분류"}</span>
            </button>
            <label className={`ghost-btn receipt-upload-btn${receiptLoading ? " disabled" : ""}`}>
              {receiptLoading ? (
                <span className="h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-black/10 border-t-[#005bb2] mr-1.5 inline-block align-middle" />
              ) : (
                "📷 "
              )}
              {receiptLoading ? "영수증 인식 중..." : "영수증으로 추가 (여러 장 가능)"}
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={handleReceiptUpload}
                disabled={receiptLoading}
              />
            </label>
            <button type="button" className="ghost-btn" onClick={addBlankItem}>
              + 직접 추가
            </button>
          </div>
        </div>

        <div className="quick-add-columns">
          <div className="card briefing-box quick-add-col-left">
            {briefingText ? (
              <p>{briefingText}</p>
            ) : (
              <p className="briefing-placeholder">
                AI 브리핑을 받아보면 이번 달 소비 총평이 여기에 표시돼요.
              </p>
            )}
          </div>

          <div className="quick-add-input-col">
            <textarea
              className="bulk-input"
              rows={4}
              placeholder={"예:\n기저귀 32000원\n분유 45000원\n택시 12000원\n\n(한 줄에 한 항목씩, 여러 개 한번에 입력 가능해요)"}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              onKeyDown={handleBulkTextKeyDown}
            />

            {pendingItems.length > 0 && (
              <div className="pending-panel">
                <div className="pending-date-row">
                  <label>날짜</label>
                  <input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} />
                </div>

                <div className="pending-scroll">
                  {pendingItems.map((item) => (
                    <div className="pending-item" key={item.id}>
                      <input
                        type="text"
                        placeholder="내용"
                        value={item.memo}
                        onChange={(e) => updateItem(item.id, { memo: e.target.value })}
                      />
                      <select
                        value={item.type}
                        onChange={(e) => updateItem(item.id, { type: e.target.value as LedgerType })}
                      >
                        <option value="EXPENSE">지출</option>
                        <option value="INCOME">수입</option>
                      </select>
                      <select
                        className={item.category ? "" : "unselected"}
                        value={item.category}
                        onChange={(e) =>
                          updateItem(item.id, { category: e.target.value as LedgerCategory | "" })
                        }
                      >
                        <option value="">카테고리 선택</option>
                        {CATEGORY_ORDER.map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat]}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min={0}
                        placeholder="금액"
                        value={item.amount}
                        onChange={(e) => updateItem(item.id, { amount: e.target.value })}
                      />
                      <div className="pending-date-cell">
                        <input
                          type="date"
                          value={item.txDate}
                          onChange={(e) => updateItem(item.id, { txDate: e.target.value })}
                        />
                        {!isSameMonth(item.txDate, getCurrentYM().year, getCurrentYM().month) && (
                          <small className="date-warn-badge">이번 달 아님</small>
                        )}
                      </div>
                      <button
                        type="button"
                        className="icon-btn-ghost"
                        onClick={() => removeItem(item.id)}
                        aria-label="제외"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                <button type="button" className="submit-btn" onClick={handleSaveAll} disabled={savingAll}>
                  {savingAll ? "추가 중..." : `${pendingItems.length}개 항목 한번에 추가`}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {displayEntries.length > 0 && (
        <div className="category-tabs">
          <button
            type="button"
            className={`category-tab${activeCategoryTab === "ALL" ? " active" : ""}`}
            onClick={() => handleCategoryTabClick("ALL")}
          >
            전체
          </button>
          {presentCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-tab${activeCategoryTab === cat ? " active" : ""}`}
              onClick={() => handleCategoryTabClick(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {displayEntries.length === 0 && (
        <div className="card empty-hint">{monthLabel} 기록이 없어요.</div>
      )}
      {displayEntries.length > 0 && filteredEntries.length === 0 && (
        <div className="card empty-hint">해당 카테고리 기록이 없어요.</div>
      )}

      <div className="ledger-entries">
        {pagedEntries.map((entry) => {
          if (editingLno === entry.lno && editDraft) {
            return (
            <div className="card entry-edit-row" key={entry.lno}>
              <input
                type="text"
                placeholder="내용"
                value={editDraft.memo}
                onChange={(e) => setEditDraft({ ...editDraft, memo: e.target.value })}
              />
              <select
                value={editDraft.type}
                onChange={(e) => setEditDraft({ ...editDraft, type: e.target.value as LedgerType })}
              >
                <option value="EXPENSE">지출</option>
                <option value="INCOME">수입</option>
              </select>
              <select
                value={editDraft.category}
                onChange={(e) =>
                  setEditDraft({ ...editDraft, category: e.target.value as LedgerCategory })
                }
              >
                {CATEGORY_ORDER.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={0}
                placeholder="금액"
                value={editDraft.amount}
                onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
              />
              <input
                type="date"
                value={editDraft.txDate}
                onChange={(e) => setEditDraft({ ...editDraft, txDate: e.target.value })}
              />
              <div className="entry-edit-actions">
                <button
                  type="button"
                  className="entry-action-btn save"
                  onClick={handleSaveEdit}
                  disabled={savingEdit}
                >
                  {savingEdit ? "저장 중..." : "저장"}
                </button>
                <button type="button" className="entry-action-btn" onClick={handleCancelEdit}>
                  취소
                </button>
              </div>
            </div>
            );
          }

          const { title, detail } = splitMemo(entry.memo || CATEGORY_LABELS[entry.category]);

          return (
            <div className="card ledger-entry" key={entry.lno}>
              <div>
                <div className="memo">
                  {title}
                  {detail && <span className="memo-detail">{detail}</span>}
                </div>
                <div className={`amount ${entry.type === "INCOME" ? "income" : "expense"}`}>
                  {entry.type === "INCOME" ? "+" : "-"}
                  {formatWon(entry.amount)}
                </div>
                <div className="meta">
                  {CATEGORY_LABELS[entry.category]} · {entry.txDate}
                </div>
              </div>
              <div className="entry-actions">
                <button
                  type="button"
                  className="entry-action-btn"
                  onClick={() => handleStartEdit(entry)}
                >
                  수정
                </button>
                <button
                  type="button"
                  className="entry-action-btn danger"
                  onClick={() => handleRemove(entry.lno)}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="ledger-pagination">
          <button
            type="button"
            className="entry-action-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>
          <span className="ledger-pagination-status">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="entry-action-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </button>
        </div>
      )}
    </section>
  );
};

export default LedgerComponent;
