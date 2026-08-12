import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as recallApi from "../../api/recallApi";
import type { MyProduct } from "../../api/recallApi";
import useCustomLogin from "../../hooks/useCustomLogin";

const RECALL_TYPE_LABELS: Record<string, string> = {
  CERT: "인증취소",
  DOMESTIC: "국내 리콜",
  FOREIGN: "해외 리콜",
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

  const loadList = async () => {
    try {
      const list = await recallApi.getMyProductList();
      setProductList(list);
    } catch (err) {
      exceptionHandle(err);
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

  return (
    <section>
      <p className="eyebrow">MY PRODUCTS</p>
      <div className="recall-header">
        <h2>내 육아용품 리콜 현황</h2>
        <button type="button" className="tool" onClick={() => navigate("/recall/write")}>
          <i>＋</i>
          <span>제품 등록</span>
        </button>
      </div>

      {productList.length === 0 && (
        <div className="card recall-empty">
          등록된 제품이 없어요.
          <br />
          가지고 있는 육아용품을 등록하면 리콜 여부를 자동으로 확인해드려요.
        </div>
      )}

      <div className="recall-list">
        {productList.map((product) => (
          <div className="card recall-item" key={product.productNo}>
            <div>
              <div className="name">{product.productName}</div>
              <div className="meta">
                {[product.brandName, product.modelName].filter(Boolean).join(" · ") ||
                  "브랜드/모델 정보 없음"}
              </div>
              {product.recallMatched && product.recallTitle && (
                <div className="title">{product.recallTitle}</div>
              )}
            </div>
            <div className="recall-actions">
              <RecallStatusBadge product={product} />
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
    </section>
  );
};

export default RecallListComponent;
