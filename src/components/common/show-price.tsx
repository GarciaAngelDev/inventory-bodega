import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { calculateDolarsToBs } from "@/lib/calculate-currency";
import { RateType, Setting } from "@/types";
import { cn } from "@/lib/utils";

interface ShowPriceProps extends React.HTMLAttributes<HTMLSpanElement> {
  price: number;
  rate: number;
  settingData?: Setting;
}

const ShowPrice = ({ price, rate, settingData, className, ...props }: ShowPriceProps) => {

  if (settingData && settingData.enableRate && settingData.rateCustom > 0) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("text-xs text-muted-foreground", className)} {...props}>
            {
              calculateDolarsToBs({
                value: price,
                rate: settingData.rateCustom && settingData.rateCustom > 0 ? settingData.rateCustom : rate
              })
            }
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <div className="flex flex-col gap-2">
            <span className="font-semibold">{settingData.rateType === RateType.OFICIAL ? 'Banco Central' : settingData.rateType === RateType.PARALELO ? 'USDT' : 'Personalizado'}</span>
            <span>
              {
                calculateDolarsToBs({
                  value: price,
                  rate
                })
              }
            </span>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return (
    <span className={cn("text-xs text-muted-foreground", className)} {...props}>
      {
        calculateDolarsToBs({
          value: price,
          rate: settingData && settingData.rateCustom > 0 ? settingData.rateCustom : rate
        })
      }
    </span>
  );
};

export default ShowPrice;