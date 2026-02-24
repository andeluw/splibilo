export interface Meta {
  page: number;
  per_page: number;
  max_page: number;
  count: number | null;
}

export interface PaginatedApiResponse<T> {
  code: number;
  data: T;
  meta: Meta;
  message?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
