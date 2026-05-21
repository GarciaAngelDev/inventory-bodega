import { RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { DatePickerWithRange } from "@/components/common/date-picker-with-range";
import Link from "next/link";

interface DashboardHeaderProps {
  dateRange: DateRange | undefined
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>
  resetDashboardData: () => void
}

const DashboardHeader = ({ dateRange, setDateRange, resetDashboardData }: DashboardHeaderProps) => {
  return (
    <Card className="px-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Link href="/dashboard/ventas">
            <h1 className="text-2xl font-bold text-balance">Dashboard de Análisis</h1>
          </Link>
          <p className="text-muted-foreground mt-1 hidden sm:block">Gestión integral de inventario, ventas y producción</p>
        </div>

        <div className="flex gap-2">
          <DatePickerWithRange
            dateRange={dateRange}
            setDateRange={setDateRange}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={resetDashboardData}
              className="cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            {/* <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon">
              <Download className="h-4 w-4" />
            </Button> */}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DashboardHeader;