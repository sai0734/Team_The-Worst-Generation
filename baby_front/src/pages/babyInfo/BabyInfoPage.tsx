import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as babyInfoApi from "../../api/babyInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";
import BabyGrowthCardComponent from "../../components/babyInfo/BabyGrowthCardComponent";
import BabyVaccinationCardComponent from "../../components/babyInfo/BabyVaccinationCardComponent";
import BabySleepCardComponent from "../../components/babyInfo/BabySleepCardComponent";

const BabyInfoPage = () => {
  const { babyNo } = useParams<{ babyNo: string }>();
  const navigate = useNavigate();
  const [babyInfo, setBabyInfo] = useState<BabyInfo | null>(null);
  const [babyList, setBabyList] = useState<BabyInfo[]>([]);
  const [error, setError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    if (!babyNo) return;
    setError(false);
    babyInfoApi
      .getOne(babyNo)
      .then((data: BabyInfo) => setBabyInfo(data))
      .catch((err) => {
        console.error(err);
        setError(true);
      });
  }, [babyNo, retryTrigger]);

  useEffect(() => {
    babyInfoApi
      .getList()
      .then((list: BabyInfo[]) => setBabyList(list))
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const getAgeInMonths = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();

    let months =
      (today.getFullYear() - birth.getFullYear()) * 12 +
      (today.getMonth() - birth.getMonth());

    if (today.getDate() < birth.getDate()) {
      months -= 1;
    }

    return months;
  };

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-[#7A756C]">
          아이 정보를 불러오지 못했습니다.
        </p>
        <button
          type="button"
          className="rounded-full bg-[#5AB2FF] px-5 py-2 text-sm font-bold text-white"
          onClick={() => setRetryTrigger((prev) => prev + 1)}
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!babyInfo) {
    return <div>불러오는 중...</div>;
  }

  const infoGroups = [
    [
      { label: "생년월일", value: babyInfo.birthDate },
      { label: "성별", value: babyInfo.gender },
      babyInfo.bloodType
        ? { label: "혈액형", value: `${babyInfo.bloodType}형` }
        : null,
    ],
    [
      babyInfo.birthWeekCount != null
        ? { label: "출생 주수", value: `${babyInfo.birthWeekCount}주` }
        : null,
      babyInfo.birthWeight != null
        ? { label: "출생 시 체중", value: `${babyInfo.birthWeight}kg` }
        : null,
      babyInfo.birthHeight != null
        ? { label: "출생 시 키", value: `${babyInfo.birthHeight}cm` }
        : null,
      babyInfo.headCircumference != null
        ? { label: "머리둘레", value: `${babyInfo.headCircumference}cm` }
        : null,
    ],
  ].map((group) =>
    group.filter(
      (item): item is { label: string; value: string } => item !== null,
    ),
  );

  return (
    <div className="w-full flex flex-col gap-4 py-4">
      {babyList.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {babyList.map((baby) => (
            <button
              key={baby.babyNo}
              type="button"
              onClick={() => navigate(`/babyInfo/dashboard/${baby.babyNo}`)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                baby.babyNo === babyInfo.babyNo
                  ? "bg-[#5AB2FF] text-white"
                  : "border border-[rgba(42,41,38,0.15)] bg-white text-[#2A2926]"
              }`}
            >
              {baby.babyName}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 rounded-[24px] border border-[rgba(42,41,38,0.1)] bg-[#FAF6F0] p-4 sm:flex-row sm:p-6">
        {babyInfo.profileImageFileName ? (
          <img
            className="h-[140px] w-[140px] flex-shrink-0 rounded-full object-cover border-4 border-[#CAF4FF]"
            src={babyInfoApi.getViewUrl(babyInfo.profileImageFileName)}
            alt={babyInfo.babyName}
          />
        ) : (
          <div className="flex h-[140px] w-[140px] flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A0DEFF] to-[#5AB2FF] text-sm font-bold text-white">
            응애
          </div>
        )}
        <div className="min-w-0 text-center sm:text-left">
          <p className="text-[11px] font-extrabold tracking-[3px] text-[#5AB2FF]">
            BABY BOM
          </p>
          <h1 className="baby-name-heading mt-1 font-bold text-[#2A2926]">
            {babyInfo.babyName} ({getAgeInMonths(babyInfo.birthDate)}개월)
          </h1>
          <div className="mt-3 flex flex-col gap-2">
            {infoGroups.map((group, groupIdx) =>
              group.length > 0 ? (
                <div
                  key={groupIdx}
                  className={`flex flex-wrap justify-center gap-2 sm:justify-start ${
                    groupIdx > 0
                      ? "border-t border-[rgba(42,41,38,0.1)] pt-2"
                      : ""
                  }`}
                >
                  {group.map((item) => (
                    <span
                      key={item.label}
                      className="flex items-center gap-1.5 rounded-full border border-[rgba(42,41,38,0.12)] bg-white px-3 py-1.5 text-xs shadow-sm"
                    >
                      <span className="text-[#7A756C]">{item.label}</span>
                      <span className="font-bold text-[#2A2926]">
                        {item.value}
                      </span>
                    </span>
                  ))}
                </div>
              ) : null,
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 items-start xl:grid-cols-2">
        {babyInfo.babyNo && (
          <div className="xl:col-span-2">
            <BabyGrowthCardComponent babyNo={babyInfo.babyNo} />
          </div>
        )}
        {babyInfo.babyNo && (
          <BabyVaccinationCardComponent
            babyNo={babyInfo.babyNo}
            birthDate={babyInfo.birthDate}
          />
        )}
        {babyInfo.babyNo && <BabySleepCardComponent babyNo={babyInfo.babyNo} />}
      </div>
    </div>
  );
};

export default BabyInfoPage;
