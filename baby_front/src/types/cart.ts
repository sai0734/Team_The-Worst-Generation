// matches com.backend.dto.CartItemListDTO
export interface CartItem {
  cino: number;
  qty: number;
  pno: number;
  pname: string;
  price: number;
  imageFile: string;
}

// matches com.backend.dto.CartItemDTO
export interface CartChangeParam {
  email: string;
  pno: number | string;
  qty: number;
  cino?: number;
}
