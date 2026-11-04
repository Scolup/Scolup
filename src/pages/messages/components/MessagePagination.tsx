import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function MessagePagination({
  page,
  currentPage,
  totalPages,
  pages,
  leftEllipsis,
  rightEllipsis,
  onPageChange,
}: {
  page: number
  currentPage: number
  totalPages: number
  pages: number[]
  leftEllipsis: boolean
  rightEllipsis: boolean
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  return (
    <Pagination className="mt-2 mb-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            aria-disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
        {leftEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        {pages.map((slot) => (
          <PaginationItem key={slot}>
            <PaginationLink
              isActive={slot === currentPage}
              onClick={() => onPageChange(slot)}
            >
              {slot}
            </PaginationLink>
          </PaginationItem>
        ))}
        {rightEllipsis && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        <PaginationItem>
          <PaginationNext
            aria-disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
