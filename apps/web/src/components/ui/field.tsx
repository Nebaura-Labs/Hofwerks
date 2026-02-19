import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export const FieldGroup = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return <div className={cn("flex w-full flex-col gap-5", className)} {...props} />;
};

export const Field = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return <div className={cn("flex w-full flex-col gap-2", className)} {...props} />;
};

export const FieldLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof Label>) => {
  return <Label className={cn("text-sm", className)} {...props} />;
};

export const FieldDescription = ({
  className,
  ...props
}: React.ComponentProps<"p">) => {
  return (
    <p className={cn("text-muted-foreground text-sm", className)} {...props} />
  );
};

export const FieldSeparator = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { children?: React.ReactNode }) => {
  return (
    <div className={cn("relative my-1", className)} {...props}>
      <div className="border-border w-full border-t" />
      {children ? (
        <span className="bg-background text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
          {children}
        </span>
      ) : null}
    </div>
  );
};
