import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "./components/ui/button";
import { authClient } from "./lib/auth-client";
import { DataloggingScreen } from "./screens/DataloggingScreen";
import { FlashTuneScreen } from "./screens/FlashTuneScreen";
import { GaugesScreen } from "./screens/GaugesScreen";
import { HomeScreen } from "./screens/HomeScreen";
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
const ELM_SUPPORTED_PARAMETER_KEYS = new Set<string>([
  "engine-rpm",
  "throttle-position",
  "coolant-temp",
  "iat",
  "vehicle-speed",
  "timing-avg",
  "boost-actual",
  "boost-target",
  "afr-bank1",
  "afr-bank2",
  "oil-temp",
  "fuel-pressure",
]);
const BMW_SUPPORTED_PARAMETER_KEYS = new Set<string>(["knock-retard-max"]);
const LIVE_DECODE_SUPPORTED_PARAMETER_KEYS = new Set<string>([
  ...ELM_SUPPORTED_PARAMETER_KEYS,
  ...BMW_SUPPORTED_PARAMETER_KEYS,
]);

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
    { key: "boost-actual", label: "Boost Actual", unit: "psi", description: "Measured manifold boost pressure." },
    { key: "boost-target", label: "Boost Target", unit: "psi", description: "Requested boost target from DME." },
    { key: "timing-avg", label: "Ignition Timing Avg", unit: "°", description: "Average ignition timing across cylinders." },
    { key: "knock-retard-max", label: "Knock Retard Max", unit: "°", description: "Maximum knock correction observed." },
    { key: "afr-bank1", label: "AFR Bank 1", unit: "λ", description: "Lambda reading for bank 1." },
    { key: "iat", label: "Intake Air Temp", unit: "°C", description: "Temperature at intake manifold." },
    { key: "oil-temp", label: "Oil Temp", unit: "°C", description: "Engine oil temperature." },
    { key: "coolant-temp", label: "Coolant Temp", unit: "°C", description: "Engine coolant temperature." },
    { key: "engine-rpm", label: "Engine RPM", unit: "rpm", description: "Current engine speed." },
    { key: "throttle-position", label: "Throttle Position", unit: "%", description: "Throttle plate angle percentage." },
  ],
  "MEVD17.2.G": [
    { key: "boost-actual", label: "Boost Actual", unit: "psi", description: "Measured manifold boost pressure." },
    { key: "boost-target", label: "Boost Target", unit: "psi", description: "Requested boost target from DME." },
    { key: "timing-avg", label: "Ignition Timing Avg", unit: "°", description: "Average ignition timing across cylinders." },
    { key: "knock-retard-max", label: "Knock Retard Max", unit: "°", description: "Maximum knock correction observed." },
    { key: "afr-bank1", label: "AFR Bank 1", unit: "λ", description: "Lambda reading for bank 1." },
    { key: "afr-bank2", label: "AFR Bank 2", unit: "λ", description: "Lambda reading for bank 2." },
    { key: "fuel-pressure", label: "Fuel Pressure", unit: "bar", description: "High-pressure fuel rail reading." },
    { key: "engine-rpm", label: "Engine RPM", unit: "rpm", description: "Current engine speed." },
    { key: "vehicle-speed", label: "Vehicle Speed", unit: "km/h", description: "Current road speed." },
    { key: "throttle-position", label: "Throttle Position", unit: "%", description: "Throttle plate angle percentage." },
  ],
  "MSD80/81": [
    { key: "boost-actual", label: "Boost Actual", unit: "psi", description: "Measured manifold boost pressure." },
    { key: "timing-avg", label: "Ignition Timing Avg", unit: "°", description: "Average ignition timing across cylinders." },
    { key: "knock-retard-max", label: "Knock Retard Max", unit: "°", description: "Maximum knock correction observed." },
    { key: "afr-bank1", label: "AFR Bank 1", unit: "λ", description: "Lambda reading for bank 1." },
    { key: "afr-bank2", label: "AFR Bank 2", unit: "λ", description: "Lambda reading for bank 2." },
    { key: "iat", label: "Intake Air Temp", unit: "°C", description: "Temperature at intake manifold." },
    { key: "oil-temp", label: "Oil Temp", unit: "°C", description: "Engine oil temperature." },
    { key: "coolant-temp", label: "Coolant Temp", unit: "°C", description: "Engine coolant temperature." },
    { key: "engine-rpm", label: "Engine RPM", unit: "rpm", description: "Current engine speed." },
    { key: "throttle-position", label: "Throttle Position", unit: "%", description: "Throttle plate angle percentage." },
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

export const App = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("simulator");
  const [selectedDme, setSelectedDme] = useState<DmeProfile>("MEVD17.2");
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [isVehicleConnected, setIsVehicleConnected] = useState<boolean>(false);
  const [selectedParameterKeys, setSelectedParameterKeys] = useState<string[]>([
    "boost-actual",
    "engine-rpm",
    "throttle-position",
  ]);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [liveLogLines, setLiveLogLines] = useState<string[]>([]);
  const [totalLoggedBytes, setTotalLoggedBytes] = useState<number>(0);
  const [latestDecodedValues, setLatestDecodedValues] = useState<Record<string, number>>({});
  const [lastDecodedTimestamp, setLastDecodedTimestamp] = useState<number | null>(null);
  const [protocolMode, setProtocolMode] = useState<string>("stopped");
  const [recordedSamples, setRecordedSamples] = useState<DecodedSample[]>([]);
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
      return previous.filter((key) => availableKeys.includes(key));
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
    const result = await authClient.signIn.email({ email, password });
    if (result?.error) {
      throw new Error(result.error.message ?? result.error.statusText ?? "Failed to login.");
    }

    navigate("/");
    toast.success("Logged in successfully");
  };

  const handleSignUp = async (
    name: string,
    email: string,
    password: string,
  ): Promise<void> => {
    const result = await authClient.signUp.email({ name, email, password });
    if (result?.error) {
      throw new Error(
        result.error.message ?? result.error.statusText ?? "Failed to create account.",
      );
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

    navigate("/login");
    toast.success("Logged out");
  };

  const handleViewAccount = (): void => {
    globalThis.open(WEB_APP_URL, "_blank", "noopener,noreferrer");
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
      return <SignUpScreen onSubmit={handleSignUp} />;
    }

    return <LoginScreen onSubmit={handleSignIn} />;
  }

  if (location.pathname === "/login" || location.pathname === "/signup") {
    return <Navigate replace to="/" />;
  }

  return (
    <main className="relative min-h-svh w-full">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #000000 40%, #350136 100%)",
        }}
      />
      <section className="relative z-10 w-full space-y-5 px-6 py-8 md:px-8 md:py-10">
        <div className="flex justify-end gap-2">
          <Button
            className="border border-white/15 bg-black/25 text-white backdrop-blur-md hover:border-white/25 hover:bg-black/35"
            onClick={handleViewAccount}
            type="button"
            variant="outline"
          >
            View Account
          </Button>
          <Button
            className="border border-rose-400/30 bg-rose-500/15 text-rose-100 backdrop-blur-md hover:bg-rose-500/25"
            onClick={() => void handleLogout()}
            type="button"
            variant="outline"
          >
            Logout
          </Button>
        </div>

        {activeScreen === "home" && (
          <HomeScreen
            currentPlan={currentPlan}
            isSerialPortsLoading={isSerialPortsLoading}
            isVehicleConnected={isVehicleConnected}
            onGoDatalogging={() => {
              navigate("/datalogging");
            }}
            onGoFlashTune={() => {
              navigate("/flash-tune");
            }}
            onGoGauges={() => {
              navigate("/gauges");
            }}
            onGoReadCodes={() => {
              navigate("/read-codes");
            }}
            softwareVersion={SOFTWARE_VERSION}
            userName={userName}
          />
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
            onExportCsv={exportRecordedCsv}
            elmSupportedParameterKeys={LIVE_DECODE_SUPPORTED_PARAMETER_KEYS}
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
