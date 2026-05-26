import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
        destructive: "bg-red-100 text-red-700 hover:bg-red-200",
        outline: "border border-slate-200 text-slate-700",
        success: "bg-emerald-100 text-emerald-700",
        warning: "bg-amber-100 text-amber-700",
        info: "bg-blue-100 text-blue-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
