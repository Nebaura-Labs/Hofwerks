import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { curveMonotoneX } from "@visx/curve";
import { FileUp } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Grid } from "@/components/charts/grid";
import { Line } from "@/components/charts/line";
import { LineChart } from "@/components/charts/line-chart";
import { ChartTooltip, type TooltipRow } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { Button } from "@/components/ui/button";
import { getUser } from "@/functions/get-user";

interface ChartPoint {
	date: Date;
	timeMs?: number;
	[key: string]: Date | number;
}

interface CsvData {
	chartData: ChartPoint[];
	columns: number;
	fileName: string;
	headers: string[];
	numericHeaders: string[];
	rows: number;
}

type ScaleMode = "per_parameter" | "shared";

const CHART_LINE_COLORS = [
	"var(--chart-line-primary)",
	"var(--chart-line-secondary)",
	"#10b981",
	"#f59e0b",
	"#ef4444",
	"#38bdf8",
	"#a78bfa",
	"#f472b6",
	"#22d3ee",
	"#84cc16",
] as const;

const RAW_VALUE_KEY_PREFIX = "__raw__";

const getRawValueKey = (parameter: string): string =>
	`${RAW_VALUE_KEY_PREFIX}${parameter}`;

const getParameterColor = (
	parameter: string,
	numericHeaders: string[]
): string => {
	const index = numericHeaders.indexOf(parameter);
	if (index < 0) {
		return "var(--chart-line-primary)";
	}
	return CHART_LINE_COLORS[index % CHART_LINE_COLORS.length];
};

const getDefaultSelectedParameters = (headers: string[]): string[] => {
	const rpmHeaders = headers.filter((header) =>
		header.trim().toLowerCase().includes("rpm")
	);

	if (rpmHeaders.length > 0) {
		return rpmHeaders;
	}

	return headers.length > 0 ? [headers[0]] : [];
};

const sortHeadersWithRpmFirst = (headers: string[]): string[] => {
	const rpmHeaders: string[] = [];
	const otherHeaders: string[] = [];

	for (const header of headers) {
		if (header.trim().toLowerCase().includes("rpm")) {
			rpmHeaders.push(header);
		} else {
			otherHeaders.push(header);
		}
	}

	return [...rpmHeaders, ...otherHeaders];
};

const splitCsvLine = (line: string, delimiter: string): string[] => {
	const values: string[] = [];
	let current = "";
	let isQuoted = false;

	for (let index = 0; index < line.length; index += 1) {
		const character = line[index];

		if (character === '"') {
			const nextCharacter = line[index + 1];
			if (isQuoted && nextCharacter === '"') {
				current += '"';
				index += 1;
				continue;
			}
			isQuoted = !isQuoted;
			continue;
		}

		if (character === delimiter && !isQuoted) {
			values.push(current.trim());
			current = "";
			continue;
		}

		current += character;
	}

	values.push(current.trim());
	return values;
};

const detectDelimiter = (line: string): string => {
	const candidates = [",", ";", "\t"] as const;
	let bestDelimiter = ",";
	let bestScore = -1;

	for (const delimiter of candidates) {
		const score = splitCsvLine(line, delimiter).length;
		if (score > bestScore) {
			bestDelimiter = delimiter;
			bestScore = score;
		}
	}

	return bestDelimiter;
};

const parseNumericValue = (value: string): number | null => {
	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}

	let normalized = trimmed;
	const hasComma = normalized.includes(",");
	const hasDot = normalized.includes(".");

	// Handle locale-specific decimal/thousand separators.
	if (hasComma && hasDot) {
		const lastCommaIndex = normalized.lastIndexOf(",");
		const lastDotIndex = normalized.lastIndexOf(".");
		if (lastCommaIndex > lastDotIndex) {
			// Example: 1.234,56
			normalized = normalized.replaceAll(".", "").replace(",", ".");
		} else {
			// Example: 1,234.56
			normalized = normalized.replaceAll(",", "");
		}
	} else if (hasComma && !hasDot) {
		const parts = normalized.split(",");
		const fraction = parts[1];
		if (parts.length === 2 && fraction && fraction.length <= 2) {
			// Example: 68,00 -> 68.00
			normalized = normalized.replace(",", ".");
		} else {
			// Example: 6,800 -> 6800
			normalized = normalized.replaceAll(",", "");
		}
	}

	normalized = normalized.replaceAll(" ", "");
	if (normalized.length === 0) {
		return null;
	}

	const parsed = Number.parseFloat(normalized);
	if (Number.isNaN(parsed)) {
		return null;
	}

	return parsed;
};

const parseCsvContent = (content: string, fileName: string): CsvData => {
	const lines = content
		.replaceAll("\r\n", "\n")
		.replaceAll("\r", "\n")
		.split("\n")
		.filter((line) => line.trim().length > 0);

	if (lines.length < 2) {
		throw new Error("CSV must include a header row and at least one data row.");
	}

	const delimiter = detectDelimiter(lines[0]);
	const originalHeaders = splitCsvLine(lines[0], delimiter);
	const headers = sortHeadersWithRpmFirst(originalHeaders);
	const timeColumnIndex = originalHeaders.findIndex((header) => {
		const normalized = header.trim().toLowerCase();
		return normalized === "time (ms)" || normalized === "time(ms)";
	});
	const rowValues = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
	const numericHeaders = sortHeadersWithRpmFirst(
		originalHeaders.filter((header, columnIndex) => {
			const normalizedHeader = header.trim().toLowerCase();
			const isTimeColumn =
				normalizedHeader === "time (ms)" || normalizedHeader === "time(ms)";
			if (isTimeColumn) {
				return false;
			}

			return rowValues.some(
				(row) => parseNumericValue(row[columnIndex] ?? "") !== null
			);
		})
	);

	const chartData = rowValues.map((row, rowIndex) => {
		const rawTimeValue =
			timeColumnIndex >= 0
				? parseNumericValue(row[timeColumnIndex] ?? "")
				: null;
		const timeMs = rawTimeValue ?? rowIndex * 100;
		const point: ChartPoint = {
			date: new Date(timeMs),
			timeMs,
		};

		for (
			let columnIndex = 0;
			columnIndex < originalHeaders.length;
			columnIndex += 1
		) {
			const header = originalHeaders[columnIndex];
			if (!header) {
				continue;
			}
			const numericValue = parseNumericValue(row[columnIndex] ?? "");
			if (numericValue !== null) {
				point[header] = numericValue;
			}
		}

		return point;
	});

	return {
		chartData,
		columns: originalHeaders.length,
		fileName,
		headers,
		numericHeaders,
		rows: rowValues.length,
	};
};

const normalizeChartData = (
	chartData: ChartPoint[],
	parameters: string[],
	scaleMode: ScaleMode
): ChartPoint[] => {
	if (scaleMode === "shared" || parameters.length === 0) {
		return chartData;
	}

	const ranges = new Map<string, { max: number; min: number }>();
	for (const parameter of parameters) {
		let min = Number.POSITIVE_INFINITY;
		let max = Number.NEGATIVE_INFINITY;

		for (const point of chartData) {
			const value = point[parameter];
			if (typeof value !== "number" || Number.isNaN(value)) {
				continue;
			}
			if (value < min) {
				min = value;
			}
			if (value > max) {
				max = value;
			}
		}

		if (Number.isFinite(min) && Number.isFinite(max)) {
			ranges.set(parameter, { min, max });
		}
	}

	return chartData.map((point) => {
		const nextPoint: ChartPoint = { ...point };
		for (const parameter of parameters) {
			const rawValue = point[parameter];
			if (typeof rawValue !== "number" || Number.isNaN(rawValue)) {
				continue;
			}

			nextPoint[getRawValueKey(parameter)] = rawValue;
			const range = ranges.get(parameter);
			if (!range) {
				continue;
			}

			const delta = range.max - range.min;
			nextPoint[parameter] =
				delta <= 0 ? 50 : ((rawValue - range.min) / delta) * 100;
		}
		return nextPoint;
	});
};

export const Route = createFileRoute("/dashboard/log-viewer/")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser();
		return { session };
	},
	loader: ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: "/login",
			});
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [csvData, setCsvData] = useState<CsvData | null>(null);
	const [csvError, setCsvError] = useState<string | null>(null);
	const [isDragActive, setIsDragActive] = useState<boolean>(false);
	const [scaleMode, setScaleMode] = useState<ScaleMode>("shared");
	const [selectedParameters, setSelectedParameters] = useState<string[]>([]);

	const loadFile = async (file: File): Promise<void> => {
		try {
			const content = await file.text();
			const parsed = parseCsvContent(content, file.name);
			setCsvData(parsed);
			setSelectedParameters(
				getDefaultSelectedParameters(parsed.numericHeaders)
			);
			setCsvError(null);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to parse CSV file.";
			setCsvError(message);
			setCsvData(null);
		}
	};

	const selectedNumericParameters =
		csvData?.numericHeaders.filter((header) =>
			selectedParameters.includes(header)
		) ?? [];
	const chartData = useMemo(() => {
		if (!csvData) {
			return [];
		}
		return normalizeChartData(
			csvData.chartData,
			selectedNumericParameters,
			scaleMode
		);
	}, [csvData, selectedNumericParameters, scaleMode]);

	return (
		<main className="relative min-h-svh w-full">
			<div
				className="absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(125% 125% at 50% 10%, #000000 40%, #350136 100%)",
				}}
			/>
			<section className="relative z-10 w-full space-y-10 px-6 py-8 md:px-8 md:py-10">
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div className="space-y-1">
						<h1 className="font-semibold text-3xl text-white tracking-tight">
							Log Viewer
						</h1>
						<p className="text-sm text-white/65">
							Upload a CSV log and visualize channels on interactive charts.
						</p>
					</div>
					<Button
						className="border border-white/15 bg-black/25 text-white backdrop-blur-md hover:border-white/25 hover:bg-black/35"
						onClick={() => {
							navigate({ to: "/dashboard" });
						}}
						type="button"
						variant="outline"
					>
						Back to Dashboard
					</Button>
				</div>

				<div className="grid grid-cols-1 gap-10">
					<div className="space-y-4">
						<h2 className="flex items-center gap-2 font-semibold text-white text-xl">
							<FileUp className="size-4" />
							Upload CSV
						</h2>
						<p className="text-sm text-white/65">
							Drop your exported log file or browse to select one.
						</p>
						<input
							accept=".csv,text/csv"
							className="hidden"
							onChange={async (event) => {
								const file = event.target.files?.[0];
								if (file) {
									await loadFile(file);
								}
							}}
							ref={fileInputRef}
							type="file"
						/>
						<button
							className={`flex min-h-44 w-full items-center justify-center rounded-xl border border-dashed bg-black/20 p-6 text-center transition-colors ${
								isDragActive
									? "border-primary/70 bg-primary/10"
									: "border-white/20"
							}`}
							onClick={() => {
								fileInputRef.current?.click();
							}}
							onDragLeave={() => {
								setIsDragActive(false);
							}}
							onDragOver={(event) => {
								event.preventDefault();
								setIsDragActive(true);
							}}
							onDrop={async (event) => {
								event.preventDefault();
								setIsDragActive(false);
								const file = event.dataTransfer.files?.[0];
								if (file) {
									await loadFile(file);
								}
							}}
							type="button"
						>
							<div className="space-y-3">
								<p className="text-sm text-white/80">Drag and drop CSV here</p>
								<span className="inline-flex h-8 items-center rounded-md border border-white/15 bg-black/25 px-3 text-white/85 text-xs">
									Choose File
								</span>
							</div>
						</button>
						{csvError ? (
							<p className="text-rose-300 text-sm">{csvError}</p>
						) : null}
						{csvData ? (
							<p className="text-emerald-300 text-sm">
								Loaded: {csvData.fileName}
							</p>
						) : null}
					</div>

					{csvData ? (
						<div className="space-y-4">
							<h2 className="font-semibold text-white text-xl">Parameters</h2>
							<p className="text-sm text-white/65">
								File: {csvData.fileName} | Rows: {csvData.rows} | Columns:{" "}
								{csvData.columns}
							</p>
							<div className="flex flex-wrap gap-2">
								{csvData.numericHeaders.map((header) => {
									const isSelected = selectedParameters.includes(header);
									const isNumeric = csvData.numericHeaders.includes(header);
									const parameterColor = isNumeric
										? getParameterColor(header, csvData.numericHeaders)
										: "rgba(255,255,255,0.45)";
									return (
										<Button
											className={
												isSelected
													? ""
													: "border-white/15 bg-black/25 text-white/85 hover:border-white/25 hover:bg-black/35"
											}
											key={header}
											onClick={() => {
												setSelectedParameters((previous) => {
													if (previous.includes(header)) {
														return previous.filter((item) => item !== header);
													}
													return [...previous, header];
												});
											}}
											type="button"
											variant={isSelected ? "default" : "outline"}
										>
											<span
												aria-hidden="true"
												className="mr-2 inline-flex h-2.5 w-2.5 rounded-full"
												style={{ backgroundColor: parameterColor }}
											/>
											{header}
										</Button>
									);
								})}
							</div>

							{selectedNumericParameters.length > 0 ? (
								<div className="space-y-4 pt-2">
									<div className="space-y-3">
										<h3 className="font-medium text-lg text-white">
											Log Graph
										</h3>
										<p className="text-sm text-white/65">
											Selected parameters are shown below. Toggle buttons above
											to show or hide lines.
										</p>
										<div className="flex flex-wrap gap-2 pt-1">
											<Button
												onClick={() => {
													setScaleMode("shared");
												}}
												type="button"
												variant={scaleMode === "shared" ? "default" : "outline"}
											>
												Shared Scale
											</Button>
											<Button
												className={
													scaleMode === "per_parameter"
														? ""
														: "border-white/15 bg-black/25 text-white/85 hover:border-white/25 hover:bg-black/35"
												}
												onClick={() => {
													setScaleMode("per_parameter");
												}}
												type="button"
												variant={
													scaleMode === "per_parameter" ? "default" : "outline"
												}
											>
												Per-Parameter Scale
											</Button>
										</div>
									</div>
									<div className="rounded-xl border border-white/15 bg-black/25 p-3">
										<LineChart animationDuration={500} data={chartData}>
											<Grid horizontal />
											{selectedNumericParameters.map((parameter) => (
												<Line
													animate
													curve={curveMonotoneX}
													dataKey={parameter}
													highlightWindow={4}
													key={parameter}
													showHighlight
													stroke={getParameterColor(
														parameter,
														csvData.numericHeaders
													)}
												/>
											))}
											<XAxis />
											<ChartTooltip
												rows={(point) => {
													return selectedNumericParameters.map((parameter) => {
														const rawValue = point[getRawValueKey(parameter)];
														let value = 0;
														if (typeof rawValue === "number") {
															value = rawValue;
														} else if (typeof point[parameter] === "number") {
															value = point[parameter];
														}
														return {
															color: getParameterColor(
																parameter,
																csvData.numericHeaders
															),
															label: parameter,
															value,
														} satisfies TooltipRow;
													});
												}}
											/>
										</LineChart>
									</div>
								</div>
							) : (
								<p className="text-sm text-white/60">
									No numeric parameters selected. Use the parameter buttons
									above to add lines to the graph.
								</p>
							)}
						</div>
					) : null}
				</div>
			</section>
		</main>
	);
}
