// matches com.backend.dto.TodoDTO
export interface Todo {
  tno?: number;
  title: string;
  writer: string;
  complete: boolean;
  dueDate: string; // LocalDate serialized as "yyyy-MM-dd"
}
