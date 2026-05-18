"use client";

import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useCriticalProducts } from "@/hooks/useCriticalProducts";
import { calculateTotalItems } from "@/lib/calculate-items";
import { AvaliableProduct, ProductFetch } from "@/types";
import { useCallback, useEffect, useState } from "react";
import AvaliableProductsTable from "./avaliable-products-table";
import { getAvailableProducts } from "@/actions/products.action";
import { InventaryType } from "@/generated/prisma";

export interface AvaliableProducts {
  data: AvaliableProduct[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

const AvaliableProductsPageContent = () => {

  const [avaliableProducts, setAvaliableProducts] = useState<AvaliableProducts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;
  
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const ap = await getAvailableProducts({ type: InventaryType.SALE, limit, offset: (currentPage - 1) * limit, search: searchQuery });
        setAvaliableProducts(ap);
      } catch (error) {
        console.error('Error al obtener los productos disponibles:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [currentPage, searchQuery]);

  const totalPages = avaliableProducts?.pagination ? Math.ceil(avaliableProducts.pagination.total / limit) : 0;

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    // The table will automatically update because the offset in useCategories changes
  }, []);

  const handleSearch = useCallback((searchValue: string) => {
    setSearchQuery(searchValue);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Productos disponibles</h2>
          {
            isLoading ? (
              <Skeleton className="h-4 w-52 mt-2" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {
                  calculateTotalItems({
                    total: avaliableProducts?.pagination?.total || 0,
                    currentPage,
                    limit,
                    name: "productos",
                  })
                }
              </span>
            )
          }
        </div>
      </div>

      <AvaliableProductsTable
        avaliableProducts={avaliableProducts?.data || []}
        isLoading={isLoading}
        className="mt-6"
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
    </>
  );
};

export default AvaliableProductsPageContent;
