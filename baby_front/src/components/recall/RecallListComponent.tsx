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
    return (
      <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
        이상 없음
      </span>
    );
  }

  return (
    <span className="inline-block px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
      리콜 대상 · {product.recallType ? RECALL_TYPE_LABELS[product.recallType] : ""}
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
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2>AI 육아용품 리콜</h2>
        <button onClick={() => navigate("/recall/write")}>제품 등록</button>
      </div>

      {productList.length === 0 && <div>등록된 제품이 없습니다.</div>}

      <ul>
        {productList.map((product) => (
          <li
            key={product.productNo}
            className="flex justify-between items-center border-b py-3"
          >
            <div>
              <div className="font-bold">{product.productName}</div>
              <div className="text-sm text-gray-500">
                {[product.brandName, product.modelName]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {product.recallMatched && product.recallTitle && (
                <div className="text-sm text-red-600 mt-1">
                  {product.recallTitle}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <RecallStatusBadge product={product} />
              <button onClick={() => handleRemove(product.productNo)}>
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecallListComponent;
