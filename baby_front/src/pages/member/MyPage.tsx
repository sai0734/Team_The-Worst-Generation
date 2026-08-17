import MyPageComponent from "../../components/member/MyPageComponent";
import BasicLayout from "../../layouts/BasicLayout";
import "../../styles/member.css";
import useCustomLogin from "../../hooks/useCustomLogin";

const MyPage = () => {
  const { isLogin, moveToLoginReturn } = useCustomLogin();
  if (!isLogin) return moveToLoginReturn();

  return <BasicLayout><MyPageComponent /></BasicLayout>;
};

export default MyPage;
