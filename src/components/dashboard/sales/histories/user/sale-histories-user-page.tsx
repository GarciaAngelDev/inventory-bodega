"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { calculateTotalItems } from "@/lib/calculate-items";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, DollarSign, Undo2 } from "lucide-react";
import Link from "next/link";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { SaleFetch } from "@/types";
import { getSalesByUser } from "@/actions/sales.action";
import SaleHistoriesUserTable from "./sale-histories-user-table";
import { formatPrice } from "@/lib/format-price";

interface SalesByUser {
  data: SaleFetch[];
  totalSalesAmountToday: number;
  totalSalesAmount: number;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    currentPage: number;
  };
}

const SaleHistoriesPage = ({ id }: { id: string }) => {

  const [loadingSales, setLoadingSales] = useState(false);
  const [sales, setSales] = useState<SalesByUser | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const limit = 10;

  const getAllSalesByUser = async () => {
    const regex: RegExp = /^[0-9a-f]{12}$/;
    
    if(searchQuery && !regex.test(searchQuery)) {
      return;
    }
    try {
      setLoadingSales(true);
      const sales = await getSalesByUser({ userId: id, limit, offset: (currentPage - 1) * limit, query: searchQuery });
      setSales(sales);
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingSales(false);
    }
  }

  useEffect(() => {
    getAllSalesByUser();
  }, [ currentPage, searchQuery ]);

  const totalPages = sales?.pagination ? Math.ceil(sales.pagination.total / limit) : 0;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Historial de Ventas {sales && sales.data.length > 0 ? `de ${sales.data[0].user?.name}` : ''}</h2>
          {
            loadingSales ? (
              <Skeleton className="h-4 w-52 mt-2" />
            ) : (
              <span className="text-sm text-muted-foreground">
                {
                  calculateTotalItems({
                    total: sales?.pagination?.total || 0,
                    currentPage,
                    limit,
                    name: "Ventas",
                  })
                }
              </span>
            )
          }
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/dashboard/ventas/historial">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer">
              <Undo2 />
              Volver al historial
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-5" />
            <span>Hoy: {formatPrice({ price: sales?.totalSalesAmountToday || 0, country: { currency: "USD", locale: "en-US" } })}</span>
          </div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-5" />
            <span>Total: {formatPrice({ price: sales?.totalSalesAmount || 0, country: { currency: "USD", locale: "en-US" } })}</span>
          </div>
        </div>
      </div>

      <SaleHistoriesUserTable
        sales={sales?.data || []}
        isLoading={loadingSales}
        pagination={{
          limit,
          currentPage,
        }}
        onSearch={handleSearch}
        refetch={getAllSalesByUser}
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
