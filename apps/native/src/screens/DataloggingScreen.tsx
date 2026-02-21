import { Gauge, Pulse, Scan, Wrench } from "@phosphor-icons/react";
import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Label } from "../components/ui/label";
import type { ConnectionMode, DmeProfile, LoggingParameter, SerialPortInfo } from "../types";

type ParameterViewMode = "all" | "simple" | "advanced" | "selected";

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
  isSavingLog: boolean;
  onSaveLog: () => void;
  onExportCsv: () => void;
};

const sessionStatusLabel = (isLogging: boolean, isVehicleConnected: boolean): string => {
  if (isLogging) {
    return "Logging";
  }

  if (isVehicleConnected) {
    return "Connected";
  }

  return "Waiting";
};

const protocolModeLabel = (protocolMode: string): string => {
  switch (protocolMode) {
    case "elm_obd":
      return "ELM decoded";
    case "elm+bmw":
      return "ELM + BMW";
    case "raw_fallback":
      return "Raw fallback";
    case "elm_initializing":
      return "Initializing";
    case "starting":
      return "Starting";
    default:
      return "Stopped";
  }
};

const SUGGESTED_PARAMETER_KEYS = new Set<string>([
  "time-ms",
  "engine-rpm",
  "throttle-position",
  "boost-actual",
  "map-kpa",
  "maf",
  "fuel-trim-stft-b1",
  "fuel-trim-ltft-b1",
  "fuel-trim-stft-b2",
  "fuel-trim-ltft-b2",
  "lpfp-pressure",
  "hpfp-pressure",
  "rail-pressure",
  "timing-avg",
  "iat",
  "coolant-temp",
  "vehicle-speed",
]);

const getParameterComplexityTag = (key: string): "Simple" | "Advanced" => {
  return SUGGESTED_PARAMETER_KEYS.has(key) ? "Simple" : "Advanced";
};

export const DataloggingScreen = ({
  selectedDme,
  isVehicleConnected,
  availableParameters,
  selectedParameterKeys,
  onBack,
  onStartLogging,
  onStopLogging,
  onToggleParameter,
  isLogging,
  logLines,
  latestDecodedValues,
  lastDecodedTimestamp,
  protocolMode,
  recordedSampleCount,
  isSavingLog,
  onSaveLog,
  onExportCsv,
}: DataloggingScreenProps) => {
  const status = sessionStatusLabel(isLogging, isVehicleConnected);
  const protocol = protocolModeLabel(protocolMode);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [parameterViewMode, setParameterViewMode] = useState<ParameterViewMode>("all");
  const availableParameterKeys = availableParameters.map((parameter) => parameter.key);
  const selectedAvailableKeys = selectedParameterKeys.filter((key) =>
    availableParameterKeys.includes(key),
  );
  const applySelection = (targetKeys: string[]): void => {
    const availableSet = new Set(availableParameterKeys);
    const targetSet = new Set(targetKeys.filter((key) => availableSet.has(key)));
    const selectedSet = new Set(selectedAvailableKeys);

    for (const key of availableParameterKeys) {
      const isSelected = selectedSet.has(key);
      const shouldSelect = targetSet.has(key);
      if (isSelected !== shouldSelect) {
        onToggleParameter(key);
      }
    }
  };

  const visibleParameters = availableParameters.filter((parameter) => {
    if (parameterViewMode === "all") {
      return true;
    }

    if (parameterViewMode === "simple") {
      return SUGGESTED_PARAMETER_KEYS.has(parameter.key);
    }

    if (parameterViewMode === "selected") {
      return selectedAvailableKeys.includes(parameter.key);
    }

    return !SUGGESTED_PARAMETER_KEYS.has(parameter.key);
  });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="font-semibold text-3xl tracking-tight">Datalogging</h1>
        <p className="text-muted-foreground text-sm">Live BMW data.</p>
      </div>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Session Snapshot</CardTitle>
            <Badge variant={isLogging ? "default" : "outline"}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2.5 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-white/60 text-xs">Vehicle</p>
            <p className="text-white/90">2011 BMW 335i</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-white/60 text-xs">DME</p>
            <p className="text-white/90">{selectedDme}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-white/60 text-xs">Connection</p>
            <p className={isVehicleConnected ? "text-primary" : "text-red-400"}>
              {isVehicleConnected ? "Connected" : "Disconnected"}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <p className="text-white/60 text-xs">Parameters</p>
            <p className="text-white/90">{selectedParameterKeys.length} selected</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Pulse className="h-4 w-4 text-primary" weight="bold" />
            <CardTitle>Logging Controls</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {isLogging ? (
              <Button onClick={onStopLogging} type="button" variant="destructive">
                Stop Logging
              </Button>
            ) : (
              <Button
                disabled={!isVehicleConnected || selectedParameterKeys.length === 0}
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
            <Button
              disabled={isLogging || recordedSampleCount === 0 || isSavingLog}
              onClick={onSaveLog}
              type="button"
              variant="secondary"
            >
              {isSavingLog ? "Saving..." : "Save Log"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={isVehicleConnected ? "secondary" : "outline"}>
              {isVehicleConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant="outline">{protocol}</Badge>
            <Badge variant="outline">Parameters: {selectedParameterKeys.length}</Badge>
          </div>

          <Button
            className="w-full"
            onClick={() => {
              setShowAdvanced((previous) => !previous);
            }}
            type="button"
            variant="outline"
          >
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" weight="bold" />
            <CardTitle>Parameter Selection</CardTitle>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-xl border border-white/12 bg-white/[0.03] p-1">
              <Button
                className="h-8 rounded-lg px-3 text-xs"
                onClick={() => {
                  setParameterViewMode("all");
                }}
                type="button"
                variant={parameterViewMode === "all" ? "default" : "ghost"}
              >
                All
              </Button>
              <Button
                className="h-8 rounded-lg px-3 text-xs"
                onClick={() => {
                  setParameterViewMode("simple");
                }}
                type="button"
                variant={parameterViewMode === "simple" ? "default" : "ghost"}
              >
                Simple
              </Button>
              <Button
                className="h-8 rounded-lg px-3 text-xs"
                onClick={() => {
                  setParameterViewMode("advanced");
                }}
                type="button"
                variant={parameterViewMode === "advanced" ? "default" : "ghost"}
              >
                Advanced
              </Button>
              <Button
                className="h-8 rounded-lg px-3 text-xs"
                onClick={() => {
                  setParameterViewMode("selected");
                }}
                type="button"
                variant={parameterViewMode === "selected" ? "default" : "ghost"}
              >
                Selected
              </Button>
            </div>
            <Badge variant="outline">{visibleParameters.length} shown</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => {
                applySelection(availableParameterKeys);
              }}
              type="button"
              variant="secondary"
            >
              Select All
            </Button>
            <Button
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => {
                applySelection([]);
              }}
              type="button"
              variant="outline"
            >
              Deselect All
            </Button>
            <Button
              className="h-8 rounded-lg px-3 text-xs"
              onClick={() => {
                applySelection(
                  availableParameters
                    .filter((parameter) => SUGGESTED_PARAMETER_KEYS.has(parameter.key))
                    .map((parameter) => parameter.key),
                );
              }}
              type="button"
              variant="default"
            >
              Suggested
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
            {visibleParameters.map((parameter) => {
              const isChecked = selectedParameterKeys.includes(parameter.key);
              const complexityTag = getParameterComplexityTag(parameter.key);
              return (
                <div
                  className="relative flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  key={parameter.key}
                >
                  <Badge
                    className={
                      complexityTag === "Advanced"
                        ? "absolute right-2 top-2 h-5 rounded-md border-amber-400/60 bg-amber-500/15 px-2 text-[10px] text-amber-200"
                        : "absolute right-2 top-2 h-5 rounded-md px-2 text-[10px]"
                    }
                    variant="outline"
                  >
                    {complexityTag}
                  </Badge>
                  <Checkbox
                    checked={isChecked}
                    id={parameter.key}
                    onCheckedChange={() => {
                      onToggleParameter(parameter.key);
                    }}
                  />
                  <div className="min-w-0 space-y-1 pr-16">
                    <Label className="font-medium text-white/90" htmlFor={parameter.key}>
                      {parameter.label} ({parameter.unit})
                    </Label>
                    <p className="text-white/60 text-xs">{parameter.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" weight="bold" />
            <CardTitle>Live Values</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {Object.keys(latestDecodedValues).length === 0 ? (
            <p className="text-sm text-white/65">No decoded channels yet.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(latestDecodedValues).map(([key, value]) => (
                  <div
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
                    key={key}
                  >
                    <p className="truncate text-white/60 text-xs uppercase">{key}</p>
                    <p className="font-medium text-sm text-white/90">{value.toFixed(3)}</p>
                  </div>
                ))}
              </div>
              {lastDecodedTimestamp !== null && (
                <p className="text-white/60 text-xs">
                  Last sample: {new Date(lastDecodedTimestamp).toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showAdvanced && (
        <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Scan className="h-4 w-4 text-primary" weight="bold" />
              <CardTitle>Live Log Stream</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-black/35 p-3 font-mono text-xs leading-5 text-white/85">
              {logLines.length === 0 ? (
                <p className="text-white/60">No frames yet. Start a logging session.</p>
              ) : (
                <pre className="whitespace-pre-wrap">{logLines.join("\n")}</pre>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
