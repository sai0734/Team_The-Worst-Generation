// matches com.backend.dto.PageRequestDTO
export interface PageRequestParam {
  page: number;
  size: number;
}

// matches com.backend.dto.PageResponseDTO<E>
export interface PageResponse<E> {
  dtoList: E[];
  pageNumList: number[];
  pageRequestDTO: PageRequestParam | null;
  prev: boolean;
  next: boolean;
  totalCount: number;
  prevPage: number;
  nextPage: number;
  totalPage: number;
  current: number;
}
