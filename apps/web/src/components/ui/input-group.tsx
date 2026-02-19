import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export const InputGroup = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "border-input dark:bg-input/30 focus-within:ring-ring/50 focus-within:border-ring flex h-9 items-center rounded-md border bg-transparent focus-within:ring-[3px]",
        className,
      )}
      {...props}
    />
  );
};

export const InputGroupAddon = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn("text-muted-foreground flex items-center px-3 [&>svg]:size-4", className)}
      {...props}
    />
  );
};

export const InputGroupInput = ({
  className,
  ...props
}: React.ComponentProps<"input">) => {
  return (
    <Input
      className={cn(
        "h-9 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",
        className,
      )}
      {...props}
    />
  );
};
