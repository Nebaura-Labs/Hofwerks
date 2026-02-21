import { UploadSimple } from "@phosphor-icons/react";
import { curveMonotoneX } from "@visx/curve";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Grid } from "@/components/charts/grid";
import { Line } from "@/components/charts/line";
import { LineChart } from "@/components/charts/line-chart";
import { ChartTooltip, type TooltipRow } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import { convexQuery } from "../lib/convex-client";
import type { DecodedSample } from "../types";

interface DatalogViewerScreenProps {
	onBack: () => void;
	recordedSamples: DecodedSample[];
}

interface ChartPoint {
	date: Date;
	index: number;
	timeMs?: number;
	[key: string]: Date | number | undefined;
}

interface CsvData {
	chartData: ChartPoint[];
	columns: number;
	fileName: string;
	numericHeaders: string[];
	rows: number;
}

interface SavedLogSummary {
	_id: string;
	createdAtIso: string;
	dmeProfile: string;
	durationMs: number;
	fileName: string;
	sampleCount: number;
}

interface SavedLogDownload {
	downloadUrl: string;
	fileName: string;
}

type ScaleMode = "per_parameter" | "shared";

const CURRENT_SESSION_SOURCE_ID = "__current_session__";
const RAW_VALUE_KEY_PREFIX = "__raw__";

const getRawValueKey = (parameter: string): string =>
	`${RAW_VALUE_KEY_PREFIX}${parameter}`;

const getParameterColor = (
	parameter: string,
	numericHeaders: string[]
): string => {
	const index = numericHeaders.indexOf(parameter);
	if (index < 0) {
		return "hsl(214 90% 62%)";
	}

	// Golden-angle hue stepping gives distinct, non-repeating colors.
	const hue = (index * 137.508) % 360;
	return `hsl(${hue} 84% 62%)`;
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

	if (hasComma && hasDot) {
		const lastCommaIndex = normalized.lastIndexOf(",");
		const lastDotIndex = normalized.lastIndexOf(".");
		if (lastCommaIndex > lastDotIndex) {
			normalized = normalized.replaceAll(".", "").replace(",", ".");
		} else {
			normalized = normalized.replaceAll(",", "");
		}
	} else if (hasComma && !hasDot) {
		const parts = normalized.split(",");
		const fraction = parts[1];
		if (parts.length === 2 && fraction && fraction.length <= 2) {
			normalized = normalized.replace(",", ".");
		} else {
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
	const timeColumnIndex = originalHeaders.findIndex((header) => {
		const normalized = header.trim().toLowerCase();
		return (
			normalized === "time (ms)" ||
			normalized === "time(ms)" ||
			normalized === "timestamp_ms"
		);
	});

	const rowValues = lines.slice(1).map((line) => splitCsvLine(line, delimiter));
	const numericHeaders = sortHeadersWithRpmFirst(
		originalHeaders.filter((header, columnIndex) => {
			const normalizedHeader = header.trim().toLowerCase();
			const isTimeColumn =
				normalizedHeader === "time (ms)" ||
				normalizedHeader === "time(ms)" ||
				normalizedHeader === "timestamp_ms";
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
			index: rowIndex,
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

const buildChartDataFromSamples = (
	samples: DecodedSample[]
): CsvData | null => {
	if (samples.length === 0) {
		return null;
	}

	const headers = Array.from(
		samples.reduce<Set<string>>((accumulator, sample) => {
			for (const key of Object.keys(sample.values)) {
				if (key !== "time-ms") {
					accumulator.add(key);
				}
			}
			return accumulator;
		}, new Set<string>())
	);

	const numericHeaders = sortHeadersWithRpmFirst(headers);
	const chartData = samples.map((sample, index) => {
		const point: ChartPoint = {
			date: new Date(sample.timestamp_ms),
			index,
			timeMs: sample.timestamp_ms,
		};

		for (const [key, value] of Object.entries(sample.values)) {
			if (key === "time-ms") {
				continue;
			}
			point[key] = value;
		}

		return point;
	});

	return {
		chartData,
		columns: numericHeaders.length,
		fileName: "Current Session",
		numericHeaders,
		rows: chartData.length,
	};
};

const formatLogMeta = (log: SavedLogSummary): string => {
	const created = new Date(log.createdAtIso).toLocaleString();
	const durationSeconds = Math.max(0, Math.round(log.durationMs / 1000));
	return `${log.dmeProfile} • ${log.sampleCount} samples • ${durationSeconds}s • ${created}`;
};

export const DatalogViewerScreen = ({
	onBack,
	recordedSamples,
}: DatalogViewerScreenProps) => {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [csvData, setCsvData] = useState<CsvData | null>(() =>
		buildChartDataFromSamples(recordedSamples)
	);
	const [csvError, setCsvError] = useState<string | null>(null);
	const [isDragActive, setIsDragActive] = useState<boolean>(false);
	const [scaleMode, setScaleMode] = useState<ScaleMode>("per_parameter");
	const [selectedParameters, setSelectedParameters] = useState<string[]>(() =>
		getDefaultSelectedParameters(
			buildChartDataFromSamples(recordedSamples)?.numericHeaders ?? []
		)
	);
	const [savedLogs, setSavedLogs] = useState<SavedLogSummary[]>([]);
	const [selectedSourceId, setSelectedSourceId] = useState<string>(
		recordedSamples.length > 0 ? CURRENT_SESSION_SOURCE_ID : ""
	);
	const [isSavedLogsLoading, setIsSavedLogsLoading] = useState<boolean>(false);

	const applyCsvData = useCallback((data: CsvData): void => {
		setCsvData(data);
		setSelectedParameters(getDefaultSelectedParameters(data.numericHeaders));
		setCsvError(null);
	}, []);

	const loadFile = async (file: File): Promise<void> => {
		try {
			const content = await file.text();
			const parsed = parseCsvContent(content, file.name);
			applyCsvData(parsed);
			setSelectedSourceId("");
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to parse CSV file.";
			setCsvError(message);
			setCsvData(null);
		}
	};

	const loadSavedLogs = useCallback(async (): Promise<void> => {
		setIsSavedLogsLoading(true);
		try {
			const logs = await convexQuery<Record<string, never>, SavedLogSummary[]>(
				"logs:listMyLogs",
				{}
			);
			setSavedLogs(logs);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to load saved logs.";
			setCsvError(message);
		} finally {
			setIsSavedLogsLoading(false);
		}
	}, []);

	useEffect(() => {
		loadSavedLogs().catch(() => {
			setCsvError("Failed to load saved logs.");
		});
	}, [loadSavedLogs]);

	useEffect(() => {
		if (selectedSourceId !== CURRENT_SESSION_SOURCE_ID) {
			return;
		}

		const currentSessionData = buildChartDataFromSamples(recordedSamples);
		if (currentSessionData) {
			applyCsvData(currentSessionData);
		}
	}, [applyCsvData, recordedSamples, selectedSourceId]);

	const loadSavedLog = async (logId: string): Promise<void> => {
		if (logId === CURRENT_SESSION_SOURCE_ID) {
			const currentSessionData = buildChartDataFromSamples(recordedSamples);
			if (currentSessionData) {
				applyCsvData(currentSessionData);
			}
			setSelectedSourceId(logId);
			return;
		}

		try {
			const payload = await convexQuery<{ logId: string }, SavedLogDownload>(
				"logs:getLogDownloadUrl",
				{
					logId,
				}
			);
			const response = await fetch(payload.downloadUrl);
			if (!response.ok) {
				throw new Error("Failed to download saved log.");
			}

			const content = await response.text();
			const parsed = parseCsvContent(content, payload.fileName);
			applyCsvData(parsed);
			setSelectedSourceId(logId);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to load saved log.";
			setCsvError(message);
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

	const chartTooltipRows = (point: Record<string, unknown>): TooltipRow[] => {
		return selectedNumericParameters.flatMap((parameter) => {
			const rawValue = point[getRawValueKey(parameter)];
			const normalizedValue = point[parameter];
			const resolvedValue =
				typeof rawValue === "number" && Number.isFinite(rawValue)
					? rawValue
					: typeof normalizedValue === "number" && Number.isFinite(normalizedValue)
						? normalizedValue
						: null;

			if (resolvedValue === null) {
				return [];
			}

			return [{
				color: getParameterColor(parameter, csvData?.numericHeaders ?? []),
				label: parameter,
				value: resolvedValue.toFixed(3),
			}];
		});
	};

	return (
		<div className="space-y-6">
			<div className="space-y-3">
				<Button onClick={onBack} type="button" variant="outline">
					Back
				</Button>
				<h1 className="font-semibold text-3xl tracking-tight">
					Datalog Viewer
				</h1>
				<p className="text-muted-foreground text-sm">
					Upload, load, and graph saved runs.
				</p>
			</div>

			<Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
				<CardHeader className="space-y-2">
					<CardTitle>Load Source</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
						<Select
								onValueChange={(value) => {
									loadSavedLog(value).catch(() => {
										setCsvError("Failed to load saved log.");
									});
								}}
							value={selectedSourceId}
						>
							<SelectTrigger className="w-full border-white/20 bg-black/25 text-white">
								<SelectValue placeholder="Select a saved log" />
							</SelectTrigger>
							<SelectContent className="border-white/15 bg-black/85 text-white backdrop-blur-xl">
								{recordedSamples.length > 0 ? (
									<SelectItem value={CURRENT_SESSION_SOURCE_ID}>
										Current Session
									</SelectItem>
								) : null}
								{savedLogs.map((log) => (
									<SelectItem key={log._id} value={log._id}>
										{log.fileName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Button
							disabled={isSavedLogsLoading}
							onClick={() => {
								loadSavedLogs().catch(() => {
									setCsvError("Failed to load saved logs.");
								});
							}}
							type="button"
							variant="outline"
						>
							{isSavedLogsLoading ? "Loading..." : "Refresh Logs"}
						</Button>
					</div>

					{selectedSourceId &&
					selectedSourceId !== CURRENT_SESSION_SOURCE_ID ? (
						<p className="text-white/70 text-xs">
							{formatLogMeta(
								savedLogs.find((log) => log._id === selectedSourceId) ?? {
									_id: "",
									createdAtIso: new Date().toISOString(),
									dmeProfile: "Unknown DME",
									durationMs: 0,
									fileName: "",
									sampleCount: 0,
								}
							)}
						</p>
					) : null}

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
						className={`flex min-h-36 w-full items-center justify-center rounded-xl border border-dashed bg-black/20 p-6 text-center transition-colors ${
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
							<UploadSimple className="mx-auto h-6 w-6 text-white/80" />
							<p className="text-sm text-white/85">
								Drag CSV here or choose file
							</p>
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
							Loaded: {csvData.fileName} ({csvData.rows} rows, {csvData.columns}{" "}
							columns)
						</p>
					) : null}
				</CardContent>
			</Card>

			{csvData ? (
				<Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
					<CardHeader className="space-y-2">
						<CardTitle>Parameters</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex flex-wrap gap-2">
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
								variant={scaleMode === "per_parameter" ? "default" : "outline"}
							>
								Per-Parameter Scale
							</Button>
						</div>

						{selectedNumericParameters.length > 0 ? (
							<div className="rounded-xl border border-white/10 bg-black/28 p-3">
								<LineChart
									animationDuration={500}
									aspectRatio="16 / 9"
									className="min-h-[19rem] w-full"
									data={chartData}
								>
									<Grid horizontal />
									{selectedNumericParameters.map((parameter) => (
										<Line
											animate
											curve={curveMonotoneX}
											dataKey={parameter}
											fadeEdges={false}
											highlightWindow={4}
											key={parameter}
											showHighlight
											stroke={getParameterColor(
												parameter,
												csvData.numericHeaders
											)}
											strokeWidth={2.8}
										/>
									))}
									<XAxis numTicks={6} />
									<ChartTooltip rows={chartTooltipRows} />
								</LineChart>
							</div>
							) : (
								<p className="text-sm text-white/65">
									No parameters selected. Pick at least one channel to draw the
									graph.
								</p>
							)}

						<div className="flex flex-wrap gap-2">
							{csvData.numericHeaders.map((header) => {
								const isSelected = selectedParameters.includes(header);
								const parameterColor = getParameterColor(
									header,
									csvData.numericHeaders
								);

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
					</CardContent>
				</Card>
			) : null}
		</div>
	);
};
