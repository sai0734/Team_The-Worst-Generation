import { useState } from "react";
import {
  createSearchParams,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

const getNum = (param: string | null, defaultValue: number): number => {
  if (!param) {
    return defaultValue;
  }

  return parseInt(param);
};

export interface MovePageParam {
  page?: number;
  size?: number;
}

const useCustomMove = () => {
  const navigate = useNavigate();

  const [refresh, setRefresh] = useState(false);

  const [queryParams] = useSearchParams();

  const page = getNum(queryParams.get("page"), 1);
  const size = getNum(queryParams.get("size"), 10);

  const queryDefault = createSearchParams({
    page: String(page),
    size: String(size),
  }).toString();

  const moveToList = (pageParam?: MovePageParam) => {
    let queryStr = "";

    if (pageParam) {
      const pageNum = getNum(String(pageParam.page ?? ""), 1);
      const sizeNum = getNum(String(pageParam.size ?? ""), 10);

      queryStr = createSearchParams({
        page: String(pageNum),
        size: String(sizeNum),
      }).toString();
    } else {
      queryStr = queryDefault;
    }

    navigate({
      pathname: `../list`,
      search: queryStr,
    });
    setRefresh(!refresh); //추가
  };

  const moveToModify = (num: number | string) => {
    console.log(queryDefault);

    navigate({
      pathname: `../modify/${num}`,
      search: queryDefault, //수정시에 기존의 쿼리 스트링 유지를 위해
    });
  };

  const moveToRead = (num: number | string) => {
    console.log(queryDefault);

    navigate({
      pathname: `../read/${num}`,
      search: queryDefault,
    });
  };

  return { moveToRead, moveToModify, moveToList, page, size, refresh }; //refresh 추가
};

export default useCustomMove;
