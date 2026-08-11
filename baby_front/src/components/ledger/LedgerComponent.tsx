import { ChangeEvent, useEffect, useState } from "react";
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
}

interface EditDraft {
  memo: string;
  type: LedgerType;
  category: LedgerCategory;
  amount: string;
  txDate: string;
}

const formatWon = (n: number) => `${n.toLocaleString()}원`;

const todayStr = () => new Date().toISOString().slice(0, 10);

const LedgerComponent = () => {
  const { exceptionHandle } = useCustomLogin();

  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [entries, setEntries] = useState<Ledger[]>([]);

  const [briefingAvailable, setBriefingAvailable] = useState(false);
  const [briefingText, setBriefingText] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(false);

  const [bulkText, setBulkText] = useState("");
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [batchDate, setBatchDate] = useState(todayStr());
  const [aiLoading, setAiLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [activeCategoryTab, setActiveCategoryTab] = useState<LedgerCategory | "ALL">("ALL");

  const [editingLno, setEditingLno] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const loadAll = async () => {
    try {
      const summaryRes = await ledgerApi.getSummary();
      setSummary(summaryRes);

      const [entriesRes, settingRes] = await Promise.all([
        ledgerApi.getLedgerList(summaryRes.cycleStart, summaryRes.cycleEnd),
        ledgerApi.getSetting(),
      ]);

      setEntries(entriesRes);
      setBriefingAvailable(settingRes.briefingAvailable);
    } catch (err) {
      exceptionHandle(err);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addBlankItem = () => {
    setPendingItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random()}`,
        memo: "",
        type: "EXPENSE",
        category: "",
        amount: "",
      },
    ]);
  };

  const updateItem = (id: string, patch: Partial<PendingItem>) => {
    setPendingItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const removeItem = (id: string) => {
    setPendingItems((prev) => prev.filter((item) => item.id !== id));
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
          category: "",
          amount: result?.amount != null ? String(result.amount) : "",
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
              category: "",
              amount: result.amount != null ? String(result.amount) : "",
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
          txDate: batchDate,
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
      setBriefingAvailable(false);
    } catch (err) {
      alert("AI 브리핑 생성에 실패했습니다.");
      console.error(err);
    } finally {
      setBriefingLoading(false);
    }
  };

  const expenseDelta = summary ? summary.totalExpense - summary.prevTotalExpense : 0;

  const presentCategories = CATEGORY_ORDER.filter((cat) =>
    entries.some((entry) => entry.category === cat),
  );

  const filteredEntries =
    activeCategoryTab === "ALL"
      ? entries
      : entries.filter((entry) => entry.category === activeCategoryTab);

  return (
    <section className="ledger-page">
      <p className="eyebrow">THIS MONTH</p>
      <h2 className="page-title">우리집 가계부</h2>

      {summary && (
        <>
          <div className="ledger-stats">
            <div className="card stat-card income">
              <small>이번 달 수입</small>
              <strong>{formatWon(summary.totalIncome)}</strong>
            </div>
            <div className="card stat-card expense">
              <small>이번 달 지출</small>
              <strong>{formatWon(summary.totalExpense)}</strong>
              <div className="delta">
                {expenseDelta === 0
                  ? "지난 달과 동일해요"
                  : expenseDelta > 0
                    ? `지난 달보다 ${formatWon(expenseDelta)} 더 썼어요`
                    : `지난 달보다 ${formatWon(-expenseDelta)} 아꼈어요`}
              </div>
            </div>
          </div>

          <div className="card donut-card">
            <div className="head">
              <h2>카테고리별 지출</h2>
            </div>
            <CategoryDonutChart categoryBreakdown={summary.categoryBreakdown} />
          </div>

          {briefingAvailable && !briefingText && (
            <button type="button" className="tool" onClick={handleBriefing} disabled={briefingLoading}>
              <i>✦</i>
              <span>{briefingLoading ? "브리핑 생성 중..." : "AI 브리핑 받기"}</span>
            </button>
          )}

          {briefingText && (
            <div className="card briefing-box" style={{ marginTop: briefingAvailable ? 12 : 0 }}>
              <p>{briefingText}</p>
            </div>
          )}
        </>
      )}

      <div className={`quick-add-form${pendingItems.length > 0 ? " has-pending" : ""}`}>
        <div className="quick-add-input-col">
          <textarea
            className="bulk-input"
            rows={8}
            placeholder={"예:\n기저귀 32000원\n분유 45000원\n택시 12000원\n\n(한 줄에 한 항목씩, 여러 개 한번에 입력 가능해요)"}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          <div className="quick-add-row">
            <button
              type="button"
              className="tool"
              onClick={handleClassifyBulk}
              disabled={aiLoading || !bulkText.trim()}
            >
              <i>✦</i>
              <span>{aiLoading ? "분류 중..." : "AI로 분류"}</span>
            </button>
            <label className={`ghost-btn receipt-upload-btn${receiptLoading ? " disabled" : ""}`}>
              📷 {receiptLoading ? "영수증 인식 중..." : "영수증으로 추가 (여러 장 가능)"}
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

      {entries.length > 0 && (
        <div className="category-tabs">
          <button
            type="button"
            className={`category-tab${activeCategoryTab === "ALL" ? " active" : ""}`}
            onClick={() => setActiveCategoryTab("ALL")}
          >
            전체
          </button>
          {presentCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-tab${activeCategoryTab === cat ? " active" : ""}`}
              onClick={() => setActiveCategoryTab(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      )}

      {entries.length === 0 && <div className="card empty-hint">이번 달 기록이 없어요.</div>}
      {entries.length > 0 && filteredEntries.length === 0 && (
        <div className="card empty-hint">해당 카테고리 기록이 없어요.</div>
      )}

      <div className="ledger-entries">
        {filteredEntries.map((entry) =>
          editingLno === entry.lno && editDraft ? (
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
          ) : (
            <div className="card ledger-entry" key={entry.lno}>
              <div>
                <div className="memo">{entry.memo || CATEGORY_LABELS[entry.category]}</div>
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
          ),
        )}
      </div>
    </section>
  );
};

export default LedgerComponent;
