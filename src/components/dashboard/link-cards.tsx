import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import * as LucideIcons from "lucide-react";
import Link from "next/link";

type LucideIconName = keyof Omit<typeof LucideIcons, 'createLucideIcon' | 'LucideProps' | 'default'>;

interface LinkCardsProps {
  title: string;
  value: string;
  labelLink: string;
  href: string;
  icon: LucideIconName;
}

const LinkCards = ({ title, value, labelLink, href, icon }: LinkCardsProps) => {

  const Icon = (LucideIcons[icon as LucideIconName] as React.ComponentType<{ className?: string }>) || LucideIcons.Home;

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {React.createElement(Icon, { className: "size-5 text-muted-foreground" })}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <Link href={href} className="flex items-center gap-2 text-sm font-normal text-muted-foreground hover:text-primary">
          <span>{labelLink}</span>
          <LucideIcons.SquareArrowOutUpRight className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
};

export default LinkCards;
