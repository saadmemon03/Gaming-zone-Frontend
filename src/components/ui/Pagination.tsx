import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );

  return (
    <div className="flex items-center justify-between border-t border-[#273449] pt-4">
      <p className="text-sm text-slate-500">
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex items-center gap-1">
        {currentPage > 1 && (
          <button
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous page"
            className="
              rounded-lg border border-[#273449]
              p-2 text-slate-400
              hover:bg-[#151C2C]
              hover:text-white
            "
          >
            <ChevronLeft size={17} />
          </button>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              h-9 min-w-9 rounded-lg
              px-2 text-sm font-medium
              ${
                page === currentPage
                  ? "bg-[#7C3AED] text-white"
                  : "text-slate-400 hover:bg-[#151C2C] hover:text-white"
              }
            `}
          >
            {page}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() =>
            onPageChange(currentPage + 1)
          }
          className="
            rounded-lg border border-[#273449]
            p-2 text-slate-400
            hover:bg-[#151C2C]
            hover:text-white
            disabled:cursor-not-allowed
            disabled:opacity-40
          "
        >
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}