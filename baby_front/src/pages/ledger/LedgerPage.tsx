import BasicLayout from "../../layouts/BasicLayout";
import SkyBackground from "../../components/common/SkyBackground";
import LedgerComponent from "../../components/ledger/LedgerComponent";

const LedgerPage = () => {
  return (
    <BasicLayout>
      <SkyBackground />
      <div className="page-sky-content">
        <LedgerComponent />
      </div>
    </BasicLayout>
  );
};

export default LedgerPage;
