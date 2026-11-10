export const PAGE_SIZE = 15

export function buildPagination(
  totalPages: number,
  currentPage: number,
  maxSlots: number
): { pages: number[]; leftEllipsis: boolean; rightEllipsis: boolean } {
  if (totalPages <= maxSlots) {
    return {
      pages: Array.from({ length: totalPages }, (_, i) => i + 1),
      leftEllipsis: false,
      rightEllipsis: false,
    }
  }

  const half = Math.floor((maxSlots - 1) / 2)
  let start = Math.max(1, currentPage - half)
  let end = Math.min(totalPages, currentPage + half)

  if (end - start + 1 < maxSlots) {
    if (start === 1) end = maxSlots
    else start = totalPages - maxSlots + 1
  }

  return {
    pages: Array.from({ length: end - start + 1 }, (_, i) => start + i),
    leftEllipsis: start > 1,
    rightEllipsis: end < totalPages,
  }
}
