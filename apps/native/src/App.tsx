import { invoke } from "@tauri-apps/api/core";
import {
  ChartLineUp,
  Code,
  Gauge,
  Garage,
  PlugsConnected,
  Pulse,
  Scan,
  Wrench,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import splashBackground from "@/assets/splash-bg.png";
import { Logo } from "@/components/logo";
import { Button } from "./components/ui/button";
import { authClient } from "./lib/auth-client";
import { convexMutation } from "./lib/convex-client";
import { DataloggingScreen } from "./screens/DataloggingScreen";
import { DatalogViewerScreen } from "./screens/DatalogViewerScreen";
import { FlashTuneScreen } from "./screens/FlashTuneScreen";
import { GaugesScreen } from "./screens/GaugesScreen";
import { LoginScreen } from "./screens/LoginScreen";
import { ReadCodesScreen } from "./screens/ReadCodesScreen";
import { SignUpScreen } from "./screens/SignUpScreen";
import type {
  ConnectionMode,
  DecodedSample,
  DatalogPollUpdate,
  DmeProfile,
  DtcFilter,
  DtcRecord,
  FeatureScreen,
  GaugeMetric,
  LoggingParameter,
  SerialPortInfo,
} from "./types";

const SOFTWARE_VERSION = "0.1.0";
const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL ?? "http://localhost:3001";

const SIMULATOR_PORTS: SerialPortInfo[] = [
  { port_name: "SIM-N55-001", port_type: "simulator" },
  { port_name: "SIM-N55-002", port_type: "simulator" },
];

const DME_PROFILES: DmeProfile[] = ["MEVD17.2", "MEVD17.2.G", "MSD80/81"];
const K_DCAN_PORT_PATTERNS: RegExp[] = [
  /usbserial/i,
  /wchusbserial/i,
  /slab_usbto_uart/i,
  /ftdi/i,
  /ch34/i,
  /cu\.usb/i,
  /tty\.usb/i,
];

const PARAMETER_CATALOG: Record<DmeProfile, LoggingParameter[]> = {
  "MEVD17.2": [
    { key: "time-ms", label: "Time", unit: "ms", description: "Sample timestamp in milliseconds." },
    { key: "engine-rpm", label: "Engine RPM", unit: "rpm", description: "Current engine speed." },
    { key: "throttle-position", label: "Throttle Position", unit: "%", description: "Throttle plate angle percentage." },
    { key: "engine-load", label: "Engine Load", unit: "%", description: "Calculated engine load." },
    { key: "vehicle-speed", label: "Vehicle Speed", unit: "km/h", description: "Current road speed." },
    { key: "boost-actual", label: "Boost Actual", unit: "psi", description: "Measured manifold boost pressure." },
    { key: "boost-target", label: "Boost Target", unit: "psi", description: "Requested boost target from DME." },
    { key: "map-kpa", label: "MAP", unit: "kPa", description: "Manifold absolute pressure raw." },
    { key: "timing-avg", label: "Ignition Timing Avg", unit: "°", description: "Average ignition timing across cylinders." },
    { key: "maf", label: "MAF", unit: "g/s", description: "Mass airflow sensor reading." },
    { key: "knock-retard-max", label: "Knock Retard Max", unit: "°", description: "Maximum knock correction observed." },
    { key: "afr-bank1", label: "AFR Bank 1", unit: "λ", description: "Lambda reading for bank 1." },
    { key: "fuel-trim-stft-b1", label: "STFT Bank 1", unit: "%", description: "Short-term fuel trim bank 1." },
    { key: "fuel-trim-ltft-b1", label: "LTFT Bank 1", unit: "%", description: "Long-term fuel trim bank 1." },
    { key: "iat", label: "Intake Air Temp", unit: "°C", description: "Temperature at intake manifold." },
    { key: "oil-temp", label: "Oil Temp", unit: "°C", description: "Engine oil temperature." },
    { key: "coolant-temp", label: "Coolant Temp", unit: "°C", description: "Engine coolant temperature." },
    { key: "lpfp-pressure", label: "LPFP Pressure", unit: "kPa", description: "Low-pressure fuel supply." },
    { key: "rail-pressure", label: "Rail Pressure", unit: "kPa", description: "Fuel rail pressure (if supported)." },
    { key: "hpfp-pressure", label: "HPFP Pressure", unit: "kPa", description: "High-pressure fuel pump rail pressure." },
    { key: "fuel-level", label: "Fuel Level", unit: "%", description: "Fuel tank level." },
  ],
  "MEVD17.2.G": [
    { key: "time-ms", label: "Time", unit: "ms", description: "Sample timestamp in milliseconds." },
    { key: "engine-rpm", label: "Engine RPM", unit: "rpm", description: "Current engine speed." },
    { key: "throttle-position", label: "Throttle Position", unit: "%", description: "Throttle plate angle percentage." },
    { key: "engine-load", label: "Engine Load", unit: "%", description: "Calculated engine load." },
    { key: "vehicle-speed", label: "Vehicle Speed", unit: "km/h", description: "Current road speed." },
    { key: "boost-actual", label: "Boost Actual", unit: "psi", description: "Measured manifold boost pressure." },
    { key: "boost-target", label: "Boost Target", unit: "psi", description: "Requested boost target from DME." },
    { key: "map-kpa", label: "MAP", unit: "kPa", description: "Manifold absolute pressure raw." },
    { key: "timing-avg", label: "Ignition Timing Avg", unit: "°", description: "Average ignition timing across cylinders." },
    { key: "maf", label: "MAF", unit: "g/s", description: "Mass airflow sensor reading." },
    { key: "knock-retard-max", label: "Knock Retard Max", unit: "°", description: "Maximum knock correction observed." },
    { key: "afr-bank1", label: "AFR Bank 1", unit: "λ", description: "Lambda reading for bank 1." },
    { key: "afr-bank2", label: "AFR Bank 2", unit: "λ", description: "Lambda reading for bank 2." },
    { key: "fuel-trim-stft-b1", label: "STFT Bank 1", unit: "%", description: "Short-term fuel trim bank 1." },
    { key: "fuel-trim-ltft-b1", label: "LTFT Bank 1", unit: "%", description: "Long-term fuel trim bank 1." },
    { key: "fuel-trim-stft-b2", label: "STFT Bank 2", unit: "%", description: "Short-term fuel trim bank 2." },
    { key: "fuel-trim-ltft-b2", label: "LTFT Bank 2", unit: "%", description: "Long-term fuel trim bank 2." },
    { key: "lpfp-pressure", label: "LPFP Pressure", unit: "kPa", description: "Low-pressure fuel supply." },
    { key: "rail-pressure", label: "Rail Pressure", unit: "kPa", description: "Fuel rail pressure (if supported)." },
    { key: "hpfp-pressure", label: "HPFP Pressure", unit: "kPa", description: "High-pressure fuel pump rail pressure." },
    { key: "fuel-level", label: "Fuel Level", unit: "%", description: "Fuel tank level." },
  ],
  "MSD80/81": [
    { key: "time-ms", label: "Time", unit: "ms", description: "Sample timestamp in milliseconds." },
    { key: "engine-rpm", label: "Engine RPM", unit: "rpm", description: "Current engine speed." },
    { key: "throttle-position", label: "Throttle Position", unit: "%", description: "Throttle plate angle percentage." },
    { key: "engine-load", label: "Engine Load", unit: "%", description: "Calculated engine load." },
    { key: "vehicle-speed", label: "Vehicle Speed", unit: "km/h", description: "Current road speed." },
    { key: "boost-actual", label: "Boost Actual", unit: "psi", description: "Measured manifold boost pressure." },
    { key: "timing-avg", label: "Ignition Timing Avg", unit: "°", description: "Average ignition timing across cylinders." },
    { key: "maf", label: "MAF", unit: "g/s", description: "Mass airflow sensor reading." },
    { key: "knock-retard-max", label: "Knock Retard Max", unit: "°", description: "Maximum knock correction observed." },
    { key: "afr-bank1", label: "AFR Bank 1", unit: "λ", description: "Lambda reading for bank 1." },
    { key: "afr-bank2", label: "AFR Bank 2", unit: "λ", description: "Lambda reading for bank 2." },
    { key: "fuel-trim-stft-b1", label: "STFT Bank 1", unit: "%", description: "Short-term fuel trim bank 1." },
    { key: "fuel-trim-ltft-b1", label: "LTFT Bank 1", unit: "%", description: "Long-term fuel trim bank 1." },
    { key: "fuel-trim-stft-b2", label: "STFT Bank 2", unit: "%", description: "Short-term fuel trim bank 2." },
    { key: "fuel-trim-ltft-b2", label: "LTFT Bank 2", unit: "%", description: "Long-term fuel trim bank 2." },
    { key: "iat", label: "Intake Air Temp", unit: "°C", description: "Temperature at intake manifold." },
    { key: "oil-temp", label: "Oil Temp", unit: "°C", description: "Engine oil temperature." },
    { key: "coolant-temp", label: "Coolant Temp", unit: "°C", description: "Engine coolant temperature." },
    { key: "lpfp-pressure", label: "LPFP Pressure", unit: "kPa", description: "Low-pressure fuel supply." },
    { key: "rail-pressure", label: "Rail Pressure", unit: "kPa", description: "Fuel rail pressure (if supported)." },
    { key: "hpfp-pressure", label: "HPFP Pressure", unit: "kPa", description: "High-pressure fuel pump rail pressure." },
    { key: "fuel-level", label: "Fuel Level", unit: "%", description: "Fuel tank level." },
  ],
};

const DEFAULT_SELECTED_PARAMETER_KEYS: Record<DmeProfile, string[]> = {
  "MEVD17.2": [
    "time-ms",
    "engine-rpm",
    "throttle-position",
    "fuel-trim-stft-b1",
    "fuel-trim-ltft-b1",
    "fuel-trim-stft-b2",
    "fuel-trim-ltft-b2",
    "lpfp-pressure",
    "hpfp-pressure",
    "rail-pressure",
    "maf",
    "map-kpa",
    "boost-actual",
    "timing-avg",
    "iat",
    "coolant-temp",
    "vehicle-speed",
  ],
  "MEVD17.2.G": [
    "time-ms",
    "engine-rpm",
    "throttle-position",
    "fuel-trim-stft-b1",
    "fuel-trim-ltft-b1",
    "fuel-trim-stft-b2",
    "fuel-trim-ltft-b2",
    "lpfp-pressure",
    "hpfp-pressure",
    "rail-pressure",
    "maf",
    "map-kpa",
    "boost-actual",
    "timing-avg",
    "iat",
    "coolant-temp",
    "vehicle-speed",
  ],
  "MSD80/81": [
    "time-ms",
    "engine-rpm",
    "throttle-position",
    "fuel-trim-stft-b1",
    "fuel-trim-ltft-b1",
    "fuel-trim-stft-b2",
    "fuel-trim-ltft-b2",
    "lpfp-pressure",
    "hpfp-pressure",
    "rail-pressure",
    "maf",
    "map-kpa",
    "boost-actual",
    "timing-avg",
    "iat",
    "coolant-temp",
    "vehicle-speed",
  ],
};

const isLikelyKdcanPort = (portName: string): boolean => {
  return K_DCAN_PORT_PATTERNS.some((pattern) => pattern.test(portName));
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const INITIAL_GAUGE_METRICS: GaugeMetric[] = [
  { key: "boost", label: "Boost", unit: "psi", value: 12.8, min: -15, max: 28, precision: 1, warnHigh: 24 },
  { key: "afr", label: "AFR", unit: "λ", value: 0.84, min: 0.7, max: 1.2, precision: 2, warnLow: 0.75, warnHigh: 1.05 },
  { key: "timing", label: "Timing", unit: "°", value: 8.5, min: -5, max: 20, precision: 1, warnLow: 0 },
  { key: "iat", label: "IAT", unit: "°C", value: 41, min: 0, max: 90, precision: 0, warnHigh: 65 },
  { key: "oil-temp", label: "Oil Temp", unit: "°C", value: 96, min: 40, max: 140, precision: 0, warnHigh: 125 },
  { key: "coolant-temp", label: "Coolant Temp", unit: "°C", value: 88, min: 50, max: 120, precision: 0, warnHigh: 110 },
];

const getActiveScreen = (pathname: string): FeatureScreen => {
  if (pathname === "/datalogging") {
    return "datalogging";
  }

  if (pathname === "/datalog-viewer") {
    return "datalog-viewer";
  }

  if (pathname === "/read-codes") {
    return "read-codes";
  }

  if (pathname === "/flash-tune") {
    return "flash-tune";
  }

  if (pathname === "/gauges") {
    return "gauges";
  }

  return "home";
};

const getAuthCallbackUrl = (): string => {
  const origin = globalThis.location?.origin;
  if (typeof origin === "string" && origin.length > 0) {
    return `${origin}/#/`;
  }

  return "http://localhost:1420/#/";
};

export const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("simulator");
  const [selectedDme, setSelectedDme] = useState<DmeProfile>("MEVD17.2");
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [isVehicleConnected, setIsVehicleConnected] = useState<boolean>(false);
  const [selectedParameterKeys, setSelectedParameterKeys] = useState<string[]>(
    DEFAULT_SELECTED_PARAMETER_KEYS["MEVD17.2"],
  );
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [liveLogLines, setLiveLogLines] = useState<string[]>([]);
  const [totalLoggedBytes, setTotalLoggedBytes] = useState<number>(0);
  const [latestDecodedValues, setLatestDecodedValues] = useState<Record<string, number>>({});
  const [lastDecodedTimestamp, setLastDecodedTimestamp] = useState<number | null>(null);
  const [protocolMode, setProtocolMode] = useState<string>("stopped");
  const [recordedSamples, setRecordedSamples] = useState<DecodedSample[]>([]);
  const [currentLogStartedAtMs, setCurrentLogStartedAtMs] = useState<number | null>(null);
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false);
  const [serialPorts, setSerialPorts] = useState<SerialPortInfo[]>([]);
  const [isSerialPortsLoading, setIsSerialPortsLoading] = useState<boolean>(true);
  const [serialPortErrorMessage, setSerialPortErrorMessage] = useState<string | null>(null);
  const [gaugeMetrics, setGaugeMetrics] = useState<GaugeMetric[]>(INITIAL_GAUGE_METRICS);
  const [dtcRecords, setDtcRecords] = useState<DtcRecord[]>([]);
  const [dtcFilter, setDtcFilter] = useState<DtcFilter>("all");
  const [isDtcLoading, setIsDtcLoading] = useState<boolean>(false);
  const [isDtcClearing, setIsDtcClearing] = useState<boolean>(false);
  const [dtcErrorMessage, setDtcErrorMessage] = useState<string | null>(null);

  const activeScreen = getActiveScreen(location.pathname);
  const authCallbackUrl = getAuthCallbackUrl();
  const forceConnectedUi = true;
  const displayVehicleConnected = forceConnectedUi || isVehicleConnected;
  const glassShellTitle =
    location.pathname === "/datalogging"
      ? "Datalogging"
      : location.pathname === "/datalog-viewer"
        ? "Datalog Viewer"
      : location.pathname === "/flash-tune"
        ? "Flashing"
      : location.pathname === "/read-codes"
        ? "Read Codes"
      : location.pathname === "/gauges"
        ? "Gauges"
      : "Home";
  const loadSerialPorts = async (): Promise<void> => {
    setIsSerialPortsLoading(true);
    setSerialPortErrorMessage(null);

    try {
      if (connectionMode === "simulator") {
        setSerialPorts(SIMULATOR_PORTS);
        setIsSerialPortsLoading(false);
        return;
      }

      const data = await invoke<SerialPortInfo[]>("list_serial_ports");
      setSerialPorts(data);
    } catch {
      setSerialPortErrorMessage("Failed to load serial ports from Tauri backend.");
    } finally {
      setIsSerialPortsLoading(false);
    }
  };

  const stopLoggingSession = async (): Promise<void> => {
    try {
      await invoke<boolean>("stop_datalogging");
    } catch {
      // best effort stop
    } finally {
      setIsLogging(false);
    }
  };

  const buildRecordedCsv = (): {
    csv: string;
    headers: string[];
  } | null => {
    if (recordedSamples.length === 0) {
      toast.error("No decoded samples to export yet.");
      return null;
    }

    const headers = Array.from(
      recordedSamples.reduce<Set<string>>((accumulator, sample) => {
        for (const key of Object.keys(sample.values)) {
          accumulator.add(key);
        }
        return accumulator;
      }, new Set<string>()),
    );
    if (headers.length === 0) {
      toast.error("No decoded parameter values found in session.");
      return null;
    }

    const csvHeaders = ["timestamp_ms", ...headers];
    const rows = recordedSamples.map((sample) => {
      const cells = [sample.timestamp_ms.toString()];
      for (const header of headers) {
        const value = sample.values[header];
        cells.push(typeof value === "number" ? value.toString() : "");
      }
      return cells.join(",");
    });
    const csv = [csvHeaders.join(","), ...rows].join("\n");
    return { csv, headers };
  };

  const exportRecordedCsv = (): void => {
    const csvPayload = buildRecordedCsv();
    if (csvPayload === null) {
      return;
    }

    const { csv } = csvPayload;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replaceAll(":", "-");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hofwerks_datalog_${timestamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("CSV export generated.");
  };

  const saveRecordedLog = async (): Promise<void> => {
    const csvPayload = buildRecordedCsv();
    if (csvPayload === null) {
      return;
    }

    setIsSavingLog(true);
    try {
      const { csv } = csvPayload;
      const endedAtMs = lastDecodedTimestamp ?? Date.now();
      const startedAtMs = currentLogStartedAtMs ?? endedAtMs;
      const durationMs = Math.max(0, endedAtMs - startedAtMs);
      const createdIso = new Date().toISOString();
      const fileSafeTimestamp = createdIso.replaceAll(":", "-");
      const fileName = `hofwerks_datalog_${fileSafeTimestamp}.csv`;
      const csvBlob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const csvByteLength = new TextEncoder().encode(csv).length;

      const uploadUrlResult = await convexMutation<
        Record<string, never>,
        { uploadUrl: string }
      >("logs:generateLogUploadUrl", {});

      const uploadResponse = await fetch(uploadUrlResult.uploadUrl, {
        body: csvBlob,
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
        },
        method: "POST",
      });
      if (!uploadResponse.ok) {
        throw new Error("Failed to upload datalog CSV.");
      }

      const uploadBody = (await uploadResponse.json()) as { storageId?: string };
      if (typeof uploadBody.storageId !== "string" || uploadBody.storageId.length === 0) {
        throw new Error("Upload completed without storage ID.");
      }

      await convexMutation("logs:saveLogMetadata", {
        connectionMode,
        csvByteLength,
        dmeProfile: selectedDme,
        durationMs,
        endedAtMs,
        fileName,
        parameterKeys: selectedParameterKeys,
        sampleCount: recordedSamples.length,
        startedAtMs,
        storageId: uploadBody.storageId,
        totalBytes: totalLoggedBytes,
      });
      toast.success("Log saved to account.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save log.";
      toast.error(message);
    } finally {
      setIsSavingLog(false);
    }
  };

  const toggleParameter = (parameterKey: string): void => {
    setSelectedParameterKeys((previous) => {
      if (previous.includes(parameterKey)) {
        return previous.filter((key) => key !== parameterKey);
      }

      return [...previous, parameterKey];
    });
  };

  const refreshGauges = (): void => {
    setGaugeMetrics((previous) =>
      previous.map((metric) => {
        const maxDeltaByMetric: Record<GaugeMetric["key"], number> = {
          boost: 1.6,
          afr: 0.03,
          timing: 0.9,
          iat: 2.5,
          "oil-temp": 1.5,
          "coolant-temp": 1.1,
        };

        const maxDelta = maxDeltaByMetric[metric.key];
        const rawNextValue = metric.value + (Math.random() * 2 - 1) * maxDelta;
        return {
          ...metric,
          value: clamp(rawNextValue, metric.min, metric.max),
        };
      }),
    );
  };

  const loadDtcs = async (): Promise<void> => {
    setIsDtcLoading(true);
    setDtcErrorMessage(null);

    try {
      const records = await invoke<DtcRecord[]>("read_dtcs");
      setDtcRecords(records);
    } catch {
      setDtcErrorMessage("Failed to read DTCs from Tauri backend.");
    } finally {
      setIsDtcLoading(false);
    }
  };

  const clearDtcs = async (): Promise<void> => {
    setIsDtcClearing(true);
    setDtcErrorMessage(null);

    try {
      await invoke<boolean>("clear_dtcs");
      setDtcRecords([]);
      void loadDtcs();
    } catch {
      setDtcErrorMessage("Failed to clear DTCs.");
    } finally {
      setIsDtcClearing(false);
    }
  };

  useEffect(() => {
    void loadSerialPorts();
  }, [connectionMode]);

  useEffect(() => {
    if (activeScreen === "datalogging") {
      void loadSerialPorts();
    }
  }, [activeScreen, connectionMode]);

  useEffect(() => {
    if (activeScreen === "read-codes") {
      void loadDtcs();
    }
  }, [activeScreen]);

  useEffect(() => {
    if (activeScreen !== "gauges") {
      return;
    }

    const intervalId = setInterval(() => {
      refreshGauges();
    }, 1500);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeScreen]);

  useEffect(() => {
    const availableKeys = PARAMETER_CATALOG[selectedDme].map((parameter) => parameter.key);
    setSelectedParameterKeys((previous) => {
      const filteredKeys = previous.filter((key) => availableKeys.includes(key));
      if (filteredKeys.length > 0) {
        return filteredKeys;
      }

      return DEFAULT_SELECTED_PARAMETER_KEYS[selectedDme].filter((key) =>
        availableKeys.includes(key),
      );
    });
  }, [selectedDme]);

  const kdcanPorts = serialPorts.filter((port) => isLikelyKdcanPort(port.port_name));
  const availablePorts = connectionMode === "simulator" ? serialPorts : kdcanPorts;
  const availableParameters = PARAMETER_CATALOG[selectedDme];
  const userName =
    typeof session?.user?.name === "string" && session.user.name.length > 0
      ? session.user.name
      : "Driver";
  const currentPlan = "Free";
  const accountEmail =
    typeof session?.user?.email === "string" ? session.user.email : "Not available";
  const memberSinceRaw = (session?.user as { createdAt?: unknown } | undefined)?.createdAt;
  const memberSince =
    typeof memberSinceRaw === "string" || typeof memberSinceRaw === "number"
      ? new Date(memberSinceRaw).toLocaleDateString()
      : "Not available";

  useEffect(() => {
    if (selectedPort === null) {
      return;
    }

    const portStillExists = availablePorts.some((port) => port.port_name === selectedPort);
    if (!portStillExists) {
      setSelectedPort(null);
      setIsVehicleConnected(false);
    }
  }, [availablePorts, selectedPort]);

  useEffect(() => {
    if (!isLogging) {
      return;
    }

    const intervalId = setInterval(() => {
      void invoke<DatalogPollUpdate>("poll_datalog_updates", { maxLines: 300 })
        .then((update) => {
          setTotalLoggedBytes(update.total_bytes);
          setProtocolMode(update.protocol_mode);
          if (update.last_error) {
            toast.error(update.last_error);
            void stopLoggingSession();
          }
          if (update.lines.length > 0) {
            setLiveLogLines((previous) => {
              const next = [...previous, ...update.lines];
              if (next.length > 1000) {
                return next.slice(next.length - 1000);
              }
              return next;
            });
          }
          if (update.decoded_samples.length > 0) {
            setRecordedSamples((previous) => {
              const next = [...previous, ...update.decoded_samples];
              if (next.length > 20_000) {
                return next.slice(next.length - 20_000);
              }
              return next;
            });
            const latest = update.decoded_samples.at(-1);
            if (latest) {
              setLatestDecodedValues(latest.values);
              setLastDecodedTimestamp(Number(latest.timestamp_ms));
            }
          }
        })
        .catch(() => {
          toast.error("Failed to poll datalog stream.");
          void stopLoggingSession();
        });
    }, 300);

    return () => {
      clearInterval(intervalId);
    };
  }, [isLogging]);

  useEffect(() => {
    return () => {
      void stopLoggingSession();
    };
  }, []);

  const handleSignIn = async (email: string, password: string): Promise<void> => {
    const result = await authClient.signIn.email({
      email,
      password,
      callbackURL: authCallbackUrl,
    });
    if (result?.error) {
      throw new Error(result.error.message ?? result.error.statusText ?? "Failed to login.");
    }

    const authClientWithUpdates = authClient as { updateSession?: () => void };
    authClientWithUpdates.updateSession?.();

    navigate("/");
    toast.success("Logged in successfully");
  };

  const handleSignUp = async (
    name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    const result = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: authCallbackUrl,
    });
    if (result?.error) {
      throw new Error(
        result.error.message ?? result.error.statusText ?? "Failed to create account.",
      );
    }

    const authClientWithUpdates = authClient as { updateSession?: () => void };
    authClientWithUpdates.updateSession?.();

    navigate("/");
    toast.success("Account created successfully");
  };

  const handleViewAccount = (): void => {
    globalThis.open(WEB_APP_URL, "_blank", "noopener,noreferrer");
  };

  const handleLogout = async (): Promise<void> => {
    const result = await authClient.signOut();
    if (result?.error) {
      toast.error(result.error.message ?? result.error.statusText ?? "Failed to logout.");
      return;
    }

    navigate("/login");
    toast.success("Logged out");
  };

  const handleOpenCoding = (): void => {
    globalThis.open(`${WEB_APP_URL}/coding`, "_blank", "noopener,noreferrer");
  };

  if (isSessionPending) {
    return (
      <main className="from-background via-background to-muted/40 min-h-screen bg-gradient-to-br">
        <section className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-6 py-10">
          <p className="text-muted-foreground text-sm">Checking session...</p>
        </section>
      </main>
    );
  }

  if (session === null || session === undefined) {
    if (location.pathname !== "/login" && location.pathname !== "/signup") {
      return <Navigate replace to="/login" />;
    }

    if (location.pathname === "/signup") {
      return (
        <SignUpScreen
          onSubmit={handleSignUp}
          onSwitchToLogin={() => {
            navigate("/login");
          }}
        />
      );
    }

    return (
      <LoginScreen
        onSubmit={handleSignIn}
        onSwitchToSignUp={() => {
          navigate("/signup");
        }}
      />
    );
  }

  if (location.pathname === "/login" || location.pathname === "/signup") {
    return <Navigate replace to="/" />;
  }

  return (
    <main className="relative h-svh w-full overflow-x-hidden overflow-y-auto bg-background text-foreground">
      <div
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${splashBackground})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
        }}
      />
      <div className="fixed inset-0 z-0 bg-background/45" />
      <header className="fixed inset-x-0 top-0 z-30 bg-transparent">
        <div className="px-4 pb-2 pt-2">
          <div className="relative mx-auto flex h-12 items-center justify-center rounded-2xl border border-white/12 bg-black/18 px-4 backdrop-blur-2xl">
            <div className="absolute left-4 flex items-center">
              <Logo className="h-7 w-7" />
            </div>
            <div className="absolute right-4 flex items-center gap-2">
              <PlugsConnected
                aria-label={displayVehicleConnected ? "Connected" : "Disconnected"}
                className={
                  displayVehicleConnected
                    ? "h-4 w-4 text-primary drop-shadow-[0_0_8px_rgba(133,255,96,0.75)]"
                    : "h-4 w-4 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.75)]"
                }
                weight="bold"
              />
              <Button
                aria-label="Garage"
                className="h-8 w-8 rounded-full border border-white/20 p-0"
                onClick={handleViewAccount}
                type="button"
                variant="ghost"
              >
                <Garage className="h-4.5 w-4.5" weight="regular" />
              </Button>
            </div>
            <h1 className="absolute inset-x-0 text-center font-semibold text-xl tracking-tight">
              {glassShellTitle}
            </h1>
          </div>
        </div>
      </header>
      <div style={{ height: "64px" }} />
      <section className="relative z-10 px-5 pb-8 pt-4">
        {location.pathname === "/" && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="relative flex h-full flex-col rounded-2xl border border-white/12 bg-black/18 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                <p className="font-semibold text-base">Hello, {userName}</p>
                <div className="mt-2 space-y-1">
                  <h2 className="font-semibold text-2xl tracking-tight">2011 BMW 335i</h2>
                  <p className="truncate text-muted-foreground text-sm">
                    N55 • 3.0L TwinPower Turbo • Auto • RWD
                  </p>
                </div>
                <div className="mt-auto space-y-2 pt-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1">
                    <PlugsConnected
                      className={
                        displayVehicleConnected
                          ? "h-3 w-3 text-primary drop-shadow-[0_0_8px_rgba(133,255,96,0.75)]"
                          : "h-3 w-3 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.75)]"
                      }
                      weight="bold"
                    />
                    <span className="text-white/75">Status</span>
                    </span>
                    <span
                      className={
                        displayVehicleConnected
                          ? "font-medium text-primary"
                          : "font-medium text-red-400"
                      }
                    >
                      {displayVehicleConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-white/90">Map Stage 2</span>
                    <span className="font-mono text-[11px] text-white/90">VIN WBAKG7C58BE264073</span>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-black/18 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-base">Account Overview</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      className="h-7 rounded-full px-2.5 text-[10px]"
                      onClick={handleViewAccount}
                      type="button"
                      variant="default"
                    >
                      Manage Account
                    </Button>
                    <Button
                      className="h-7 rounded-full border-red-400/35 px-2.5 text-[10px] text-red-100 hover:bg-red-500/20"
                      onClick={() => {
                        handleLogout().catch(() => {
                          toast.error("Failed to logout.");
                        });
                      }}
                      type="button"
                      variant="outline"
                    >
                      Logout
                    </Button>
                  </div>
                </div>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-white/65">Email</span>
                    <span className="text-white/90">{accountEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/65">Plan</span>
                    <span className="text-white/90">{currentPlan}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/65">App Version</span>
                    <span className="text-white/90">v{SOFTWARE_VERSION}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white/65">Member Since</span>
                    <span className="text-white/90">{memberSince}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                className="rounded-2xl border border-white/12 bg-black/18 p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-black/24"
                onClick={() => {
                  navigate("/datalogging");
                }}
                type="button"
              >
                <Pulse className="mb-2 h-4 w-4 text-primary" weight="bold" />
                <p className="font-semibold text-sm">Datalogging</p>
                <p className="mt-1 text-white/65 text-xs">Live BMW data + logs</p>
              </button>
              <button
                className="rounded-2xl border border-white/12 bg-black/18 p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-black/24"
                onClick={() => {
                  navigate("/flash-tune");
                }}
                type="button"
              >
                <Wrench className="mb-2 h-4 w-4 text-primary" weight="bold" />
                <p className="font-semibold text-sm">Flashing</p>
                <p className="mt-1 text-white/65 text-xs">Map and tune management</p>
              </button>
              <button
                className="rounded-2xl border border-white/12 bg-black/18 p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-black/24"
                onClick={() => {
                  navigate("/read-codes");
                }}
                type="button"
              >
                <Scan className="mb-2 h-4 w-4 text-primary" weight="bold" />
                <p className="font-semibold text-sm">Read Codes</p>
                <p className="mt-1 text-white/65 text-xs">Scan and clear diagnostics</p>
              </button>
              <button
                className="rounded-2xl border border-white/12 bg-black/18 p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-black/24"
                onClick={() => {
                  navigate("/gauges");
                }}
                type="button"
              >
                <Gauge className="mb-2 h-4 w-4 text-primary" weight="bold" />
                <p className="font-semibold text-sm">Gauges</p>
                <p className="mt-1 text-white/65 text-xs">Real-time dashboard view</p>
              </button>
              <button
                className="rounded-2xl border border-white/12 bg-black/18 p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-black/24"
                onClick={() => {
                  navigate("/datalog-viewer");
                }}
                type="button"
              >
                <ChartLineUp className="mb-2 h-4 w-4 text-primary" weight="bold" />
                <p className="font-semibold text-sm">Datalog Viewer</p>
                <p className="mt-1 text-white/65 text-xs">Graph and review saved runs</p>
              </button>
              <button
                className="rounded-2xl border border-white/12 bg-black/18 p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-black/24"
                onClick={handleOpenCoding}
                type="button"
              >
                <Code className="mb-2 h-4 w-4 text-primary" weight="bold" />
                <p className="font-semibold text-sm">Coding</p>
                <p className="mt-1 text-white/65 text-xs">Customize modules and vehicle options</p>
              </button>
            </div>
          </>
        )}

        {activeScreen === "datalogging" && (
          <DataloggingScreen
            availableParameters={availableParameters}
            availablePorts={availablePorts}
            connectionMode={connectionMode}
            currentPlan={currentPlan}
            dmeProfiles={DME_PROFILES}
            errorMessage={serialPortErrorMessage}
            isLoading={isSerialPortsLoading}
            isVehicleConnected={isVehicleConnected}
            onBack={() => {
              navigate("/");
            }}
            onConnect={() => {
              if (selectedPort === null) {
                return;
              }

              const connect = async (): Promise<void> => {
                if (connectionMode === "simulator") {
                  setIsVehicleConnected(true);
                  return;
                }

                try {
                  await invoke<boolean>("verify_serial_port", {
                    portName: selectedPort,
                    baudRate: 115200,
                  });
                  setIsVehicleConnected(true);
                  toast.success("Cable connected.");
                } catch {
                  setIsVehicleConnected(false);
                  toast.error("Failed to open selected cable port.");
                }
              };

              void connect();
            }}
            onConnectionModeChange={(mode) => {
              void stopLoggingSession();
              setConnectionMode(mode);
              setSelectedPort(null);
              setIsVehicleConnected(false);
              setLiveLogLines([]);
              setTotalLoggedBytes(0);
              setLatestDecodedValues({});
              setLastDecodedTimestamp(null);
              setProtocolMode("stopped");
              setRecordedSamples([]);
            }}
            onDisconnect={() => {
              void stopLoggingSession();
              setIsVehicleConnected(false);
              setProtocolMode("stopped");
              setRecordedSamples([]);
            }}
            onDmeChange={(dme) => {
              setSelectedDme(dme);
            }}
            onPortSelect={(portName) => {
              setSelectedPort(portName);
            }}
            onRefresh={() => {
              void loadSerialPorts();
            }}
            onStartLogging={() => {
              if (!isVehicleConnected) {
                toast.error("Connect to a cable before starting logging.");
                return;
              }

              const start = async (): Promise<void> => {
                try {
                  await invoke<boolean>("start_datalogging", {
                    connectionMode,
                    portName: connectionMode === "hardware" ? selectedPort : null,
                    baudRate: 115200,
                    selectedParameterKeys,
                  });
                  setLiveLogLines([]);
                  setTotalLoggedBytes(0);
                  setLatestDecodedValues({});
                  setLastDecodedTimestamp(null);
                  setProtocolMode("starting");
                  setRecordedSamples([]);
                  setCurrentLogStartedAtMs(Date.now());
                  setIsLogging(true);
                  toast.success("Datalogging started.");
                } catch {
                  toast.error("Failed to start datalogging session.");
                }
              };

              void start();
            }}
            onStopLogging={() => {
              const stop = async (): Promise<void> => {
                await stopLoggingSession();
                toast.success("Datalogging stopped.");
              };
              void stop();
            }}
            onToggleParameter={toggleParameter}
            selectedDme={selectedDme}
            selectedParameterKeys={selectedParameterKeys}
            selectedPort={selectedPort}
            serialPorts={serialPorts}
            softwareVersion={SOFTWARE_VERSION}
            userName={userName}
            isLogging={isLogging}
            totalBytesLogged={totalLoggedBytes}
            logLines={liveLogLines}
            latestDecodedValues={latestDecodedValues}
            lastDecodedTimestamp={lastDecodedTimestamp}
            protocolMode={protocolMode}
            recordedSampleCount={recordedSamples.length}
            isSavingLog={isSavingLog}
            onExportCsv={exportRecordedCsv}
            onSaveLog={() => {
              void saveRecordedLog();
            }}
          />
        )}

        {activeScreen === "datalog-viewer" && (
          <DatalogViewerScreen
            onBack={() => {
              navigate("/");
            }}
            recordedSamples={recordedSamples}
          />
        )}

        {activeScreen === "read-codes" && (
          <ReadCodesScreen
            currentPlan={currentPlan}
            dtcRecords={dtcRecords}
            errorMessage={dtcErrorMessage}
            filter={dtcFilter}
            isClearing={isDtcClearing}
            isVehicleConnected={isVehicleConnected}
            isLoading={isDtcLoading}
            onBack={() => {
              navigate("/");
            }}
            onClear={() => {
              void clearDtcs();
            }}
            onFilterChange={(value) => {
              setDtcFilter(value);
            }}
            onScan={() => {
              void loadDtcs();
            }}
            softwareVersion={SOFTWARE_VERSION}
            userName={userName}
          />
        )}

        {activeScreen === "flash-tune" && (
          <FlashTuneScreen
            currentPlan={currentPlan}
            isVehicleConnected={isVehicleConnected}
            onBack={() => {
              navigate("/");
            }}
            softwareVersion={SOFTWARE_VERSION}
            userName={userName}
          />
        )}

        {activeScreen === "gauges" && (
          <GaugesScreen
            currentPlan={currentPlan}
            isVehicleConnected={isVehicleConnected}
            metrics={gaugeMetrics}
            onBack={() => {
              navigate("/");
            }}
            onRefresh={() => {
              refreshGauges();
            }}
            softwareVersion={SOFTWARE_VERSION}
            userName={userName}
          />
        )}
      </section>
    </main>
  );
};
