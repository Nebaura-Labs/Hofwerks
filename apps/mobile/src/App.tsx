import { invoke } from "@tauri-apps/api/core";
import {
  Gauge,
  Garage,
  House,
  PlugsConnected,
  Pulse,
  Scan,
  Wrench,
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import splashBackground from "@/assets/splash-bg.png";
import { Button } from "./components/ui/button";
import { authClient } from "./lib/auth-client";
import { AccountScreen } from "./screens/AccountScreen";
import { CodingScreen } from "./screens/CodingScreen";
import { DataloggingScreen } from "./screens/DataloggingScreen";
import { FlashTuneScreen } from "./screens/FlashTuneScreen";
import { GaugesScreen } from "./screens/GaugesScreen";
import { ReadCodesScreen } from "./screens/ReadCodesScreen";
import { SplashScreen } from "./screens/SplashScreen";
import { VehicleInfoScreen } from "./screens/VehicleInfoScreen";
import { Logo } from "./components/logo";
import type {
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
    { key: "rail-pressure-target", label: "Rail Target", unit: "kPa", description: "Target rail pressure." },
    { key: "hpfp-duty-cycle", label: "HPFP Duty", unit: "%", description: "HPFP control duty cycle." },
    { key: "lambda-actual", label: "Lambda Actual", unit: "λ", description: "Measured lambda value." },
    { key: "lambda-target", label: "Lambda Target", unit: "λ", description: "Target lambda value." },
    { key: "torque-actual", label: "Torque Actual", unit: "Nm", description: "Actual torque reported by DME." },
    { key: "knock-retard-cyl1", label: "Knock Cyl 1", unit: "°", description: "Knock retard cylinder 1." },
    { key: "knock-retard-cyl2", label: "Knock Cyl 2", unit: "°", description: "Knock retard cylinder 2." },
    { key: "knock-retard-cyl3", label: "Knock Cyl 3", unit: "°", description: "Knock retard cylinder 3." },
    { key: "knock-retard-cyl4", label: "Knock Cyl 4", unit: "°", description: "Knock retard cylinder 4." },
    { key: "knock-retard-cyl5", label: "Knock Cyl 5", unit: "°", description: "Knock retard cylinder 5." },
    { key: "knock-retard-cyl6", label: "Knock Cyl 6", unit: "°", description: "Knock retard cylinder 6." },
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
    { key: "rail-pressure-target", label: "Rail Target", unit: "kPa", description: "Target rail pressure." },
    { key: "hpfp-duty-cycle", label: "HPFP Duty", unit: "%", description: "HPFP control duty cycle." },
    { key: "lambda-actual", label: "Lambda Actual", unit: "λ", description: "Measured lambda value." },
    { key: "lambda-target", label: "Lambda Target", unit: "λ", description: "Target lambda value." },
    { key: "torque-actual", label: "Torque Actual", unit: "Nm", description: "Actual torque reported by DME." },
    { key: "knock-retard-cyl1", label: "Knock Cyl 1", unit: "°", description: "Knock retard cylinder 1." },
    { key: "knock-retard-cyl2", label: "Knock Cyl 2", unit: "°", description: "Knock retard cylinder 2." },
    { key: "knock-retard-cyl3", label: "Knock Cyl 3", unit: "°", description: "Knock retard cylinder 3." },
    { key: "knock-retard-cyl4", label: "Knock Cyl 4", unit: "°", description: "Knock retard cylinder 4." },
    { key: "knock-retard-cyl5", label: "Knock Cyl 5", unit: "°", description: "Knock retard cylinder 5." },
    { key: "knock-retard-cyl6", label: "Knock Cyl 6", unit: "°", description: "Knock retard cylinder 6." },
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
  if (pathname === "/vehicle") {
    return "vehicle-info";
  }

  if (pathname === "/coding") {
    return "coding";
  }

  if (pathname === "/account") {
    return "account";
  }

  if (pathname === "/datalogging") {
    return "datalogging";
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

  return "http://localhost:1422/#/";
};

export const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
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
  const [serialPorts, setSerialPorts] = useState<SerialPortInfo[]>([]);
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
      : location.pathname === "/flash-tune"
      ? "Flashing"
      : location.pathname === "/read-codes"
        ? "Read Codes"
      : location.pathname === "/gauges"
        ? "Gauges"
      : location.pathname === "/vehicle"
        ? "Vehicle"
        : location.pathname === "/coding"
          ? "Coding"
          : location.pathname === "/account"
            ? "Account"
            : "Home";
  const bottomNavItems: Array<{
    icon: typeof House;
    label: string;
    path: string;
  }> = [
    { icon: House, label: "Home", path: "/" },
    { icon: Pulse, label: "Datalog", path: "/datalogging" },
    { icon: Wrench, label: "Flash", path: "/flash-tune" },
    { icon: Scan, label: "Codes", path: "/read-codes" },
    { icon: Gauge, label: "Gauges", path: "/gauges" },
  ];

  const isNavItemActive = (path: string): boolean => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const loadSerialPorts = async (): Promise<void> => {
    try {
      const data = await invoke<SerialPortInfo[]>("list_serial_ports");
      setSerialPorts(data);
    } catch {
      // ignore transient port listing failures; screen auto-retries
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

  const exportRecordedCsv = (): void => {
    if (recordedSamples.length === 0) {
      toast.error("No decoded samples to export yet.");
      return;
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
      return;
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
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replaceAll(":", "-");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `hofworks_datalog_${timestamp}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    toast.success("CSV export generated.");
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
  }, []);

  useEffect(() => {
    if (activeScreen === "datalogging") {
      void loadSerialPorts();
    }
  }, [activeScreen]);

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
  const availablePorts = kdcanPorts;
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
    if (selectedPort !== null) {
      return;
    }

    if (availablePorts.length === 0) {
      return;
    }

    setSelectedPort(availablePorts[0].port_name);
  }, [availablePorts, selectedPort]);

  useEffect(() => {
    if (activeScreen !== "datalogging") {
      return;
    }

    if (selectedPort === null || isVehicleConnected) {
      return;
    }

    const autoConnect = async (): Promise<void> => {
      try {
        await invoke<boolean>("verify_serial_port", {
          portName: selectedPort,
          baudRate: 115200,
        });
        setIsVehicleConnected(true);
      } catch {
        setIsVehicleConnected(false);
      }
    };

    void autoConnect();
  }, [activeScreen, isVehicleConnected, selectedPort]);

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

  const getFriendlyAuthError = (error: unknown, fallback: string): string => {
    const rawMessage =
      error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (
      rawMessage.includes("invalid email or password") ||
      rawMessage.includes("invalid credentials") ||
      rawMessage.includes("wrong password") ||
      rawMessage.includes("invalid password")
    ) {
      return "Incorrect email or password.";
    }

    if (
      rawMessage.includes("invalid email") ||
      rawMessage.includes("email is invalid")
    ) {
      return "Please enter a valid email address.";
    }

    if (
      rawMessage.includes("user not found") ||
      rawMessage.includes("account not found")
    ) {
      return "No account found for that email.";
    }

    if (
      rawMessage.includes("already exists") ||
      rawMessage.includes("email already in use")
    ) {
      return "That email is already registered.";
    }

    if (
      rawMessage.includes("load failed") ||
      rawMessage.includes("failed to fetch") ||
      rawMessage.includes("networkerror") ||
      rawMessage.includes("network request failed")
    ) {
      return "Network issue. Check connection and try again.";
    }

    return fallback;
  };

  const handleSignIn = async (email: string, password: string): Promise<void> => {
    try {
      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: authCallbackUrl,
        errorCallbackURL: authCallbackUrl,
        newUserCallbackURL: authCallbackUrl,
      });
      if (result?.error) {
        throw new Error(
          result.error.message ?? result.error.statusText ?? "Failed to login.",
        );
      }

      const authClientWithUpdates = authClient as { updateSession?: () => void };
      authClientWithUpdates.updateSession?.();
    } catch (error) {
      throw new Error(getFriendlyAuthError(error, "Could not log in. Try again."));
    }

    navigate("/");
    toast.success("Logged in successfully");
  };

  const handleSignUp = async (
    name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    try {
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
    } catch (error) {
      throw new Error(getFriendlyAuthError(error, "Could not create account. Try again."));
    }

    navigate("/");
    toast.success("Account created successfully");
  };

  const handleLogout = async (): Promise<void> => {
    const result = await authClient.signOut();
    if (result?.error) {
      toast.error(result.error.message ?? result.error.statusText ?? "Failed to logout.");
      return;
    }

    navigate("/");
    toast.success("Logged out");
  };

  const handleViewAccount = (): void => {
    navigate("/account");
  };

  const handleViewVehicle = (): void => {
    navigate("/vehicle");
  };

  const handleOpenCoding = (): void => {
    navigate("/coding");
  };

  if (session === null || session === undefined) {
    if (location.pathname !== "/") {
      return <Navigate replace to="/" />;
    }

    return (
      <SplashScreen
        onLoginSubmit={handleSignIn}
        onSignUpSubmit={handleSignUp}
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
        <header
          className="fixed inset-x-0 top-0 z-30 bg-transparent"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        >
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
        <div
          style={{ height: "calc(env(safe-area-inset-top, 0px) + 64px)" }}
        />
        <section className="relative z-10 px-5 pb-28 pt-4">
          {location.pathname === "/vehicle" && (
            <VehicleInfoScreen
              onBack={() => {
                navigate("/");
              }}
            />
          )}

          {location.pathname === "/coding" && (
            <CodingScreen
              onBack={() => {
                navigate("/");
              }}
            />
          )}

          {location.pathname === "/account" && (
            <AccountScreen
              email={accountEmail}
              memberSince={memberSince}
              onBack={() => {
                navigate("/");
              }}
              onLogout={() => {
                void handleLogout();
              }}
              plan={currentPlan}
              softwareVersion={SOFTWARE_VERSION}
            />
          )}

          {location.pathname === "/datalogging" && (
            <DataloggingScreen
              availableParameters={availableParameters}
              isVehicleConnected={isVehicleConnected}
              onBack={() => {
                navigate("/");
              }}
              onExportCsv={exportRecordedCsv}
              onStartLogging={() => {
                if (!isVehicleConnected) {
                  toast.error("Connect your cable to start logging.");
                  return;
                }

                const start = async (): Promise<void> => {
                  try {
                    await invoke<boolean>("start_datalogging", {
                      connectionMode: "hardware",
                      portName: selectedPort,
                      baudRate: 115200,
                      selectedParameterKeys,
                    });
                    setLiveLogLines([]);
                    setTotalLoggedBytes(0);
                    setLatestDecodedValues({});
                    setLastDecodedTimestamp(null);
                    setProtocolMode("starting");
                    setRecordedSamples([]);
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
              protocolMode={protocolMode}
              recordedSampleCount={recordedSamples.length}
              isLogging={isLogging}
              lastDecodedTimestamp={lastDecodedTimestamp}
              latestDecodedValues={latestDecodedValues}
              logLines={liveLogLines}
              selectedDme={selectedDme}
              selectedParameterKeys={selectedParameterKeys}
            />
          )}

          {location.pathname === "/flash-tune" && (
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

          {location.pathname === "/gauges" && (
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

          {location.pathname === "/read-codes" && (
            <ReadCodesScreen
              dtcRecords={dtcRecords}
              errorMessage={dtcErrorMessage}
              filter={dtcFilter}
              isClearing={isDtcClearing}
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
            />
          )}

          {location.pathname === "/" && (
            <>
          <div className="relative rounded-2xl border border-white/12 bg-black/18 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
            <Button
              className="absolute right-5 top-5 h-7 rounded-full px-2.5 text-[10px]"
              onClick={() => {
                handleViewVehicle();
              }}
              type="button"
              variant="default"
            >
              View Vehicle
            </Button>
            <p className="text-muted-foreground text-sm">Hello, {userName}</p>
            <h2 className="mt-1 font-semibold text-2xl tracking-tight">2011 BMW 335i</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              N55 • 3.0L TwinPower Turbo • Auto • RWD
            </p>
            <div className="mt-4 flex items-center justify-between gap-1.5 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.25 py-0.75">
                <PlugsConnected
                  className={
                    displayVehicleConnected
                      ? "h-3 w-3 text-primary drop-shadow-[0_0_8px_rgba(133,255,96,0.75)]"
                      : "h-3 w-3 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.75)]"
                  }
                  weight="bold"
                />
                <span
                  className={
                    displayVehicleConnected
                      ? "font-mono text-[9.5px] text-primary"
                      : "font-mono text-[9.5px] text-red-400"
                  }
                >
                  {displayVehicleConnected ? "Connected" : "Disconnected"}
                </span>
              </span>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/60 px-2.25 py-0.75">
                <span className="font-mono text-[9.5px] text-white/85">Map: Stage 2</span>
              </span>
              <span className="inline-flex items-center rounded-full border border-border/70 bg-background/60 px-2.25 py-0.75">
                <span className="font-mono text-[9.5px] text-white/85">VIN: WBAKG7C58BE264073</span>
              </span>
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
              className="col-span-2 rounded-2xl border border-white/12 bg-black/18 p-4 text-left shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition hover:bg-black/24"
              onClick={() => {
                handleOpenCoding();
              }}
              type="button"
            >
              <Wrench className="mb-2 h-4 w-4 text-primary" weight="bold" />
              <p className="font-semibold text-sm">Coding</p>
              <p className="mt-1 text-white/65 text-xs">FRM and module configuration</p>
            </button>
          </div>
          <div className="mt-4 rounded-2xl border border-white/12 bg-black/18 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-base">Account Overview</h3>
              <Button
                className="h-7 rounded-full px-2.5 text-[10px]"
                onClick={handleViewAccount}
                type="button"
                variant="default"
              >
                Manage Account
              </Button>
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
            </>
          )}
        </section>
        <nav
          className="fixed inset-x-3 -bottom-5 z-40 rounded-2xl border border-white/12 bg-black/18 px-2 pb-2 pt-2 backdrop-blur-2xl"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="grid grid-cols-5 gap-1">
            {bottomNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item.path);
              return (
                <button
                  className={
                    isActive
                      ? "flex flex-col items-center justify-center rounded-xl bg-primary/20 px-1 py-2 text-primary"
                      : "flex flex-col items-center justify-center rounded-xl px-1 py-2 text-white/75"
                  }
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                  }}
                  type="button"
                >
                  <Icon className="h-4 w-4" weight={isActive ? "bold" : "regular"} />
                  <span className="mt-1 text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
  );
};
