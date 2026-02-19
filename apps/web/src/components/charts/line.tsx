"use client";

import { curveNatural } from "@visx/curve";
import { LinePath } from "@visx/shape";

// CurveFactory type - simplified version compatible with visx
// biome-ignore lint/suspicious/noExplicitAny: d3 curve factory type
type CurveFactory = any;

import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chartCssVars, useChart } from "./chart-context";

export interface LineProps {
	/** Whether to animate the line. Default: true */
	animate?: boolean;
	/** Curve function. Default: curveNatural */
	curve?: CurveFactory;
	/** Key in data to use for y values */
	dataKey: string;
	/** Whether to fade edges with gradient. Default: true */
	fadeEdges?: boolean;
	/** Number of points shown before and after hovered point. Default: 3 */
	highlightWindow?: number;
	/** Whether to show highlight segment on hover. Default: true */
	showHighlight?: boolean;
	/** Stroke color. Default: var(--chart-line-primary) */
	stroke?: string;
	/** Stroke width. Default: 2.5 */
	strokeWidth?: number;
}

export function Line({
	dataKey,
	stroke = chartCssVars.linePrimary,
	strokeWidth = 2.5,
	curve = curveNatural,
	animate = true,
	fadeEdges = true,
	showHighlight = true,
	highlightWindow = 3,
}: LineProps) {
	const {
		data,
		xScale,
		yScale,
		innerHeight,
		innerWidth,
		tooltipData,
		isLoaded,
		animationDuration,
		xAccessor,
	} = useChart();

	const pathRef = useRef<SVGPathElement>(null);
	const [clipWidth, setClipWidth] = useState(0);
	const safeDataKey = useMemo(
		() => dataKey.replace(/[^a-zA-Z0-9_-]/g, "-"),
		[dataKey]
	);
	const clipPathId = useMemo(
		() => `grow-clip-${safeDataKey}-${Math.random().toString(36).slice(2, 9)}`,
		[safeDataKey]
	);

	// Unique gradient ID for this line
	const gradientId = useMemo(
		() =>
			`line-gradient-${safeDataKey}-${Math.random().toString(36).slice(2, 9)}`,
		[safeDataKey]
	);

	// Measure path length and trigger animation
	useEffect(() => {
		if (pathRef.current && animate) {
			const len = pathRef.current.getTotalLength();
			if (len > 0 && !isLoaded) {
				requestAnimationFrame(() => {
					setClipWidth(innerWidth);
				});
			}
		}
	}, [animate, innerWidth, isLoaded]);

	const highlightSegmentData = useMemo(() => {
		if (!tooltipData) {
			return [];
		}

		const idx = tooltipData.index;
		const startIdx = Math.max(0, idx - highlightWindow);
		const endIdx = Math.min(data.length - 1, idx + highlightWindow);
		return data.slice(startIdx, endIdx + 1);
	}, [tooltipData, data, highlightWindow]);

	// Get y value for a data point
	const getY = useCallback(
		(d: Record<string, unknown>) => {
			const value = d[dataKey];
			return typeof value === "number" ? (yScale(value) ?? 0) : 0;
		},
		[dataKey, yScale]
	);

	const isHovering = tooltipData !== null;
	const easing = "cubic-bezier(0.85, 0, 0.15, 1)";

	return (
		<>
			{/* Gradient definition for fading edges */}
			{fadeEdges && (
				<defs>
					<linearGradient id={gradientId} x1="0%" x2="100%" y1="0%" y2="0%">
						<stop offset="0%" style={{ stopColor: stroke, stopOpacity: 0 }} />
						<stop offset="15%" style={{ stopColor: stroke, stopOpacity: 1 }} />
						<stop offset="85%" style={{ stopColor: stroke, stopOpacity: 1 }} />
						<stop offset="100%" style={{ stopColor: stroke, stopOpacity: 0 }} />
					</linearGradient>
				</defs>
			)}

			{/* Clip path for grow animation - unique per line */}
			{animate && (
				<defs>
					<clipPath id={clipPathId}>
						<rect
							height={innerHeight + 20}
							style={{
								transition:
									!isLoaded && clipWidth > 0
										? `width ${animationDuration}ms ${easing}`
										: "none",
							}}
							width={isLoaded ? innerWidth : clipWidth}
							x={0}
							y={0}
						/>
					</clipPath>
				</defs>
			)}

			{/* Main line with clip path */}
			<g clipPath={animate ? `url(#${clipPathId})` : undefined}>
				<motion.g
					animate={{ opacity: isHovering && showHighlight ? 0.3 : 1 }}
					initial={{ opacity: 1 }}
					transition={{ duration: 0.4, ease: "easeInOut" }}
				>
					<LinePath
						curve={curve}
						data={data}
						innerRef={pathRef}
						stroke={fadeEdges ? `url(#${gradientId})` : stroke}
						strokeLinecap="round"
						strokeWidth={strokeWidth}
						x={(d) => xScale(xAccessor(d)) ?? 0}
						y={getY}
					/>
				</motion.g>
			</g>

			{/* Highlight segment around hovered index */}
			{showHighlight &&
				isHovering &&
				isLoaded &&
				highlightSegmentData.length > 1 && (
					<motion.g
						animate={{ opacity: 1 }}
						initial={{ opacity: 0 }}
						transition={{ duration: 0.25, ease: "easeInOut" }}
					>
						<LinePath
							curve={curve}
							data={highlightSegmentData}
							stroke={stroke}
							strokeLinecap="round"
							strokeWidth={strokeWidth}
							x={(d) => xScale(xAccessor(d)) ?? 0}
							y={getY}
						/>
					</motion.g>
				)}
		</>
	);
}

Line.displayName = "Line";

export default Line;
