import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as recallApi from "../../api/recallApi";
import type {
  CertificationDetail,
  DomesticRecallDetail,
  ForeignRecallDetail,
  MyProduct,
} from "../../api/recallApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const RECALL_TYPE_LABELS: Record<string, string> = {
  CERT: "인증취소",
  DOMESTIC: "국내 리콜",
  FOREIGN: "해외 리콜",
};

type DetailState =
  | { type: "CERT"; data: CertificationDetail }
  | { type: "DOMESTIC"; data: DomesticRecallDetail }
  | { type: "FOREIGN"; data: ForeignRecallDetail };

// SafetyKorea API는 값이 없는 텍스트 필드를 문자열 "0"으로 내려줄 때가 있어서
// (null/빈 문자열이 아니라 "0" 그대로) 이걸 실제 값처럼 보여주거나 링크로 걸지 않도록 걸러냄
const displayValue = (v?: string | null): string => (v && v !== "0" ? v : "-");
const isRealValue = (v?: string | null): boolean => !!v && v !== "0";

const RecallDetailModal = ({
  product,
  detail,
  loading,
  onClose,
}: {
  product: MyProduct;
  detail: DetailState | null;
  loading: boolean;
  onClose: () => void;
}) => {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="recall-header">
          <h3>{product.productName}</h3>
          <button type="button" className="icon-btn-ghost" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </div>

        {loading && <p>불러오는 중...</p>}

        {!loading && !detail && <p>상세정보를 불러오지 못했습니다.</p>}

        {!loading && detail?.type === "CERT" && (
          <dl className="detail-list">
            <dt>인증기관</dt>
            <dd>{displayValue(detail.data.certOrganName)}</dd>
            <dt>인증상태</dt>
            <dd>{displayValue(detail.data.certState)}</dd>
            <dt>변경사유</dt>
            <dd>{displayValue(detail.data.certChgReason)}</dd>
            <dt>제조자</dt>
            <dd>{displayValue(detail.data.makerName)}</dd>
            <dt>수입자</dt>
            <dd>{displayValue(detail.data.importerName)}</dd>
            <dt>비고</dt>
            <dd>{displayValue(detail.data.remark)}</dd>
          </dl>
        )}

        {!loading && detail?.type === "DOMESTIC" && (
          <dl className="detail-list">
            <dt>리콜 사유</dt>
            <dd>{displayValue(detail.data.harmDscr)}</dd>
            <dt>사고 사례</dt>
            <dd>{displayValue(detail.data.accidentCaseDscr)}</dd>
            <dt>조치 사항</dt>
            <dd>{displayValue(detail.data.publishActionDscr)}</dd>
            <dt>공표일</dt>
            <dd>{displayValue(detail.data.publishDate)}</dd>
            <dt>제조/판매사</dt>
            <dd>{displayValue(detail.data.recallCmpnyName)}</dd>
            <dt>문의처</dt>
            <dd>{displayValue(detail.data.recallInqryTel)}</dd>
          </dl>
        )}

        {!loading && detail?.type === "FOREIGN" && (
          <dl className="detail-list">
            <dt>위반 사유</dt>
            <dd>{displayValue(detail.data.violateDscr)}</dd>
            <dt>사고 사례</dt>
            <dd>{displayValue(detail.data.accidentCaseDscr)}</dd>
            <dt>조치 사항</dt>
            <dd>{displayValue(detail.data.publishActionDscr)}</dd>
            <dt>제품 설명</dt>
            <dd>{displayValue(detail.data.recallProductDscr)}</dd>
            <dt>공표국가/기관</dt>
            <dd>
              {[detail.data.recallPblshCntryName, detail.data.recallPblshOrgnName]
                .filter((v) => isRealValue(v))
                .join(" · ") || "-"}
            </dd>
            <dt>공표일</dt>
            <dd>{displayValue(detail.data.publishDate)}</dd>
            {isRealValue(detail.data.recallUrl) && (
              <>
                <dt>원문 링크</dt>
                <dd>
                  <a href={detail.data.recallUrl} target="_blank" rel="noreferrer">
                    바로가기
                  </a>
                </dd>
              </>
            )}
          </dl>
        )}
      </div>
    </div>
  );
};

const RecallStatusBadge = ({ product }: { product: MyProduct }) => {
  if (!product.recallMatched) {
    return <span className="badge safe">이상 없음</span>;
  }

  return (
    <span className="badge danger">
      리콜 대상
      {product.recallType ? ` · ${RECALL_TYPE_LABELS[product.recallType]}` : ""}
    </span>
  );
};

const RecallListComponent = () => {
  const navigate = useNavigate();
  const { exceptionHandle } = useCustomLogin();

  const [productList, setProductList] = useState<MyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailProduct, setDetailProduct] = useState<MyProduct | null>(null);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [notificationPhone, setNotificationPhone] = useState<string | null>(null);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  const loadSetting = async () => {
    try {
      const setting = await recallApi.getRecallSetting();
      setNotificationPhone(setting.notificationPhone ?? null);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  const handleStartEditPhone = () => {
    setPhoneInput(notificationPhone ?? "");
    setEditingPhone(true);
  };

  const handleSavePhone = async () => {
    const trimmed = phoneInput.trim();
    if (!trimmed) {
      alert("휴대폰 번호를 입력해주세요.");
      return;
    }

    setPhoneSaving(true);
    try {
      const setting = await recallApi.updateRecallSetting(trimmed);
      setNotificationPhone(setting.notificationPhone ?? null);
      setEditingPhone(false);
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message ?? "번호 등록에 실패했습니다.");
    } finally {
      setPhoneSaving(false);
    }
  };

  const loadList = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await recallApi.getMyProductList();
      setProductList(list);
    } catch (err: any) {
      console.error(err);
      if (err?.response) {
        exceptionHandle(err);
      }
      setError("제품 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRemove = async (productNo?: number) => {
    if (!productNo) return;
    if (!confirm("이 제품을 삭제하시겠습니까?")) return;

    try {
      await recallApi.removeMyProduct(productNo);
      setProductList((prev) => prev.filter((p) => p.productNo !== productNo));
    } catch (err) {
      alert("삭제에 실패했습니다.");
      console.error(err);
    }
  };

  const handleShowDetail = async (product: MyProduct) => {
    if (!product.recallType || !product.recallUid) return;

    setDetailProduct(product);
    setDetail(null);
    setDetailLoading(true);
    try {
      if (product.recallType === "CERT") {
        const data = await recallApi.getCertificationDetail(product.recallUid);
        setDetail({ type: "CERT", data });
      } else if (product.recallType === "DOMESTIC") {
        const data = await recallApi.getDomesticRecallDetail(product.recallUid);
        setDetail({ type: "DOMESTIC", data });
      } else if (product.recallType === "FOREIGN") {
        const data = await recallApi.getForeignRecallDetail(product.recallUid);
        if (data) setDetail({ type: "FOREIGN", data });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="recall-page">
      <p className="eyebrow">MY PRODUCTS</p>
      <div className="recall-header">
        <h2>내 육아용품 리콜 현황</h2>
        <button type="button" className="tool" onClick={() => navigate("/recall/write")}>
          <i>＋</i>
          <span>제품 등록</span>
        </button>
      </div>

      <div className="card recall-notify-setting">
        {!editingPhone ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span>
              리콜 문자 알림:{" "}
              {notificationPhone ? (
                <strong>{notificationPhone}</strong>
              ) : (
                <span className="meta">등록된 번호가 없어요</span>
              )}
            </span>
            <button type="button" className="ghost-btn" onClick={handleStartEditPhone}>
              {notificationPhone ? "번호 변경" : "번호 등록하기"}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="tel"
              placeholder="01012345678"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="button" className="ghost-btn" onClick={handleSavePhone} disabled={phoneSaving}>
              저장
            </button>
            <button type="button" className="ghost-btn" onClick={() => setEditingPhone(false)}>
              취소
            </button>
          </div>
        )}
      </div>

      {loading && <div className="card recall-empty">불러오는 중...</div>}

      {!loading && error && (
        <div className="card recall-empty">
          {error}
          <br />
          <button
            type="button"
            className="ghost-btn"
            onClick={loadList}
            style={{ marginTop: 12 }}
          >
            다시 시도
          </button>
        </div>
      )}

      {!loading && !error && productList.length === 0 && (
        <div className="card recall-empty">
          등록된 제품이 없어요.
          <br />
          가지고 있는 육아용품을 등록하면 리콜 여부를 자동으로 확인해드려요.
        </div>
      )}

      <div className="recall-list">
        {productList.map((product) => (
          <div className="card recall-item" key={product.productNo}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {product.imageName && (
                <img
                  src={recallApi.getMyProductThumbnailUrl(product.imageName)}
                  alt={product.productName}
                  className="recall-item-thumb"
                />
              )}
              <div>
              <div className="name">{product.productName}</div>
              <div className="meta">
                {[product.brandName, product.modelName].filter(Boolean).join(" · ") ||
                  "브랜드/모델 정보 없음"}
              </div>
              {product.recallMatched && isRealValue(product.recallTitle) && (
                <div className="title">{product.recallTitle}</div>
              )}
              </div>
            </div>
            <div className="recall-actions">
              <RecallStatusBadge product={product} />
              {product.recallMatched && (
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => handleShowDetail(product)}
                >
                  상세보기
                </button>
              )}
              <button
                type="button"
                className="icon-btn-ghost"
                onClick={() => navigate(`/recall/edit/${product.productNo}`)}
                aria-label="수정"
              >
                ✎
              </button>
              <button
                type="button"
                className="icon-btn-ghost"
                onClick={() => handleRemove(product.productNo)}
                aria-label="삭제"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {detailProduct && (
        <RecallDetailModal
          product={detailProduct}
          detail={detail}
          loading={detailLoading}
          onClose={() => setDetailProduct(null)}
        />
      )}
    </section>
  );
};

export default RecallListComponent;
