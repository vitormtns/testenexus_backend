export type PaginationParams = {
  page: number;
  limit: number;
};

export function getPagination(page = 1, limit = 10): PaginationParams {
  return {
    page,
    limit
  };
}
