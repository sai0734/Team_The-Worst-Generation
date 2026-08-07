import axios from "axios";
const API_SERVER_HOST = "http://localhost:8080";
import jwtAxios from "../util/jwtUtil";
import type { LoginParam, LoginState, MemberModify } from "../types/member";

const host = `${API_SERVER_HOST}/api/member`;

export const loginPost = async (
  loginParam: LoginParam,
): Promise<LoginState> => {
  const form = new FormData();
  form.append("username", loginParam.email);
  form.append("password", loginParam.pw);

  const res = await axios.post(`${host}/login`, form);

  return res.data;
};

export const modifyMember = async (member: MemberModify) => {
  const res = await jwtAxios.put(`${host}/modify`, member);

  return res.data;
};
