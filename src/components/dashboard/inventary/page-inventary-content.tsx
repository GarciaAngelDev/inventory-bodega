"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { calculateTotalItems } from "@/lib/calculate-items";
import CreateInventaryDialog from "./create-inventary-dialog";
import { useInventary } from "@/hooks/useInventary";
import InventoryTable from "./inventary-table";
import { DateRange } from "react-day-picker";

const PageInventaryContent = () => {

  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const { getInventaryQuery: { data, isLoading, isFetching, error } } = useInventary({
    limit,
    offset: (currentPage - 1) * limit,
    query: searchQuery,
    dateFrom: dateRange?.from,
    dateTo: dateRange?.to,
  });

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    // The table will automatically update because the offset in useCategories changes
  }, []);

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 0;

  const handleSearch = useCallback((searchValue: string) => {
    setSearchQuery(searchValue);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  return (
    <>
      <CreateInventaryDialog open={open} onOpenChange={setOpen} />
      <div className="flex sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Inventario</h2>
          {
            isLoading ? (
              <Skeleton className="h-4 w-52 mt-2" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {
                  calculateTotalItems({
                    total: data?.pagination?.total || 0,
                    currentPage,
                    limit,
                    name: "inventarios",
                  })
                }
              </span>
            )
          }
        </div>
        <div>
          <Button
            className="hidden sm:flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
            onClick={() => setOpen(true)}
          >
            <Plus />
            Crear Inventario
          </Button>
          <Button
            className="flex sm:hidden items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
            onClick={() => setOpen(true)}
            size="icon"
          >
            <Plus />
          </Button>
        </div>
      </div>

      <InventoryTable
        inventary={data?.data || []}
        isLoading={isLoading || isFetching}
        className="mt-6"
        pagination={{
          limit,
          currentPage,
        }}
        onSearch={handleSearch}
        searchLoading={isFetching}
        dateRange={dateRange}
        setDateRange={setDateRange}
      />

      {
        totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={pageNum === currentPage}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) handlePageChange(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )
      }
    </>
  );
};

export default PageInventaryContent;