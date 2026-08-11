import { getKakaoLoginLink } from "../../api/kakaoApi";

const KakaoLoginComponent = () => {
  const link = getKakaoLoginLink();

  return (
    <div className="flex flex-col">
      <div className="text-center text-blue-500">
        카카오 계정으로 로그인하거나 회원가입할 수 있습니다
      </div>
      <div className="flex justify-center  w-full">
        <div className="text-3xl text-center m-6 text-white font-extrabold w-3/4 bg-yellow-500 shadow-sm rounded p-2">
          <a href={link}>KAKAO LOGIN</a>
        </div>
      </div>
    </div>
  );
};

export default KakaoLoginComponent;
