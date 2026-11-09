/**
 * Reusable Server-Side Pagination Utility
 * Compliant with Falcon Admin requirements
 */

function parsePagination(query = {}, defaultLimit = 10, maxLimit = 100) {
  const rawPage = parseInt(query.page, 10);
  const rawLimit = parseInt(query.limit || query.pageSize, 10);

  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const safeLimit = !isNaN(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, maxLimit) : defaultLimit;
  const offset = (page - 1) * safeLimit;

  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = (query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  return {
    page,
    limit: safeLimit,
    offset,
    sortBy,
    sortOrder,
  };
}

function buildPaginationResponse(totalCount, page, limit) {
  const total = typeof totalCount === 'number' ? totalCount : parseInt(totalCount || 0, 10);
  const totalPages = Math.ceil(total / limit) || 1;
  const currentPage = Math.max(1, page);

  return {
    currentPage,
    pageSize: limit,
    totalRecords: total,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    // Backwards-compatible aliases
    page: currentPage,
    limit,
    total,
  };
}

module.exports = {
  parsePagination,
  buildPaginationResponse,
};
