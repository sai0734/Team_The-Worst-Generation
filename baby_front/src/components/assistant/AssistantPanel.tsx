import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  assistantApi,
  type AssistItem,
  type MedianIncomeBand,
} from "../../api/assistantApi";
import * as babyInfoApi from "../../api/babyInfoApi";
import type { BabyInfo } from "../../api/babyInfoApi";
import useCustomLogin from "../../hooks/useCustomLogin";
import { loadKakaoMapScript } from "../../util/kakaoMapLoader";


const SIDO_OPTIONS = [
  "서울특별시", "부산광역시", "대구광역시", "인천광역시", "광주광역시",
  "대전광역시", "울산광역시", "세종특별자치시", "경기도", "강원특별자치도",
  "충청북도", "충청남도", "전북특별자치도", "전라남도", "경상북도",
  "경상남도", "제주특별자치도",
];
const SEOUL_SIGUNGU_OPTIONS = [
  "종로구", "중구", "용산구", "성동구", "광진구", "동대문구", "중랑구",
  "성북구", "강북구", "도봉구", "노원구", "은평구", "서대문구", "마포구",
  "양천구", "강서구", "구로구", "금천구", "영등포구", "동작구", "관악구",
  "서초구", "강남구", "송파구", "강동구", "아이봄동",
];

const SIDO_ALIASES: Record<string, string> = {
  서울: "서울특별시", 부산: "부산광역시", 대구: "대구광역시", 인천: "인천광역시",
  광주: "광주광역시", 대전: "대전광역시", 울산: "울산광역시", 세종: "세종특별자치시",
  경기: "경기도", 강원: "강원특별자치도", 충북: "충청북도", 충남: "충청남도",
  전북: "전북특별자치도", 전남: "전라남도", 경북: "경상북도", 경남: "경상남도",
  제주: "제주특별자치도",
};

const normalizeSido = (value: string): string => {
  const trimmed = value.trim();
  if (SIDO_OPTIONS.includes(trimmed)) return trimmed;
  const alias = Object.keys(SIDO_ALIASES).find((key) => trimmed.includes(key));
  return alias ? SIDO_ALIASES[alias] : trimmed;
};

const HOUSEHOLD_SIZES = Array.from({ length: 5 }, (_, index) => ({
  value: index + 1,
  label: `${index + 1}명`,
}));

const MEDIAN_INCOME_2026: Record<number, number> = {
  1: 2_564_238,
  2: 4_199_292,
  3: 5_359_036,
  4: 6_494_738,
  5: 7_556_719,
};

interface IncomeRatioOption {
  value: MedianIncomeBand;
  minRatio?: number;
  maxRatio?: number;
}

const INCOME_RATIO_OPTIONS: IncomeRatioOption[] = [
  { value: "UNDER_50", maxRatio: 50 },
  { value: "50_TO_75", minRatio: 50, maxRatio: 75 },
  { value: "75_TO_100", minRatio: 75, maxRatio: 100 },
  { value: "100_TO_120", minRatio: 100, maxRatio: 120 },
  { value: "120_TO_150", minRatio: 120, maxRatio: 150 },
  { value: "150_TO_180", minRatio: 150, maxRatio: 180 },
  { value: "180_TO_200", minRatio: 180, maxRatio: 200 },
  { value: "200_TO_250", minRatio: 200, maxRatio: 250 },
  { value: "OVER_250", minRatio: 250 },
];

const incomeInTenThousands = (baseIncome: number, ratio: number): number =>
  Math.round((baseIncome * ratio) / 100 / 10_000);

const incomeOptionLabel = (
  option: IncomeRatioOption,
  householdSize: number,
  index: number,
): string => {
  const baseIncome = MEDIAN_INCOME_2026[householdSize];
  if (!baseIncome) return "가구원 수를 먼저 선택해 주세요";

  const prefix = `${index + 1}구간 - `;
  if (option.minRatio == null && option.maxRatio != null) {
    return `${prefix}월 ${incomeInTenThousands(baseIncome, option.maxRatio)}만원 이하`;
  }
  if (option.minRatio != null && option.maxRatio == null) {
    return `${prefix}월 ${incomeInTenThousands(baseIncome, option.minRatio)}만원 초과`;
  }
  return `${prefix}월 ${incomeInTenThousands(baseIncome, option.minRatio!)}~${incomeInTenThousands(baseIncome, option.maxRatio!)}만원`;
};

const HOUSEHOLD_TYPES = [
  "맞벌이·양육공백",
  "한부모·조손",
  "다자녀",
  "다태아·쌍둥이",
  "장애아동",
  "장애부모",
  "다문화가정",
  "입양·가정위탁",
  "청소년 부모",
  "미숙아·선천성이상아",
  "임신·출산 예정",
];

const ageInMonthsFromBirth = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 +
    (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months -= 1;
  return Math.max(months, 0);
};

interface AdministrativeRegion {
  sido: string;
  sigungu: string;
}

interface KakaoRegionResult {
  region_type: string;
  region_1depth_name: string;
  region_2depth_name: string;
}

interface KakaoMapsForRegion {
  services?: {
    Geocoder: new () => {
      coord2RegionCode: (
        longitude: number,
        latitude: number,
        callback: (result: KakaoRegionResult[], status: string) => void,
      ) => void;
    };
    Status: { OK: string };
  };
}

interface KakaoWindowForRegion {
  kakao?: { maps?: KakaoMapsForRegion };
}

const getCurrentPosition = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서는 현재 위치를 사용할 수 없습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10_000,
      maximumAge: 5 * 60 * 1_000,
    });
  });

const coordinatesToRegion = async (
  latitude: number,
  longitude: number,
): Promise<AdministrativeRegion> => {
  await loadKakaoMapScript();

  return new Promise((resolve, reject) => {
    const kakaoMaps = (window as unknown as KakaoWindowForRegion).kakao?.maps;
    if (!kakaoMaps?.services) {
      reject(new Error("카카오 주소 변환 서비스를 불러오지 못했습니다."));
      return;
    }

    const geocoder = new kakaoMaps.services.Geocoder();
    geocoder.coord2RegionCode(
      longitude,
      latitude,
      (result, status) => {
        if (status !== kakaoMaps.services.Status.OK || result.length === 0) {
          reject(new Error("현재 위치의 행정구역을 확인하지 못했습니다."));
          return;
        }

        const region = result.find((item) => item.region_type === "H") ?? result[0];
        resolve({
          sido: normalizeSido(region.region_1depth_name ?? ""),
          // 세종처럼 2단계 행정구역명이 비어 있는 경우에는 시·도명을 함께 사용한다.
          sigungu: region.region_2depth_name || region.region_1depth_name || "",
        });
      },
    );
  });
};

const LINK_PATTERN = /(https?:\/\/[^\s]+)/g;
const GUIDE_STORAGE_PREFIX = "babycare.subsidyGuide.";

interface StoredSubsidyGuide {
  answer: string;
  sources: AssistItem[];
  householdSize: number | null;
  medianIncomeBand: MedianIncomeBand;
  householdTypes: string[];
}

const guideStorageKey = (email: string) => `${GUIDE_STORAGE_PREFIX}${email}`;

const loadStoredGuide = (email: string): StoredSubsidyGuide | null => {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(guideStorageKey(email));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSubsidyGuide>;
    if (typeof parsed.answer !== "string" || !parsed.answer.trim()) return null;
    return {
      answer: parsed.answer,
      sources: Array.isArray(parsed.sources) ? parsed.sources : [],
      householdSize: typeof parsed.householdSize === "number" ? parsed.householdSize : null,
      medianIncomeBand: parsed.medianIncomeBand ?? "UNKNOWN",
      householdTypes: Array.isArray(parsed.householdTypes) ? parsed.householdTypes : [],
    };
  } catch {
    return null;
  }
};

const saveStoredGuide = (email: string, guide: StoredSubsidyGuide) => {
  if (!email) return;
  localStorage.setItem(guideStorageKey(email), JSON.stringify(guide));
};

const linkedAnswer = (text: string) =>
  text.split(LINK_PATTERN).map((part, index) =>
    part.startsWith("http://") || part.startsWith("https://") ? (
      <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer">{part}</a>
    ) : (
      part
    ),
  );

interface AssistantPanelProps {
  className?: string;
  style?: CSSProperties;
}

const AssistantPanel = ({ className, style }: AssistantPanelProps) => {
  const { isLogin, loginState } = useCustomLogin();
  const email = loginState.email ?? "";
  const [months, setMonths] = useState(6);
  const [babies, setBabies] = useState<BabyInfo[]>([]);
  const [selectedBabyNo, setSelectedBabyNo] = useState<number | null>(null);
  const [sido, setSido] = useState("");
  const [sigungu, setSigungu] = useState("");
  const [householdSize, setHouseholdSize] = useState<number | null>(null);
  const [medianIncomeBand, setMedianIncomeBand] = useState<MedianIncomeBand>("UNKNOWN");
  const [householdTypes, setHouseholdTypes] = useState<string[]>([]);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<AssistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!isLogin) {
      // 로그아웃한 사용자의 가족·지역 정보가 화면에 남지 않도록 즉시 초기화한다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSido("");
      setSigungu("");
      setMonths(6);
      setBabies([]);
      setSelectedBabyNo(null);
      setHouseholdSize(null);
      setMedianIncomeBand("UNKNOWN");
      setHouseholdTypes([]);
      setAnswer("");
      setSources([]);
      return;
    }

    let cancelled = false;
    const stored = loadStoredGuide(email);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAnswer(stored.answer);
      setSources(stored.sources);
      setHouseholdSize(stored.householdSize);
      setMedianIncomeBand(stored.medianIncomeBand);
      setHouseholdTypes(stored.householdTypes);
    }

    const loadProfile = async () => {
      try {
        const [region, babies] = await Promise.all([
          assistantApi.getRegion(),
          babyInfoApi.getList().catch(() => []),
        ]);
        if (cancelled) return;
        setSido(normalizeSido(region.regionSido ?? ""));
        setSigungu(region.regionSigungu ?? "");

        setBabies(babies);
        if (babies.length > 0) {
          const youngest = [...babies].sort((a, b) =>
            b.birthDate.localeCompare(a.birthDate),
          )[0];
          setSelectedBabyNo(youngest.babyNo ?? null);
          setMonths(ageInMonthsFromBirth(youngest.birthDate));
        } else if (region.babyMonths != null && region.babyMonths >= 0) {
          setMonths(region.babyMonths);
        }
      } catch (error) {
        console.error(error);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [email, isLogin]);

  const selectedBaby = useMemo(
    () => babies.find((baby) => baby.babyNo === selectedBabyNo) ?? null,
    [babies, selectedBabyNo],
  );

  const profileLine = useMemo(
    () => `${selectedBaby?.babyName ?? "아이"} ${months}개월 · ${[sido, sigungu].filter(Boolean).join(" ") || "거주지 미입력"}`,
    [months, selectedBaby, sido, sigungu],
  );

  const changeBaby = (babyNo: number) => {
    const baby = babies.find((item) => item.babyNo === babyNo);
    setSelectedBabyNo(babyNo);
    if (baby) setMonths(ageInMonthsFromBirth(baby.birthDate));
  };

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      const position = await getCurrentPosition();
      const region = await coordinatesToRegion(
        position.coords.latitude,
        position.coords.longitude,
      );
      setSido(region.sido);
      setSigungu(region.sigungu);
    } catch (error) {
      console.error(error);
    } finally {
      setLocating(false);
    }
  };

  const toggleHouseholdType = (type: string) => {
    setHouseholdTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type],
    );
  };

  const requestGuide = async () => {
    if (!sido.trim() || !sigungu.trim() || householdSize == null) {
      setAnswer("거주지와 가족 구성원 수만 선택하면 바로 확인할 수 있어요.");
      return;
    }

    setLoading(true);
    setAnswer("");
    setSources([]);
    try {
      await assistantApi.saveRegion({
        regionSido: sido.trim(),
        regionSigungu: sigungu.trim(),
        babyMonths: months,
      });
      const response = await assistantApi.ask({
        child: {
          babyMonths: months,
          regionSido: sido.trim(),
          regionSigungu: sigungu.trim(),
          householdSize,
          medianIncomeBand,
          householdTypes,
        },
      });
      setAnswer(response.answer);
      setSources(response.items ?? []);
      saveStoredGuide(email, {
        answer: response.answer,
        sources: response.items ?? [],
        householdSize,
        medianIncomeBand,
        householdTypes,
      });
    } catch (error) {
      console.error(error);
      setAnswer("맞춤 지원금 안내를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      id="ai-subsidy-panel"
      className={`gov-card gov-subsidy-panel${className ? ` ${className}` : ""}`}
      style={style}
    >
      <div className="assist-panel-head">
        <div className="assist-panel-copy">
          <h3><span className="assist-ai-mark" aria-hidden>✦</span> 우리 가족 정부지원금 안내</h3>
          <p className="assist-profile">{profileLine}</p>
        </div>
      </div>

      <div className="assist-filters">
        <div className="assist-filter-group">
          <label htmlFor={babies.length > 0 ? "assist-baby" : "assist-months"}>아이</label>
          {babies.length > 0 ? (
            <select
              id="assist-baby"
              value={selectedBabyNo ?? ""}
              disabled={!isLogin}
              onChange={(event) => changeBaby(Number(event.target.value))}
            >
              {babies.map((baby) => (
                <option key={baby.babyNo ?? baby.babyName} value={baby.babyNo}>
                  {baby.babyName} ({ageInMonthsFromBirth(baby.birthDate)}개월)
                </option>
              ))}
            </select>
          ) : (
            <input
              id="assist-months"
              type="number"
              min={0}
              value={months}
              disabled={!isLogin}
              aria-label="아이 나이(개월)"
              onChange={(event) => setMonths(Number(event.target.value) || 0)}
            />
          )}
        </div>
        <div className="assist-filter-group assist-location-group">
          <label htmlFor="assist-sido">거주 지역</label>
          <button
            type="button"
            className="assist-current-location"
            disabled={!isLogin || locating}
            onClick={() => void handleUseCurrentLocation()}
          >
            {locating ? "현재 위치 확인 중…" : "현재 위치로 지역 설정"}
          </button>
          <div className="assist-location-fields">
            <select
              id="assist-sido"
              value={sido}
              disabled={!isLogin}
              aria-label="시·도"
              onChange={(event) => {
                setSido(event.target.value);
                setSigungu("");
              }}
            >
              <option value="">시·도 선택</option>
              {SIDO_OPTIONS.map((option) => <option key={option}>{option}</option>)}
            </select>
            {sido === "서울특별시" ? (
              <select
                id="assist-sigungu"
                value={sigungu}
                disabled={!isLogin}
                aria-label="시·군·구"
                onChange={(event) => setSigungu(event.target.value)}
              >
                <option value="">시·군·구 선택</option>
                {SEOUL_SIGUNGU_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <input
                id="assist-sigungu"
                type="text"
                placeholder="시·군·구"
                value={sigungu}
                disabled={!isLogin || !sido}
                aria-label="시·군·구"
                onChange={(event) => setSigungu(event.target.value)}
              />
            )}
          </div>
        </div>
        <div className="assist-filter-group">
          <label htmlFor="assist-household-size">가족 구성원 수</label>
          <select
            id="assist-household-size"
            value={householdSize ?? ""}
            disabled={!isLogin}
            onChange={(event) => {
              setHouseholdSize(Number(event.target.value) || null);
              setMedianIncomeBand("UNKNOWN");
            }}
          >
            <option value="">선택해 주세요</option>
            {HOUSEHOLD_SIZES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="assist-filter-group">
          <label htmlFor="assist-income">월 가구소득</label>
          <select
            id="assist-income"
            value={medianIncomeBand}
            disabled={!isLogin || householdSize == null}
            onChange={(event) => setMedianIncomeBand(event.target.value as MedianIncomeBand)}
          >
            <option value="UNKNOWN">
              {householdSize == null ? "가족 구성원 수를 먼저 선택해 주세요" : "잘 모르겠어요"}
            </option>
            {householdSize != null ? INCOME_RATIO_OPTIONS.map((option, index) => (
              <option key={option.value} value={option.value}>
                {incomeOptionLabel(option, householdSize, index)}
              </option>
            )) : null}
          </select>
        </div>
        <div className="assist-filter-group assist-household-types">
          <label>가구 특성</label>
          <div className="assist-tag-group" role="group" aria-label="가구 특성">
            {HOUSEHOLD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className={`assist-tag${householdTypes.includes(type) ? " is-on" : ""}`}
                aria-pressed={householdTypes.includes(type)}
                disabled={!isLogin}
                onClick={() => toggleHouseholdType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="gov-subsidy-cta assist-guide-submit"
        disabled={!isLogin || loading}
        onClick={() => void requestGuide()}
      >
        {loading ? "우리 가족 지원금을 확인하는 중…" : "내 지원금 한 번에 확인"}
      </button>

      {!isLogin ? <p className="assist-hint assist-guide-notice">로그인하면 가족 정보로 확인할 수 있어요.</p> : null}

      {answer ? (
        <div className="assist-ask-answer assist-guide-answer">
          <p>{linkedAnswer(answer)}</p>
          {sources.length > 0 ? (
            <ul className="assist-guide-sources">
              {sources.map((source) => (
                <li key={source.id}>
                  <a href={source.link || "https://www.bokjiro.go.kr"} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                  {source.source ? <span> · {source.source}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

export default AssistantPanel;
