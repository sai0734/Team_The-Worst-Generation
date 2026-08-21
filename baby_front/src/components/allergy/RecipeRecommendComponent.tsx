import { useMemo, useState } from "react";
import * as allergyApi from "../../api/allergyApi";
import type { RecipeRecommend } from "../../types/allergy";

interface RecipeRecommendComponentProps {
  checkNo: number;
}

interface ParsedRecipe {
  recipeName: string;
  ingredients: string[];
  instructions: string;
}

const productTypes = ["이유식", "간식", "국"];

const parseRecipe = (raw: string): ParsedRecipe | null => {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "");
    const parsed = JSON.parse(cleaned);

    if (
      typeof parsed.recipeName === "string" &&
      Array.isArray(parsed.ingredients) &&
      typeof parsed.instructions === "string"
    ) {
      return parsed as ParsedRecipe;
    }
    return null;
  } catch {
    return null;
  }
};

const RecipeRecommendComponent = ({
  checkNo,
}: RecipeRecommendComponentProps) => {
  const [productType, setProductType] = useState(productTypes[0]);
  const [recipe, setRecipe] = useState<RecipeRecommend | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRecommend = async () => {
    setLoading(true);
    try {
      const result = await allergyApi.recommendRecipe(checkNo, productType);
      setRecipe(result);
    } catch (err) {
      alert("레시피 추천에 실패했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parsedRecipe = useMemo(
    () =>
      recipe?.recommendRecipe ? parseRecipe(recipe.recommendRecipe) : null,
    [recipe],
  );

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(255, 176, 32, 0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            flexShrink: 0,
          }}
        >
          🍼
        </div>
        <div>
          <h2 style={{ margin: 0 }}>알레르기 회피 레시피 추천</h2>
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            검출된 알레르기 성분을 피해서 아기용 레시피를 만들어드려요.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginTop: 18,
          flexWrap: "wrap",
        }}
      >
        {productTypes.map((type) => {
          const active = type === productType;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setProductType(type)}
              style={{
                padding: "8px 18px",
                borderRadius: 999,
                border: active ? "none" : "1px solid var(--line)",
                background: active ? "var(--accent)" : "var(--glass)",
                color: active ? "#fff" : "var(--muted)",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {type}
            </button>
          );
        })}

        <button
          type="button"
          disabled={loading}
          onClick={handleRecommend}
          style={{
            marginLeft: "auto",
            padding: "10px 22px",
            borderRadius: 999,
            border: "none",
            background: "var(--accent)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "추천 받는 중..." : "레시피 추천받기 ✨"}
        </button>
      </div>

      {recipe &&
        (parsedRecipe ? (
          <div
            style={{
              marginTop: 20,
              borderRadius: 20,
              background:
                "linear-gradient(135deg, rgba(255, 176, 32, 0.14) 0%, var(--glass) 65%)",
              border: "1px solid var(--line)",
              padding: 22,
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                color: "#b06a00",
                margin: 0,
              }}
            >
              🍽 오늘의 레시피
            </p>
            <h3 style={{ fontSize: 20, margin: "4px 0 18px" }}>
              {parsedRecipe.recipeName}
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1.6fr",
                gap: 18,
              }}
            >
              <div>
                <strong style={{ fontSize: 12, color: "var(--muted)" }}>
                  🧺 재료
                </strong>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {parsedRecipe.ingredients.map((item, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 12,
                        padding: "6px 12px",
                        borderRadius: 999,
                        background: "var(--glass)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong style={{ fontSize: 12, color: "var(--muted)" }}>
                  👩‍🍳 조리 방법
                </strong>
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    lineHeight: 1.8,
                    whiteSpace: "pre-line",
                    background: "var(--glass)",
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    padding: 12,
                  }}
                >
                  {parsedRecipe.instructions}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p
            style={{
              whiteSpace: "pre-line",
              marginTop: 20,
              padding: 16,
              borderRadius: 14,
              background: "var(--soft)",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {recipe.recommendRecipe}
          </p>
        ))}
    </div>
  );
};

export default RecipeRecommendComponent;
