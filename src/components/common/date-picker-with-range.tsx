"use client";

import * as React from "react";
import { type DateRange } from "react-day-picker";
import { es } from "react-day-picker/locale";

import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { CalendarCheck, CalendarSync, ChevronDownIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";

interface DatePickerWithRangeProps {
  dateRange: DateRange | undefined
  setDateRange: React.Dispatch<React.SetStateAction<DateRange | undefined>>
}

export const DatePickerWithRange = ({ dateRange, setDateRange }: DatePickerWithRangeProps) => {

  const isMobile = useIsMobile();

  const [countDays, setCountDays] = React.useState<number>(0);
  const [month, setMonth] = React.useState<Date | undefined>(new Date());

  React.useEffect(() => {
    if (dateRange && dateRange.from && (dateRange.to === undefined || dateRange.from === dateRange.to)) {
      setCountDays(0);
      return;
    }

    if (dateRange && dateRange.to && dateRange.from) {
      const diffTime = Math.abs(dateRange.to.getTime() - dateRange.from.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setCountDays(diffDays + 1);
    }
  }, [dateRange]);

  const handleSelectCurrentMonthSelected = () => {
    /* const currentDateSelected = dateRange?.from;
    if (!currentDateSelected) return; */
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    setDateRange({
      from: new Date(currentYear, currentMonth, 1),
      to: new Date(currentYear, currentMonth + 1, 0),
    });
  };

  const handleClearSelection = () => {
    setDateRange({
      from: new Date(),
      to: undefined,
    });
    setMonth(new Date());
    setCountDays(0);
  };

  const handleClearAll = () => {
    setDateRange({
      from: undefined,
      to: undefined,
    });
    setMonth(new Date());
    setCountDays(0);
  }

  if (isMobile) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="flex-1 justify-between font-normal"
          >
            {dateRange?.from ? dateRange.from.toLocaleDateString() + (dateRange.to !== undefined ? " - " + dateRange.to.toLocaleDateString() : "") : "Seleccionar fecha"}
            <ChevronDownIcon />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rango de fecha</DialogTitle>
            <DialogDescription>
              Elije una fecha o un rango de fechas
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-w-0 flex-col gap-2 mx-auto">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={isMobile ? 1 : 2}
              month={month}
              onMonthChange={setMonth}
              min={1}
              max={89}
              className="rounded-lg border shadow-sm"
              locale={es}
              captionLayout="dropdown"
              showOutsideDays={false}
            />
            <div className="flex justify-between items-center gap-4">
              <span className="text-muted-foreground text-center text-xs">Elije entre 2 a 90 días</span>
              <Badge variant="outline">{countDays} días</Badge>
            </div>
            <div className="flex flex-col lg:flex-row gap-2">
              <Button
                variant="outline"
                onClick={handleSelectCurrentMonthSelected}
                size="sm"
              >
                <CalendarCheck />
                Mes actual
              </Button>
              <Button
                variant="outline"
                onClick={handleClearSelection}
                size="sm"
              >
                <CalendarSync />
                Hoy
              </Button>
              <Button
                variant="outline"
                onClick={handleClearAll}
                size="sm"
              >
                <CalendarSync />
                Limpiar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="flex-1 justify-between font-normal"
        >
          {dateRange?.from ? dateRange.from.toLocaleDateString() + (dateRange.to !== undefined ? " - " + dateRange.to.toLocaleDateString() : "") : "Seleccionar fecha"}
          <ChevronDownIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent asChild className="w-full">
        <div className="flex min-w-0 flex-col gap-2">
          <Calendar
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={isMobile ? 1 : 2}
            month={month}
            onMonthChange={setMonth}
            min={1}
            max={89}
            className="rounded-lg border shadow-sm"
            locale={es}
            captionLayout="dropdown"
            showOutsideDays={false}
          />
          <div className="flex justify-between items-center gap-4">
            <span className="text-muted-foreground text-center text-xs">Elije entre 2 a 90 días</span>
            <Badge variant="outline">{countDays} días</Badge>
          </div>
          <div className="flex flex-col lg:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleSelectCurrentMonthSelected}
              size="sm"
            >
              <CalendarCheck />
              Mes actual
            </Button>
            <Button
              variant="outline"
              onClick={handleClearSelection}
              size="sm"
            >
              <CalendarSync />
              Hoy
            </Button>
            <Button
              variant="outline"
              onClick={handleClearAll}
              size="sm"
            >
              <CalendarSync />
              Limpiar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>

  );
};

