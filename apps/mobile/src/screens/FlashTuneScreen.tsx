import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";

type FlashTuneScreenProps = {
  onBack: () => void;
  userName: string;
  currentPlan: string;
  softwareVersion: string;
  isVehicleConnected: boolean;
};

export const FlashTuneScreen = ({
  onBack,
  currentPlan,
  softwareVersion,
  isVehicleConnected,
  userName,
}: FlashTuneScreenProps) => {
  const batteryValue = isVehicleConnected ? "12.4V" : "--";
  const ignitionValue = isVehicleConnected ? "ON" : "OFF";
  const currentMapValue = isVehicleConnected ? "Stage 2" : "--";
  const [burblesEnabled, setBurblesEnabled] = useState(true);
  const [aggressivenessPreset, setAggressivenessPreset] = useState<
    "oem" | "sport" | "aggressive" | "track"
  >("sport");
  const [durationSeconds, setDurationSeconds] = useState<number[]>([2]);
  const [overrunBrapEnabled, setOverrunBrapEnabled] = useState(true);
  const [burbleLength, setBurbleLength] = useState<"short" | "medium" | "long">("medium");
  const [dtcCats, setDtcCats] = useState(true);
  const [dtcRearO2, setDtcRearO2] = useState(true);
  const [dtcColdStart, setDtcColdStart] = useState(false);
  const [dtcMisc, setDtcMisc] = useState("");

  const statusRows: Array<{ label: string; value: string; state?: "good" | "warn" }> = [
    { label: "Vehicle", value: "2011 BMW 335i" },
    { label: "VIN", value: "WBAKG7C58BE264073" },
    { label: "DME", value: "MEVD17.2" },
    {
      label: "Connection",
      value: isVehicleConnected ? "Connected" : "Disconnected",
      state: isVehicleConnected ? "good" : "warn",
    },
    { label: "Battery", value: batteryValue, state: isVehicleConnected ? "good" : "warn" },
    { label: "Ignition", value: ignitionValue, state: isVehicleConnected ? "good" : "warn" },
    { label: "Current Map", value: currentMapValue },
    { label: "Last Flash", value: "Feb 19, 2026 • 10:14 PM" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="font-semibold text-3xl tracking-tight">Flashing</h1>
        <p className="text-muted-foreground text-sm">
          Select a map, run safety checks, and flash your DME.
        </p>
      </div>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Flash Session</CardTitle>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/80">
              {currentPlan.toUpperCase()} PLAN
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          {statusRows.map((row) => (
            <div
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
              key={row.label}
            >
              <span className="text-white/65">{row.label}</span>
              <span
                className={
                  row.state === "good"
                    ? "text-primary"
                    : row.state === "warn"
                      ? "text-amber-300"
                      : "text-white/90"
                }
              >
                {row.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Available Maps</CardTitle>
            <Button size="sm" type="button" variant="default">
              Add Map
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">Stage 2 93 Octane</p>
              <span className="rounded-full border border-primary/50 bg-primary/20 px-2 py-0.5 text-[10px] text-primary">
                ACTIVE
              </span>
            </div>
            <p className="mt-1 text-white/70 text-xs">Burble: Mild • Top Speed Limiter: Removed</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white/90">Stage 2 E30 Blend</p>
              <Button size="sm" type="button" variant="outline">
                Select
              </Button>
            </div>
            <p className="mt-1 text-white/60 text-xs">Requires ethanol content verification</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white/90">Stock / OEM</p>
              <Button size="sm" type="button" variant="outline">
                Select
              </Button>
            </div>
            <p className="mt-1 text-white/60 text-xs">Restore factory calibration</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <CardTitle>Configure Map</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Enable Burbles</span>
              <Switch checked={burblesEnabled} onCheckedChange={setBurblesEnabled} />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <span className="mb-1 block text-white/80">Burble Aggressiveness</span>
            <div className="grid grid-cols-4 gap-2">
              <Button
                onClick={() => {
                  setAggressivenessPreset("oem");
                }}
                size="sm"
                type="button"
                variant={aggressivenessPreset === "oem" ? "default" : "outline"}
              >
                OEM
              </Button>
              <Button
                onClick={() => {
                  setAggressivenessPreset("sport");
                }}
                size="sm"
                type="button"
                variant={aggressivenessPreset === "sport" ? "default" : "outline"}
              >
                Sport
              </Button>
              <Button
                onClick={() => {
                  setAggressivenessPreset("aggressive");
                }}
                size="sm"
                type="button"
                variant={aggressivenessPreset === "aggressive" ? "default" : "outline"}
              >
                Aggro
              </Button>
              <Button
                onClick={() => {
                  setAggressivenessPreset("track");
                }}
                size="sm"
                type="button"
                variant={aggressivenessPreset === "track" ? "default" : "outline"}
              >
                Track
              </Button>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Burble Duration</span>
              <span className="font-mono text-[11px] text-white/85">{durationSeconds[0]}s</span>
            </div>
            <Slider
              max={5}
              min={0}
              onValueChange={setDurationSeconds}
              step={1}
              value={durationSeconds}
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex items-center justify-between">
              <span className="text-white/80">Enable Overrun Brap</span>
              <Switch checked={overrunBrapEnabled} onCheckedChange={setOverrunBrapEnabled} />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <span className="mb-1 block text-white/80">Brap Length</span>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => {
                  setBurbleLength("short");
                }}
                size="sm"
                type="button"
                variant={burbleLength === "short" ? "default" : "outline"}
              >
                Short
              </Button>
              <Button
                onClick={() => {
                  setBurbleLength("medium");
                }}
                size="sm"
                type="button"
                variant={burbleLength === "medium" ? "default" : "outline"}
              >
                Medium
              </Button>
              <Button
                onClick={() => {
                  setBurbleLength("long");
                }}
                size="sm"
                type="button"
                variant={burbleLength === "long" ? "default" : "outline"}
              >
                Long
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
            <span className="mb-1 block text-white/80">Disable DTCs</span>
            <label className="flex items-center gap-2 text-white/85">
              <Checkbox checked={dtcCats} onCheckedChange={(checked) => setDtcCats(checked === true)} />
              <span>Catalyst Efficiency</span>
            </label>
            <label className="flex items-center gap-2 text-white/85">
              <Checkbox checked={dtcRearO2} onCheckedChange={(checked) => setDtcRearO2(checked === true)} />
              <span>Rear O2 Sensor</span>
            </label>
            <label className="flex items-center gap-2 text-white/85">
              <Checkbox
                checked={dtcColdStart}
                onCheckedChange={(checked) => setDtcColdStart(checked === true)}
              />
              <span>Cold Start Emissions</span>
            </label>
            <Input
              onChange={(event) => {
                setDtcMisc(event.target.value);
              }}
              placeholder="Other DTC codes (comma separated)"
              value={dtcMisc}
            />
          </div>

          <Button className="w-full" type="button" variant="default">
            Save Map Configuration
          </Button>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader className="space-y-2">
          <CardTitle>Flash Readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-white/70">Status</span>
            <span className={isVehicleConnected ? "text-primary" : "text-amber-300"}>
              {isVehicleConnected ? "Ready to Flash" : "Not Ready"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-white/70">Connection</span>
            <span className={isVehicleConnected ? "text-primary" : "text-amber-300"}>
              {isVehicleConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-white/70">Battery Threshold</span>
            <span className={isVehicleConnected ? "text-primary" : "text-amber-300"}>
              {isVehicleConnected ? "Passed" : "Unknown"}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-white/70">Ignition State</span>
            <span className={isVehicleConnected ? "text-primary" : "text-amber-300"}>
              {isVehicleConnected ? "ON" : "OFF"}
            </span>
          </div>
          <Button className="mt-2 w-full" type="button" variant="default">
            {isVehicleConnected ? "Start Flash" : "Resolve Issues"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
