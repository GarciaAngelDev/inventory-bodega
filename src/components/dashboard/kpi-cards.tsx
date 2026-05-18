import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";

type LucideIconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideProps' | 'default'>;

interface KpiCardsProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: LucideIconName;
  description: string;
}

const KpiCards = ({ title, value, change, trend, icon, description }: KpiCardsProps) => {

  const Icon = (LucideIcons[icon as LucideIconName] as React.ComponentType<{ className?: string }>) || LucideIcons.Home;

  const isPositive = trend === "up"
  const TrendIcon = isPositive ? TrendingUp : TrendingDown

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {React.createElement(Icon, { className: "size-5 text-muted-foreground" })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center gap-2 mt-2">
          <Badge className={cn("flex items-center gap-1", isPositive ? "bg-green-500/20 text-green-500 border border-green-500/50" : "bg-red-500/20 text-red-500 border border-red-500/50")}>
            <TrendIcon className="h-3 w-3" />
            {change}
          </Badge>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default KpiCards;
