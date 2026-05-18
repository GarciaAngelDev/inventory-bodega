"use client";

import { useEffect, useState } from "react";
import { CircleQuestionMark, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";

import { updateSetting } from "@/actions/setting.action";
import { getRates } from "@/actions/rate.action";
import { useSetting } from "@/hooks/useSetting";
import { RateType } from "@/types";

const PageConfigurationContent = () => {

  const { getSettingQuery } = useSetting();

  const [enableRate, setEnableRate] = useState(false);
  const [rateType, setRateType] = useState("oficial");
  const [savingData, setSavingData] = useState(false);
  const [rates, setRates] = useState({ oficial: 0, paralelo: 0 });
  const [loadingRates, setLoadingRates] = useState(true);
  const [disabledOptions, setDisabledOptions] = useState(false);
  const [rateCustom, setRateCustom] = useState(0);

  // iva
  const [iva, setIva] = useState(0);
  const [enableIva, setEnableIva] = useState(false);

  useEffect(() => {
    if (getSettingQuery.data) {
      setEnableRate(getSettingQuery.data.enableRate);
      setRateType(getSettingQuery.data.rateType.toString().toLowerCase());
      setRateCustom(getSettingQuery.data.rateCustom);
      setEnableIva(getSettingQuery.data.enableIva);
      setIva(getSettingQuery.data.iva);
    }
  }, [getSettingQuery.isLoading]);

  useEffect(() => {

    const getAllRates = async () => {
      setLoadingRates(true);
      try {
        const rateOficial = await getRates(RateType.OFICIAL);
        const rateParalelo = await getRates(RateType.PARALELO);
        setRates({
          oficial: rateOficial.rate,
          paralelo: rateParalelo.rate
        });
        setLoadingRates(false);
      } catch (error) {
        console.log(error);
        toast.error("Error al obtener las tasas de cambio, comuniquese con el administrador");
        setEnableRate(false);
        setDisabledOptions(true);
        setLoadingRates(false);
      }
    }

    if (!getSettingQuery.isLoading && enableRate) {
      getAllRates();
    }
  }, [enableRate, getSettingQuery.isLoading]);

  const handleSaveSettings = async () => {

    if (enableIva && (iva < 0 || iva > 100)) {
      toast.error("El IVA debe ser un numero entre 0 y 100");
      return;
    }

    try {
      setSavingData(true);
      await updateSetting({
        id: getSettingQuery.data?.id!,
        enableRate,
        rateCustom,
        rateType: rateType === "oficial" ? RateType.OFICIAL : RateType.PARALELO,
        enableIva,
        iva,
      });
      toast.success("Configuración actualizada exitosamente");
      getSettingQuery.refetch();
    } catch (error) {
      console.log(error);
      toast.error("Error al actualizar la configuración");
    } finally {
      setSavingData(false);
    }
  }

  return (
    <div>
      <div className="space-y-2 mt-6 border-2 border-dashed rounded-xl p-4">
        {
          getSettingQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {
                Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))
              }
            </div>
          ) : (
            <>
              <div className="border p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Tasas de cambio</h2>
                  <Switch checked={enableRate} onCheckedChange={(value) => setEnableRate(value)} />
                </div>
                {
                  enableRate && (
                    <div className="flex flex-col md:flex-row sm:items-end gap-2 md:gap-4">
                      <RadioGroup defaultValue="oficial" value={rateType} onValueChange={setRateType} disabled={disabledOptions}>
                        <div className="mt-4 flex flex-col gap-2">
                          <span className="text-sm text-muted-foreground">Elije la tasa de cambio</span>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
                            <div className="flex items-center space-x-2">
                              <Label
                                htmlFor="oficial"
                                className={cn("flex items-center gap-2 bg-accent/25 p-3 rounded-full cursor-pointer", rateType === "oficial" ? "bg-accent" : "hover:bg-accent/50", disabledOptions ? "cursor-not-allowed opacity-50" : "")}
                              >
                                <RadioGroupItem value="oficial" id="oficial" />
                                Banco Central
                                {
                                  loadingRates ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">$ {rates.oficial.toFixed(2)}</span>
                                  )
                                }
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Label
                                htmlFor="paralelo"
                                className={cn("flex items-center gap-2 bg-accent/25 p-3 rounded-full cursor-pointer", rateType === "paralelo" ? "bg-accent" : "hover:bg-accent/50", disabledOptions ? "cursor-not-allowed opacity-50" : "")}
                              >
                                <RadioGroupItem value="paralelo" id="paralelo" />
                                USDT
                                {
                                  loadingRates ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">$ {rates.paralelo.toFixed(2)}</span>
                                  )
                                }
                              </Label>
                            </div>
                          </div>
                        </div>
                      </RadioGroup>
                    </div>
                  )
                }
                <div className="border-t mt-4 pt-4">
                  <Label htmlFor="custom" className="mb-2 text-muted-foreground">Tasa personalizada</Label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="custom"
                      type="number"
                      className="rounded-full !py-4 max-w-[200px] w-full pl-6"
                      value={rateCustom}
                      onChange={(e) => setRateCustom(Number(e.target.value))}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>

              <div className="border p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">IVA</h2>
                  <Switch checked={enableIva} onCheckedChange={(value) => setEnableIva(value)} />
                </div>
                {
                  enableIva && (
                    <div>
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <Label htmlFor="iva" className="text-muted-foreground">Introduce el IVA</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <CircleQuestionMark className="size-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>El iva debe ser un numero entre 0 y 100, ejemplo: 16</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                        <Input
                          type="number"
                          className="rounded-full !py-4 max-w-[200px] w-full pl-7"
                          min={0}
                          max={100}
                          value={iva}
                          onChange={(e) => setIva(Number(e.target.value))}
                          placeholder="Ejemplo: 16"
                        />
                      </div>
                    </div>
                  )
                }
              </div>
            </>
          )
        }
      </div>
      {
        !getSettingQuery.isLoading && (
          <div className="flex justify-end mt-6">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"
              onClick={handleSaveSettings}
            >
              {
                savingData ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin" />
                    Guardando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save />
                    Guardar cambios
                  </div>
                )
              }
            </Button>
          </div>
        )
      }
    </div>
  );
}

export default PageConfigurationContent;
