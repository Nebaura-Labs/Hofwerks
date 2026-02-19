import { Activity, Plug } from "lucide-react";
import { AppTopCards } from "../components/app-top-cards";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import type {
	ConnectionMode,
	DmeProfile,
	LoggingParameter,
	SerialPortInfo,
} from "../types";

type DataloggingScreenProps = {
	connectionMode: ConnectionMode;
	selectedDme: DmeProfile;
	selectedPort: string | null;
	isVehicleConnected: boolean;
	availablePorts: SerialPortInfo[];
	availableParameters: LoggingParameter[];
	selectedParameterKeys: string[];
	serialPorts: SerialPortInfo[];
	isLoading: boolean;
	errorMessage: string | null;
	onBack: () => void;
	onConnectionModeChange: (mode: ConnectionMode) => void;
	onDmeChange: (dme: DmeProfile) => void;
	onPortSelect: (portName: string) => void;
	onConnect: () => void;
	onDisconnect: () => void;
	onStartLogging: () => void;
	onStopLogging: () => void;
	onToggleParameter: (parameterKey: string) => void;
	onRefresh: () => void;
	dmeProfiles: DmeProfile[];
	userName: string;
	currentPlan: string;
	softwareVersion: string;
	isLogging: boolean;
	totalBytesLogged: number;
	logLines: string[];
	latestDecodedValues: Record<string, number>;
	lastDecodedTimestamp: number | null;
	protocolMode: string;
	recordedSampleCount: number;
	onExportCsv: () => void;
	elmSupportedParameterKeys: Set<string>;
};

export const DataloggingScreen = ({
	connectionMode,
	selectedDme,
	selectedPort,
	isVehicleConnected,
	availablePorts,
	availableParameters,
	selectedParameterKeys,
	serialPorts,
	isLoading,
	errorMessage,
	onBack,
	onConnectionModeChange,
	onDmeChange,
	onPortSelect,
	onConnect,
	onDisconnect,
	onStartLogging,
	onStopLogging,
	onToggleParameter,
	onRefresh,
	dmeProfiles,
	userName,
	currentPlan,
	softwareVersion,
	isLogging,
	totalBytesLogged,
	logLines,
	latestDecodedValues,
	lastDecodedTimestamp,
	protocolMode,
	recordedSampleCount,
	onExportCsv,
	elmSupportedParameterKeys,
}: DataloggingScreenProps) => {
	let sessionStatus = "Idle";
	if (isLogging) {
		sessionStatus = "Logging";
	} else if (isVehicleConnected) {
		sessionStatus = "Connected";
	}

	const protocolModeLabel = (() => {
		switch (protocolMode) {
			case "elm_obd":
				return "ELM decoded";
			case "elm+bmw":
				return "ELM + BMW";
			case "raw_fallback":
				return "Raw fallback";
			case "simulator":
				return "Simulator";
			case "elm_initializing":
				return "Initializing adapter";
			case "starting":
				return "Starting";
			default:
				return "Stopped";
		}
	})();

	return (
		<div className="space-y-6">
			<AppTopCards
				currentPlan={currentPlan}
				isSerialPortsLoading={isLoading}
				isVehicleConnected={isVehicleConnected}
				softwareVersion={softwareVersion}
				userName={userName}
			/>
			<div className="space-y-3">
				<Button onClick={onBack} type="button" variant="outline">
					Back
				</Button>
				<h1 className="font-semibold text-3xl tracking-tight">Datalogging</h1>
				<p className="text-muted-foreground text-sm">
					Select a detected cable port to begin live logging sessions.
				</p>
			</div>

			<Card className="border border-white/20 bg-black/30 backdrop-blur-sm">
				<CardContent className="flex items-center justify-between py-4">
					<div className="flex items-center gap-2">
						<Activity className="size-4 text-muted-foreground" />
						<span className="text-sm">Session status</span>
					</div>
					<Badge variant={isLogging ? "default" : "outline"}>
						{sessionStatus}
					</Badge>
				</CardContent>
			</Card>

			<Card className="border border-white/20 bg-black/30 text-left backdrop-blur-sm">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Plug className="size-4 text-muted-foreground" />
						<CardTitle className="text-base">Connection Setup</CardTitle>
					</div>
					<CardDescription>
						Choose mode, DME profile, and source port before starting logging.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Mode</Label>
						<div className="flex flex-wrap gap-2">
							<Button
								onClick={() => {
									onConnectionModeChange("simulator");
								}}
								type="button"
								variant={connectionMode === "simulator" ? "default" : "outline"}
							>
								Simulator
							</Button>
							<Button
								onClick={() => {
									onConnectionModeChange("hardware");
								}}
								type="button"
								variant={connectionMode === "hardware" ? "default" : "outline"}
							>
								Hardware
							</Button>
						</div>
					</div>

					<div className="space-y-2">
						<Label>DME Profile</Label>
						<div className="flex flex-wrap gap-2">
							{dmeProfiles.map((dme) => (
								<Button
									key={dme}
									onClick={() => {
										onDmeChange(dme);
									}}
									type="button"
									variant={selectedDme === dme ? "default" : "outline"}
								>
									{dme}
								</Button>
							))}
						</div>
						<p className="text-muted-foreground text-xs">
							Parameter availability is DME-specific, not universal.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button onClick={onRefresh} type="button" variant="outline">
							Scan Cables
						</Button>
						{isVehicleConnected ? (
							<Button
								onClick={onDisconnect}
								type="button"
								variant="destructive"
							>
								Disconnect
							</Button>
						) : (
							<Button
								disabled={selectedPort === null}
								onClick={onConnect}
								type="button"
							>
								Connect
							</Button>
						)}
						{isLogging ? (
							<Button
								onClick={onStopLogging}
								type="button"
								variant="destructive"
							>
								Stop Logging
							</Button>
						) : (
							<Button
								disabled={
									!isVehicleConnected || selectedParameterKeys.length === 0
								}
								onClick={onStartLogging}
								type="button"
							>
								Start Logging
							</Button>
						)}
						<Button
							disabled={recordedSampleCount === 0}
							onClick={onExportCsv}
							type="button"
							variant="outline"
						>
							Export CSV
						</Button>
					</div>

					<div className="flex items-center gap-2 text-sm">
						<Badge variant={isVehicleConnected ? "secondary" : "outline"}>
							{isVehicleConnected ? "Connected" : "Disconnected"}
						</Badge>
						<span className="text-muted-foreground">
							{selectedPort ?? "No port selected"}
						</span>
						<span className="text-muted-foreground">
							Bytes: {totalBytesLogged.toLocaleString()}
						</span>
						<span className="text-muted-foreground">
							Samples: {recordedSampleCount.toLocaleString()}
						</span>
						<Badge variant="outline">{protocolModeLabel}</Badge>
					</div>

					<div className="space-y-2">
						<Label>Available Ports</Label>
						{availablePorts.length > 0 && (
							<ul className="space-y-2">
								{availablePorts.map((port) => (
									<li
										className={`flex items-center justify-between rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm ${
											selectedPort === port.port_name
												? "border-primary ring-1 ring-ring"
												: ""
										}`}
										key={`${port.port_name}-${port.port_type}`}
									>
										<div>
											<div className="font-medium">{port.port_name}</div>
											<div className="text-muted-foreground text-xs">
												{port.port_type}
											</div>
										</div>
										<Button
											onClick={() => {
												onPortSelect(port.port_name);
											}}
											size="sm"
											type="button"
											variant={
												selectedPort === port.port_name
													? "secondary"
													: "outline"
											}
										>
											{selectedPort === port.port_name ? "Selected" : "Select"}
										</Button>
									</li>
								))}
							</ul>
						)}
					</div>

					{isLoading && (
						<p className="text-muted-foreground text-sm">
							Scanning serial ports...
						</p>
					)}
					{errorMessage !== null && (
						<p className="text-rose-300 text-sm">{errorMessage}</p>
					)}
					{!isLoading && errorMessage === null && serialPorts.length === 0 && (
						<p className="text-muted-foreground text-sm">
							No serial ports found.
						</p>
					)}
				</CardContent>
			</Card>

			<Card className="border border-white/20 bg-black/30 text-left backdrop-blur-sm">
				<CardHeader>
					<CardTitle className="text-base">Live Parameters</CardTitle>
					<CardDescription>
						Latest parsed values from active polling ({protocolModeLabel}).
					</CardDescription>
				</CardHeader>
				<CardContent>
					{Object.keys(latestDecodedValues).length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No decoded channels yet.
						</p>
					) : (
						<div className="space-y-3">
							<div className="grid gap-2 md:grid-cols-2">
								{Object.entries(latestDecodedValues).map(([key, value]) => (
									<div
										className="flex items-center justify-between rounded-md border border-white/15 bg-white/5 px-3 py-2"
										key={key}
									>
										<span className="text-muted-foreground text-xs uppercase">
											{key}
										</span>
										<span className="font-medium text-sm">{value.toFixed(3)}</span>
									</div>
								))}
							</div>
							{lastDecodedTimestamp !== null && (
								<p className="text-muted-foreground text-xs">
									Last sample: {new Date(lastDecodedTimestamp).toLocaleTimeString()}
								</p>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			<Card className="border border-white/20 bg-black/30 text-left backdrop-blur-sm">
				<CardHeader>
					<CardTitle className="text-base">Parameter Selection</CardTitle>
					<CardDescription>
						Choose which channels to log for {selectedDme}. Selected:{" "}
						{selectedParameterKeys.length}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid gap-3 md:grid-cols-2">
						{availableParameters.map((parameter) => {
							const isChecked = selectedParameterKeys.includes(parameter.key);
							return (
								<div
									className="flex items-start gap-3 rounded-md border border-white/15 bg-white/5 p-3"
									key={parameter.key}
								>
									<Checkbox
										checked={isChecked}
										id={parameter.key}
										onCheckedChange={() => {
											onToggleParameter(parameter.key);
										}}
									/>
									<div className="space-y-1">
										<Label className="font-medium" htmlFor={parameter.key}>
											<span>{parameter.label} ({parameter.unit})</span>
											{elmSupportedParameterKeys.has(parameter.key) ? (
												<Badge className="ml-2" variant="outline">ELM</Badge>
											) : (
												<Badge className="ml-2" variant="outline">
													BMW-specific
												</Badge>
											)}
										</Label>
										<p className="text-muted-foreground text-xs">
											{parameter.description}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</CardContent>
			</Card>

			<Card className="border border-white/20 bg-black/30 text-left backdrop-blur-sm">
				<CardHeader>
					<CardTitle className="text-base">Live Log Stream</CardTitle>
					<CardDescription>
						Raw incoming frames from the selected source. Use this to validate
						cable traffic.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="max-h-64 overflow-y-auto rounded-md border border-white/15 bg-black/40 p-3 font-mono text-xs leading-5">
						{logLines.length === 0 ? (
							<p className="text-muted-foreground">
								No frames yet. Start a logging session.
							</p>
						) : (
							<pre className="whitespace-pre-wrap">{logLines.join("\n")}</pre>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};
