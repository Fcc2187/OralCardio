export interface CursorPage<T> {
  items: T[];
  limit: number;
  next_cursor: string | null;
}
