import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import * as babyInfoApi from "../../api/babyInfoApi";
import { BabyInfo } from "../../api/babyInfoApi";
import BabyGrowthCardComponent from "../../components/babyInfo/BabyGrowthCardComponent";

const BabyInfoPage = () => {
  const { babyNo } = useParams<{ babyNo: string }>();
  const [babyInfo, setBabyInfo] = useState<BabyInfo | null>(null);

  useEffect(() => {
    if (!babyNo) return;
    babyInfoApi.getOne(babyNo).then((data: BabyInfo) => setBabyInfo(data));
  }, [babyNo]);

  if (!babyInfo) {
    return <div>불러오는 중...</div>;
  }

  return (
    <div>
      <p>{babyInfo.babyName}</p>
      <p>{babyInfo.birthDate}</p>
      {babyInfo.babyNo && <BabyGrowthCardComponent babyNo={babyInfo.babyNo} />}
    </div>
  );
};

export default BabyInfoPage;
