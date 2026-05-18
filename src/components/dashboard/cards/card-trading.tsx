import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatPrice } from "@/lib/format-price";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";
import { HTMLAttributes } from "react";

interface CardTradingProps extends HTMLAttributes<HTMLElement> {
  title: string;
  value: number;
  change: number;
  valueLabel: string;
  feedBackLabel: string;
}

const CardTrading = ({ title, value, change, valueLabel, feedBackLabel, className, ...props }: CardTradingProps) => {
  return (
    <Card className={cn("@container/card from-primary/5 to-card dark:bg-card bg-gradient-to-t shadow-xs", className)} {...props}>
      <CardHeader>
        <CardDescription>{ title }</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          { formatPrice({ price: value, country: { locale: "en-US", currency: "USD" } }) }</CardTitle>
        <CardAction>
          <Badge variant="outline" className={change > 0 ? "bg-green-500/20 text-green-500 border border-green-500/50" : "bg-red-500/25 text-red-500 border border-red-500/50"}>
            {change > 0 ? <TrendingUp /> : <TrendingDown />}
            {`${change > 0 ? "+" : ""}${change}%`}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          { valueLabel } { change > 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" /> }
        </div>
        <div className="text-muted-foreground">
          { feedBackLabel }
        </div>
      </CardFooter>
    </Card>
  );
}

export default CardTrading;
