import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface TabsContextValue {
	setValue: (value: string) => void;
	value: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = (): TabsContextValue => {
	const context = useContext(TabsContext);
	if (!context) {
		throw new Error("Tabs components must be used inside <Tabs />");
	}
	return context;
};

interface TabsProps extends ComponentProps<"div"> {
	children: ReactNode;
	defaultValue: string;
}

function Tabs({ className, defaultValue, children, ...props }: TabsProps) {
	const [value, setValue] = useState(defaultValue);
	const contextValue = useMemo(() => ({ setValue, value }), [value]);

	return (
		<TabsContext.Provider value={contextValue}>
			<div className={cn("space-y-4", className)} {...props}>
				{children}
			</div>
		</TabsContext.Provider>
	);
}

function TabsList({ className, ...props }: ComponentProps<"div">) {
	return (
		<div
			className={cn(
				"inline-flex h-9 items-center gap-1 rounded-lg border border-white/15 bg-black/25 p-1",
				className
			)}
			{...props}
		/>
	);
}

interface TabsTriggerProps extends ComponentProps<"button"> {
	value: string;
}

function TabsTrigger({
	className,
	value: triggerValue,
	children,
	...props
}: TabsTriggerProps) {
	const { setValue, value } = useTabsContext();
	const isActive = value === triggerValue;

	return (
		<button
			aria-selected={isActive}
			className={cn(
				"rounded-md px-3 py-1.5 font-medium text-sm transition-colors",
				isActive
					? "bg-white/15 text-white"
					: "text-white/70 hover:bg-white/10 hover:text-white",
				className
			)}
			onClick={() => {
				setValue(triggerValue);
			}}
			role="tab"
			type="button"
			{...props}
		>
			{children}
		</button>
	);
}

interface TabsContentProps extends ComponentProps<"div"> {
	value: string;
}

function TabsContent({
	className,
	value: contentValue,
	children,
	...props
}: TabsContentProps) {
	const { value } = useTabsContext();

	if (value !== contentValue) {
		return null;
	}

	return (
		<div className={cn("outline-none", className)} {...props}>
			{children}
		</div>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
