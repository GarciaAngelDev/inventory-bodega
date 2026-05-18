"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "./badge"
import { formatPrice } from "@/lib/format-price"
import ShowPrice from "../common/show-price"
import { InventoryType, Setting } from "@/types"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

interface ComboboxData {
  value: string;
  label: string;
  tags?: string[];
  stock?: number;
  price?: number;
  settingData?: Setting;
  inventoryType?: "SALE" | "INTERNAL" | "ALL";
  identity?: string;
}

interface ComboboxProps extends React.HTMLAttributes<HTMLButtonElement> {
  data: ComboboxData[];
  onValueChange: (value: string) => void;
  placeholder?: string;
  inputLabel?: string;
  notFoundLabel?: string;
  disabled?: boolean;
  modal?: boolean;
  defaultValue?: string;
  disabledValues?: string[];
}

export function Combobox({
  data,
  onValueChange,
  placeholder = "Selecciona una opcion",
  inputLabel = "Buscar...",
  notFoundLabel = "No se encontraron resultados",
  disabled = false,
  modal = false,
  defaultValue = "",
  disabledValues = [],
  className,
  ...props
}: ComboboxProps) {

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(defaultValue);

  useEffect(() => {
    setSelectedValue(defaultValue);
  }, [defaultValue]);

  return (
    <Popover open={open} onOpenChange={!disabled ? setOpen : undefined} modal={modal}>
      <PopoverTrigger asChild className={className}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between")}
          disabled={disabled}
          {...props}
        >
          {selectedValue && selectedValue !== ""
            ? data.find((item) => item.value === selectedValue)?.label
            : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popover-trigger-width)]">
        <Command shouldFilter={false} className="w-full">
          <CommandInput
            placeholder={inputLabel}
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{notFoundLabel}</CommandEmpty>
            <CommandGroup>
              {data
                .filter(item => {
                  if (!search) return true;

                  const searchTerm = search.toLowerCase();
                  const matchesLabel = item.label.toLowerCase().includes(searchTerm);
                  const matchesValue = item.value.toLowerCase().includes(searchTerm);
                  const matchesTags = item.tags?.some(tag => tag.toLowerCase().includes(searchTerm)) || false;
                  const matchesIdentity = item.identity?.toLowerCase().includes(searchTerm) || false;

                  return matchesLabel || matchesValue || matchesTags || matchesIdentity;
                })
                .map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.value}
                    onSelect={(currentValue) => {
                      setSearch("")
                      setSelectedValue(currentValue)
                      onValueChange(currentValue)
                      setOpen(false)
                    }}
                    className="cursor-pointer"
                    disabled={disabledValues.includes(item.value)}
                  >
                    <span>
                      {item.label}
                      {item.price ? (<> - {formatPrice({ price: item.price, country: { locale: "en-US", currency: "USD" } })} - <ShowPrice price={item.price} rate={190} settingData={item.settingData} /></>) : ""}
                    </span>
                    <Check
                      className={cn(
                        "ml-auto",
                        "opacity-0 data-[selected=true]:opacity-100",
                        {
                          "opacity-100": selectedValue === item.value
                        }
                      )}
                      data-selected={selectedValue === item.value}
                    />
                    {
                      item.identity && (
                        <Badge variant="outline">{Number(item.identity).toLocaleString()}</Badge>
                      )
                    }
                    {
                      item.stock && item.stock > 0 && (
                        <Badge variant="outline">{item.stock}</Badge>
                      )
                    }
                    {
                      item.inventoryType && (

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge className={cn("font-semibold", item.inventoryType === InventoryType.SALE ? "bg-green-500/20 text-green-500 border-green-300" : item.inventoryType === InventoryType.INTERNAL ? "bg-blue-500/20 text-blue-500 border-blue-300" : "bg-yellow-500/20 text-yellow-500 border-yellow-300")}>
                              {
                                item.inventoryType === InventoryType.SALE ? "V" : item.inventoryType === InventoryType.INTERNAL ? "P" : "A"
                              }
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            {
                              item.inventoryType === InventoryType.SALE ? "Venta" : item.inventoryType === InventoryType.INTERNAL ? "Producción" : "Ambos"
                            }
                          </TooltipContent>
                        </Tooltip>
                      )
                    }
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
