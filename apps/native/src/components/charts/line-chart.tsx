"use client";

import { localPoint } from "@visx/event";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scaleTime } from "@visx/scale";
import {
	Children,
	isValidElement,
	type ReactElement,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { cn } from "@/lib/utils";
import {
	ChartProvider,
	type LineConfig,
	type Margin,
	type TooltipData,
} from "./chart-context";
import { Line, type LineProps } from "./line";

// Check if a component should render after the mouse overlay (markers need to be on top for interaction)
function isPostOverlayComponent(child: ReactElement): boolean {
	const childType = child.type as {
		displayName?: string;
		name?: string;
		__isChartMarkers?: boolean;
	};

	// Check for static marker property (more reliable than displayName)
	if (childType.__isChartMarkers) {
		return true;
	}

	// Fallback to displayName check
	const componentName =
		typeof child.type === "function"
			? childType.displayName || childType.name || ""
			: "";

	return componentName === "ChartMarkers" || componentName === "MarkerGroup";
}

export interface LineChartProps {
	/** Animation duration in milliseconds. Default: 1100 */
	animationDuration?: number;
	/** Aspect ratio as "width / height". Default: "2 / 1" */
	aspectRatio?: string;
	/** Child components (Line, Grid, ChartTooltip, etc.) */
	children: ReactNode;
	/** Additional class name for the container */
	className?: string;
	/** Data array - each item should have a date field and numeric values */
	data: Record<string, unknown>[];
	/** Chart margins */
	margin?: Partial<Margin>;
	/** Key in data for the x-axis (date). Default: "date" */
	xDataKey?: string;
}

const DEFAULT_MARGIN: Margin = { top: 40, right: 40, bottom: 40, left: 40 };

const findNearestIndex = (values: number[], target: number): number => {
	if (values.length === 0) {
		return 0;
	}

	let low = 0;
	let high = values.length - 1;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const current = values[mid];
		if (current === target) {
			return mid;
		}

		if (current < target) {
			low = mid + 1;
		} else {
			high = mid - 1;
		}
	}

	const left = Math.max(0, high);
	const right = Math.min(values.length - 1, low);
	const leftDistance = Math.abs(values[left] - target);
	const rightDistance = Math.abs(values[right] - target);
	return leftDistance <= rightDistance ? left : right;
};

const formatChartTime = (value: Date): string => {
	const totalMs = Math.max(0, Math.round(value.getTime()));
	const minutes = Math.floor(totalMs / 60_000);
	const seconds = Math.floor(totalMs / 1000) % 60;
	const milliseconds = totalMs % 1000;

	return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
};

// Extract line configs from children synchronously to avoid render timing issues
function extractLineConfigs(children: ReactNode): LineConfig[] {
	const configs: LineConfig[] = [];

	Children.forEach(children, (child) => {
		if (!isValidElement(child)) {
			return;
		}

		// Check if it's a Line component by displayName, function reference, or props structure
		const childType = child.type as {
			displayName?: string;
			name?: string;
		};
		const componentName =
			typeof child.type === "function"
				? childType.displayName || childType.name || ""
				: "";

		// Check by displayName, or by props having dataKey (duck typing)
		const props = child.props as LineProps | undefined;
		const isLineComponent =
			componentName === "Line" ||
			child.type === Line ||
			(props && typeof props.dataKey === "string" && props.dataKey.length > 0);

		if (isLineComponent && props?.dataKey) {
			configs.push({
				dataKey: props.dataKey,
				stroke: props.stroke || "var(--chart-line-primary)",
				strokeWidth: props.strokeWidth || 2.5,
			});
		}
	});

	return configs;
}

interface ChartInnerProps {
	animationDuration: number;
	children: ReactNode;
	containerRef: React.RefObject<HTMLDivElement | null>;
	data: Record<string, unknown>[];
	height: number;
	margin: Margin;
	width: number;
	xDataKey: string;
}

function ChartInner({
	width,
	height,
	data,
	xDataKey,
	margin,
	animationDuration,
	children,
	containerRef,
}: ChartInnerProps) {
	const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);

	// Extract line configs synchronously from children
	const lines = useMemo(() => extractLineConfigs(children), [children]);

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	// X accessor function
	const xAccessor = useCallback(
		(d: Record<string, unknown>): Date => {
			const value = d[xDataKey];
			return value instanceof Date ? value : new Date(value as string | number);
		},
		[xDataKey]
	);

	const xTimestamps = useMemo(
		() => data.map((item) => xAccessor(item).getTime()),
		[data, xAccessor]
	);

	// X scale (time) - use exact data domain for tight fit
	const xScale = useMemo(() => {
		const dates = data.map((d) => xAccessor(d));
		const minTime = Math.min(...dates.map((d) => d.getTime()));
		const maxTime = Math.max(...dates.map((d) => d.getTime()));

		return scaleTime({
			range: [0, innerWidth],
			domain: [minTime, maxTime],
		});
	}, [innerWidth, data, xAccessor]);

	// Calculate column width (spacing between data points)
	const columnWidth = useMemo(() => {
		if (data.length < 2) {
			return 0;
		}
		return innerWidth / (data.length - 1);
	}, [innerWidth, data.length]);

  // Y scale - computed from extracted line configs (available immediately)
  const yScale = useMemo(() => {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;

    for (const line of lines) {
      for (const d of data) {
        const value = d[line.dataKey];
        if (typeof value !== "number" || !Number.isFinite(value)) {
          continue;
        }

        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      }
    }

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      return scaleLinear({
        range: [innerHeight, 0],
        domain: [0, 100],
        nice: true,
      });
    }

    if (minValue === maxValue) {
      const delta = Math.abs(minValue) < 1 ? 1 : Math.abs(minValue) * 0.1;
      minValue -= delta;
      maxValue += delta;
    } else {
      const span = maxValue - minValue;
      const padding = span * 0.1;
      minValue -= padding;
      maxValue += padding;
    }

    return scaleLinear({
      range: [innerHeight, 0],
      domain: [minValue, maxValue],
      nice: true,
    });
  }, [innerHeight, data, lines]);

	// Pre-compute date labels for ticker animation
	const dateLabels = useMemo(
		() => data.map((d) => formatChartTime(xAccessor(d))),
		[data, xAccessor]
	);

	// Animation timing
	useEffect(() => {
		const timer = setTimeout(() => {
			setIsLoaded(true);
		}, animationDuration);
		return () => clearTimeout(timer);
	}, [animationDuration]);

	// Mouse move handler - works on the parent <g> element
	const handleMouseMove = useCallback(
		(event: React.MouseEvent<SVGGElement>) => {
			const point = localPoint(event);
			if (!point) {
				return;
			}

			// localPoint returns coordinates relative to the SVG root, so subtract margin
			const x0 = xScale.invert(point.x - margin.left);
			const hoveredTimestamp = x0.getTime();
			const finalIndex = findNearestIndex(xTimestamps, hoveredTimestamp);
			const d = data[finalIndex];
			if (!d) {
				return;
			}

			// Calculate y positions for each line
			const yPositions: Record<string, number> = {};
			for (const line of lines) {
				const value = d[line.dataKey];
				if (typeof value === "number") {
					yPositions[line.dataKey] = yScale(value) ?? 0;
				}
			}

			setTooltipData({
				point: d,
				index: finalIndex,
				x: xScale(xAccessor(d)) ?? 0,
				yPositions,
			});
		},
		[xScale, yScale, data, lines, margin.left, xAccessor, xTimestamps]
	);

	const handleMouseLeave = useCallback(() => {
		setTooltipData(null);
	}, []);

	// Early return if dimensions not ready
	if (width < 10 || height < 10) {
		return null;
	}

	const canInteract = isLoaded;

	// Separate children into pre-overlay (Grid, Line) and post-overlay (ChartMarkers)
	const preOverlayChildren: ReactElement[] = [];
	const postOverlayChildren: ReactElement[] = [];

	Children.forEach(children, (child) => {
		if (!isValidElement(child)) {
			return;
		}

		if (isPostOverlayComponent(child)) {
			postOverlayChildren.push(child);
		} else {
			preOverlayChildren.push(child);
		}
	});

	const contextValue = {
		data,
		xScale,
		yScale,
		width,
		height,
		innerWidth,
		innerHeight,
		margin,
		columnWidth,
		tooltipData,
		setTooltipData,
		containerRef,
		lines,
		isLoaded,
		animationDuration,
		xAccessor,
		dateLabels,
	};

	return (
		<ChartProvider value={contextValue}>
			<svg aria-hidden="true" height={height} width={width}>
				<defs>
					{/* Clip path for grow animation */}
					<clipPath id="chart-grow-clip">
						<rect
							height={innerHeight + 20}
							style={{
								transition: isLoaded
									? "none"
									: `width ${animationDuration}ms cubic-bezier(0.85, 0, 0.15, 1)`,
							}}
							width={isLoaded ? innerWidth : 0}
							x={0}
							y={0}
						/>
					</clipPath>
				</defs>

				<rect fill="transparent" height={height} width={width} x={0} y={0} />

				{/* biome-ignore lint/a11y/noStaticElementInteractions: Chart interaction area */}
				<g
					onMouseLeave={canInteract ? handleMouseLeave : undefined}
					onMouseMove={canInteract ? handleMouseMove : undefined}
					style={{ cursor: canInteract ? "crosshair" : "default" }}
					transform={`translate(${margin.left},${margin.top})`}
				>
					{/* Background rect for mouse event detection - markers rendered after this will receive events on top */}
					<rect
						fill="transparent"
						height={innerHeight}
						width={innerWidth}
						x={0}
						y={0}
					/>

					{/* SVG children rendered before markers (Grid, Line, etc.) */}
					{preOverlayChildren}

					{/* Markers rendered last so they're on top for interaction */}
					{postOverlayChildren}
				</g>
			</svg>
		</ChartProvider>
	);
}

export function LineChart({
	data,
	xDataKey = "date",
	margin: marginProp,
	animationDuration = 1100,
	aspectRatio = "2 / 1",
	className = "",
	children,
}: LineChartProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const margin = { ...DEFAULT_MARGIN, ...marginProp };

	return (
		<div
			className={cn("relative w-full", className)}
			ref={containerRef}
			style={{ aspectRatio }}
		>
			<ParentSize debounceTime={10}>
				{({ width, height }: { height: number; width: number }) => (
					<ChartInner
						animationDuration={animationDuration}
						containerRef={containerRef}
						data={data}
						height={height}
						margin={margin}
						width={width}
						xDataKey={xDataKey}
					>
						{children}
					</ChartInner>
				)}
			</ParentSize>
		</div>
	);
}

export default LineChart;
