"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  date?: Date
  onDateChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  date,
  onDateChange,
  placeholder = "Seleccionar fecha y hora",
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)
  const [hour, setHour] = React.useState<string>("12")
  const [minute, setMinute] = React.useState<string>("00")
  const [period, setPeriod] = React.useState<"AM" | "PM">("AM")
  const [open, setOpen] = React.useState(false)

  // Sincronizar con la fecha externa cuando cambia
  React.useEffect(() => {
    if (date) {
      setSelectedDate(date)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      
      // Convertir a formato 12 horas
      const hour12 = hours % 12 || 12
      setHour(hour12.toString().padStart(2, '0'))
      setMinute(minutes.toString().padStart(2, '0'))
      setPeriod(hours >= 12 ? "PM" : "AM")
    }
  }, [date])

  // Actualizar la fecha completa cuando cambian los componentes
  const updateDateTime = React.useCallback((
    newDate?: Date,
    newHour?: string,
    newMinute?: string,
    newPeriod?: "AM" | "PM"
  ) => {
    const currentDate = newDate || selectedDate
    const currentHour = newHour || hour
    const currentMinute = newMinute || minute
    const currentPeriod = newPeriod || period

    if (currentDate) {
      const dateTime = new Date(currentDate)
      let hours = parseInt(currentHour)
      
      // Convertir de 12 horas a 24 horas
      if (currentPeriod === "PM" && hours !== 12) {
        hours += 12
      } else if (currentPeriod === "AM" && hours === 12) {
        hours = 0
      }
      
      dateTime.setHours(hours)
      dateTime.setMinutes(parseInt(currentMinute))
      dateTime.setSeconds(0)
      dateTime.setMilliseconds(0)
      
      onDateChange?.(dateTime)
    }
  }, [selectedDate, hour, minute, period, onDateChange])

  const handleDateSelect = (newDate: Date | undefined) => {
    setSelectedDate(newDate)
    updateDateTime(newDate, hour, minute, period)
  }

  const handleHourChange = (newHour: string) => {
    setHour(newHour)
    updateDateTime(selectedDate, newHour, minute, period)
  }

  const handleMinuteChange = (newMinute: string) => {
    setMinute(newMinute)
    updateDateTime(selectedDate, hour, newMinute, period)
  }

  const handlePeriodChange = (newPeriod: "AM" | "PM") => {
    setPeriod(newPeriod)
    updateDateTime(selectedDate, hour, minute, newPeriod)
  }

  const handleClear = () => {
    setSelectedDate(undefined)
    setHour("12")
    setMinute("00")
    setPeriod("AM")
    onDateChange?.(undefined)
  }

  // Generar opciones de horas (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'))
  
  // Generar opciones de minutos (0-59)
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            format(selectedDate, "PPP 'a las' hh:mm a", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            initialFocus
            captionLayout="dropdown"
            
          />
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Hora</label>
                <Select value={hour} onValueChange={handleHourChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {hours.map((h) => (
                      <SelectItem key={h} value={h}>
                        {h}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Minutos</label>
                <Select value={minute} onValueChange={handleMinuteChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {minutes.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Periodo</label>
                <Select value={period} onValueChange={(value) => handlePeriodChange(value as "AM" | "PM")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex-1"
              >
                Limpiar
              </Button>
              <Button
                size="sm"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
