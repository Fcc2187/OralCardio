export interface Page<T> {
  items: T[];
  limit: number;
  offset: number;
  has_more: boolean;
}
