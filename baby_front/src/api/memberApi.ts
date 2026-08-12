import axios from "axios";
const API_SERVER_HOST = "http://localhost:8080";
import jwtAxios from "../util/jwtUtil";
import type {
  LoginParam,
  LoginResponse,
  MemberModify,
  MemberSignupParam,
  MemberSignupResponse,
} from "../types/member";

const host = `${API_SERVER_HOST}/api/member`;

export const loginPost = async (
  loginParam: LoginParam,
): Promise<LoginResponse> => {
  const res = await axios.post(
    `${host}/login`,
    {
      email: loginParam.email,
      pw: loginParam.pw,
    },
    {
      withCredentials: true,
    },
  );

  return res.data;
};

export const signupMember = async (
  signupParam: MemberSignupParam,
): Promise<MemberSignupResponse> => {
  const res = await axios.post(`${host}/signup`, signupParam, {
    withCredentials: true,
  });

  return res.data;
};

export const modifyMember = async (member: MemberModify) => {
  const res = await jwtAxios.put(`${host}/modify`, member);

  return res.data;
};
