"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useSales } from "@/hooks/useSale";
import { calculateTotalItems } from "@/lib/calculate-items";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CircleDollarSign, Plus } from "lucide-react";
import Link from "next/link";
import SaleHistoriesTable from "./sale-histories-table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { formatPrice } from "@/lib/format-price";

const SaleHistoriesPage = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  const { getSalesQuery } = useSales({
    limit,
    offset: (currentPage - 1) * limit,
    query: searchQuery,
  });

  const totalPages = getSalesQuery.data?.pagination ? Math.ceil(getSalesQuery.data.pagination.total / limit) : 0;

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    // The table will automatically update because the offset in useCategories changes
  }, []);

  const handleSearch = useCallback((searchValue: string) => {
    setSearchQuery(searchValue);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Ventas</h2>
          {
            getSalesQuery.isLoading ? (
              <Skeleton className="h-4 w-52 mt-2" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {
                  calculateTotalItems({
                    total: getSalesQuery.data?.pagination?.total || 0,
                    currentPage,
                    limit,
                    name: "Ventas",
                  })
                }
              </span>
            )
          }
        </div>
        <div>
          <Link href="/dashboard/ventas">
            <Button className="hidden sm:flex bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <ArrowLeft />
              Ir a ventas
            </Button>
            <Button className="flex sm:hidden bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <ArrowLeft />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-5" />
            <span>Hoy: {formatPrice({ price: getSalesQuery.data?.totalSalesAmountToday || 0, country: { currency: "USD", locale: "en-US" } })}</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-5" />
            <span>Total: {formatPrice({ price: getSalesQuery.data?.totalSalesAmount || 0, country: { currency: "USD", locale: "en-US" } })}</span>
          </div>
        </div>
      </div>

      <SaleHistoriesTable
        sales={getSalesQuery.data?.data || []}
        isLoading={getSalesQuery.isLoading}
        pagination={{
          limit,
          currentPage,
        }}
        onSearch={handleSearch}
        getSalesQuery={getSalesQuery}
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
    </div>
  );
}

export default SaleHistoriesPage;
