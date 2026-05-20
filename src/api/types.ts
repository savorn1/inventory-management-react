export interface ApiResponse<T> {
  traceId: string;
  statusCode: number;
  message: string;
  data: T;
}

export interface PageMetadata {
  hasNext: boolean;
  hasPrev: boolean;
  totalPage: number;
  currentPage: number;
  limit: number;
  totalCount: number;
}

export interface PageResponse<T> {
  traceId: string;
  statusCode: number;
  message: string;
  data: T[];
  metadata: PageMetadata;
}
