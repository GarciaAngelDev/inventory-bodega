"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { calculateTotalItems } from "@/lib/calculate-items";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import ProducerHistoriesTable from "./producer-histories-table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useProducers } from "@/hooks/useProducer";

const ProducerHistoriesPage = () => {

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  const { getProducersQuery } = useProducers({
    limit,
    offset: (currentPage - 1) * limit,
    query: searchQuery,
  });

  const totalPages = getProducersQuery.data?.pagination ? Math.ceil(getProducersQuery.data.pagination.total / limit) : 0;

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
          <h2 className="text-2xl font-bold">Historial de Producción</h2>
          {
            getProducersQuery.isLoading ? (
              <Skeleton className="h-4 w-52 mt-2" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {
                  calculateTotalItems({
                    total: getProducersQuery.data?.pagination?.total || 0,
                    currentPage,
                    limit,
                    name: "Producciones",
                  })
                }
              </span>
            )
          }
        </div>
        <div>
          <Link href="/dashboard/produccion">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <ArrowLeft />
              Ir a producción
            </Button>
          </Link>
        </div>
      </div>

      <ProducerHistoriesTable
        producers={getProducersQuery.data?.data || []}
        isLoading={getProducersQuery.isLoading}
        pagination={{
          limit,
          currentPage,
        }}
        onSearch={handleSearch}
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

export default ProducerHistoriesPage;
