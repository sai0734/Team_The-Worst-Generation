import jwtAxios from "../util/jwtUtil";
import type { PageRequestParam, PageResponse } from "../types/page";
import type { Todo } from "../types/todo";

//서버 주소
export const API_SERVER_HOST = "http://localhost:8080";

const prefix = `${API_SERVER_HOST}/api/todo`;

export const getOne = async (tno: number | string): Promise<Todo> => {
  const res = await jwtAxios.get(`${prefix}/${tno}`);

  return res.data;
};

export const getList = async (
  pageParam: PageRequestParam,
): Promise<PageResponse<Todo>> => {
  const { page, size } = pageParam;

  const res = await jwtAxios.get(`${prefix}/list`, {
    params: { page: page, size: size },
  });

  return res.data;
};

export const postAdd = async (todoObj: Todo) => {
  const res = await jwtAxios.post(`${prefix}/`, todoObj);

  return res.data;
};

export const deleteOne = async (tno: number | string) => {
  const res = await jwtAxios.delete(`${prefix}/${tno}`);

  return res.data;
};

export const putOne = async (todo: Todo) => {
  const res = await jwtAxios.put(`${prefix}/${todo.tno}`, todo);

  return res.data;
};
