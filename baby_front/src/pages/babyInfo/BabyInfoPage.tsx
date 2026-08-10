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

  useEffect(() => {
    if (!babyNo) return;
    babyInfoApi.getOne(babyNo).then((data: BabyInfo) => setBabyInfo(data));
  }, [babyNo]);

  useEffect(() => {
    babyInfoApi.getList().then((list: BabyInfo[]) => setBabyList(list));
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

  if (!babyInfo) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div>
      <div>
        {babyList.map((baby) => (
          <button
            key={baby.babyNo}
            type="button"
            onClick={() => navigate(`/babyInfo/dashboard/${baby.babyNo}`)}
            className={
              baby.babyNo === babyInfo.babyNo
                ? "bg-black text-white"
                : "bg-white text-black"
            }
          >
            {baby.babyName}
          </button>
        ))}
      </div>
      {babyInfo.profileImageFileName ? (
        <img
          className="w-[64px] h-[64px] rounded-full object-cover"
          src={babyInfoApi.getViewUrl(babyInfo.profileImageFileName)}
          alt={babyInfo.babyName}
        />
      ) : (
        <div className="w-[64px] h-[64px] rounded-full bg-gray-200 flex items-center justify-center text-xs">
          응애
        </div>
      )}
      <p>
        {babyInfo.babyName} ({getAgeInMonths(babyInfo.birthDate)}개월)
      </p>
      <p>{babyInfo.birthDate}</p>
      <p>{babyInfo.gender}</p>
      <p>{babyInfo.bloodType}</p>
      {babyInfo.babyNo && <BabyGrowthCardComponent babyNo={babyInfo.babyNo} />}
      {babyInfo.babyNo && (
        <BabyVaccinationCardComponent
          babyNo={babyInfo.babyNo}
          birthDate={babyInfo.birthDate}
        />
      )}
      {babyInfo.babyNo && <BabySleepCardComponent babyNo={babyInfo.babyNo} />}
    </div>
  );
};

export default BabyInfoPage;
