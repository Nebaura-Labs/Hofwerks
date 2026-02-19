"use client";

import { motion, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";
import { chartCssVars } from "../chart-context";

// Slower spring for a longer/smoother moving crosshair feel
const crosshairSpringConfig = { stiffness: 140, damping: 24 };

export type IndicatorWidth =
	| number // Pixel width
	| "line" // 1px line (default)
	| "thin" // 2px
	| "medium" // 4px
	| "thick"; // 8px

export interface TooltipIndicatorProps {
	/** Primary color at edges (10% and 90%) */
	colorEdge?: string;
	/** Secondary color at center (50%) */
	colorMid?: string;
	/** Width of a single column/day in pixels. Required when using `span`. */
	columnWidth?: number;
	/** Whether to fade to transparent at 0% and 100% */
	fadeEdges?: boolean;
	/** Unique ID for the gradient */
	gradientId?: string;
	/** Height of the indicator */
	height: number;
	/**
	 * Number of columns/days to span, with current point centered.
	 * Requires `columnWidth` to be set.
	 */
	span?: number;
	/** Whether the indicator is visible */
	visible: boolean;
	/**
	 * Width of the indicator - number (pixels) or preset.
	 * Ignored if `span` is provided.
	 */
	width?: IndicatorWidth;
	/** X position in pixels (center of the indicator) */
	x: number;
}

function resolveWidth(width: IndicatorWidth): number {
	if (typeof width === "number") {
		return width;
	}
	switch (width) {
		case "line":
			return 1;
		case "thin":
			return 2;
		case "medium":
			return 4;
		case "thick":
			return 8;
		default:
			return 1;
	}
}

export function TooltipIndicator({
	x,
	height,
	visible,
	width = "line",
	span,
	columnWidth,
	colorMid = chartCssVars.crosshair,
	fadeEdges = true,
}: TooltipIndicatorProps) {
	const pixelWidth =
		span !== undefined && columnWidth !== undefined
			? span * columnWidth
			: resolveWidth(width);

	const animatedX = useSpring(x - pixelWidth / 2, crosshairSpringConfig);
	const snappedX = useTransform(animatedX, (value) => Math.round(value));

	useEffect(() => {
		animatedX.set(x - pixelWidth / 2);
	}, [x, animatedX, pixelWidth]);

	const lineX = useTransform(snappedX, (value) => value + pixelWidth / 2);

	if (!visible) {
		return null;
	}

	const edgeOpacity = fadeEdges ? 0 : 1;

	return (
		<motion.line
			shapeRendering="crispEdges"
			stroke={colorMid}
			strokeLinecap="round"
			strokeOpacity={edgeOpacity === 0 ? 0.95 : 1}
			strokeWidth={Math.max(1, pixelWidth)}
			x1={lineX}
			x2={lineX}
			y1={0}
			y2={height}
		/>
	);
}

TooltipIndicator.displayName = "TooltipIndicator";

export default TooltipIndicator;
