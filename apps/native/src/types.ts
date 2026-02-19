import type { ReactNode } from "react";

export type SerialPortInfo = {
  port_name: string;
  port_type: string;
};

export type FeatureScreen =
  | "home"
  | "datalogging"
  | "read-codes"
  | "flash-tune"
  | "gauges";

export type FeatureCardData = {
  title: string;
  description: string;
  tag: string;
  icon: ReactNode;
  onClick: () => void;
};

export type GaugeMetric = {
  key: "boost" | "afr" | "timing" | "iat" | "oil-temp" | "coolant-temp";
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  precision: number;
  warnLow?: number;
  warnHigh?: number;
};

export type DtcSeverity = "low" | "medium" | "high";
export type DtcStatus = "active" | "stored" | "pending";
export type DtcFilter = "all" | DtcStatus;
export type ConnectionMode = "simulator" | "hardware";
export type DmeProfile = "MEVD17.2" | "MEVD17.2.G" | "MSD80/81";

export type LoggingParameter = {
  key: string;
  label: string;
  unit: string;
  description: string;
};

export type DtcRecord = {
  code: string;
  description: string;
  severity: DtcSeverity;
  status: DtcStatus;
  timestamp: string;
};

export type DatalogPollUpdate = {
  is_logging: boolean;
  last_error: string | null;
  lines: string[];
  total_bytes: number;
  decoded_samples: DecodedSample[];
  protocol_mode: string;
};

export type DecodedSample = {
  timestamp_ms: number;
  values: Record<string, number>;
};
