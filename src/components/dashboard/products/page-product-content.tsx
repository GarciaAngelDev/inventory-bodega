"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";

import CreateProductDialog from "./create-product-dialog";
import { Button } from "@/components/ui/button";
import ProductsTable from "./products-table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

import { useProducts } from "@/hooks/useProducts";
import { calculateTotalItems } from "@/lib/calculate-items";
import { Skeleton } from "@/components/ui/skeleton";

const PageProductContent = () => {

  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  const { getProductsQuery: { data, isLoading, isFetching, error } } = useProducts({
    limit,
    offset: (currentPage - 1) * limit,
    query: searchQuery,
  });

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const handleSearch = useCallback((searchValue: string) => {
    setSearchQuery(searchValue);
    setCurrentPage(1);
  }, []);

  const totalPages = data?.pagination ? Math.ceil(data.pagination.total / limit) : 0;

  return (
    <>
      <CreateProductDialog open={open} onOpenChange={setOpen} />
      <div className="flex sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Productos</h2>
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
                    name: "productos",
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
            Crear Producto
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

      <ProductsTable
        products={data?.data || []}
        isLoading={isFetching}
        className="mt-6"
        onSearch={ handleSearch }
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
                      if (currentPage > 1) {
                        handlePageChange(currentPage - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
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
                          if (pageNum !== currentPage) {
                            handlePageChange(pageNum);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={isLoading ? 'pointer-events-none opacity-50' : ''}
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
                      if (currentPage < totalPages) {
                        handlePageChange(currentPage + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }
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

export default PageProductContent;