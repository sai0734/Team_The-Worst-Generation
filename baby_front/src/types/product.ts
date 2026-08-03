// matches com.backend.dto.ProductDTO
export interface Product {
  pno?: number;
  pname: string;
  pdesc: string;
  price: number;
  delFlag?: boolean;
  uploadFileNames: string[];
}
