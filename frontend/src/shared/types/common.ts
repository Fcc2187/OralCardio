export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
  has_more: boolean;
}

export interface CursorPage<T> {
  items: T[];
  limit: number;
  next_cursor: string | null;
}
