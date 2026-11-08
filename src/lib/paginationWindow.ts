export function paginationWindow(page: number, totalPages: number) {
  const safeTotal = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotal)
  const start = Math.max(1, Math.min(safePage - 1, safeTotal - 2))
  const end = Math.min(safeTotal, start + 2)
  return {
    page: safePage,
    totalPages: safeTotal,
    start,
    end,
    pages: Array.from({ length: end - start + 1 }, (_, index) => start + index),
  }
}
