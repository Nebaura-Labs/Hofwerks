import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type VehicleInfoScreenProps = {
  onBack: () => void;
};

export const VehicleInfoScreen = ({ onBack }: VehicleInfoScreenProps) => {
  const infoRows: Array<{ label: string; value: string; mono?: boolean }> = [
    { label: "VIN", value: "WBAKG7C58BE264073", mono: true },
    { label: "Engine", value: "N55" },
    { label: "Drivetrain", value: "RWD" },
    { label: "Transmission", value: "Auto" },
    { label: "DME", value: "MEVD17.2" },
    { label: "Current Map", value: "Stage 2" },
    { label: "Battery Snapshot", value: "12.4V" },
  ];

  const flashRows: Array<{ label: string; value: string }> = [
    { label: "Last Flash", value: "February 19, 2026" },
    { label: "Time", value: "10:14 PM" },
    { label: "Flashed By", value: "Hofwerks Mobile" },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Vehicle Info</h1>
        <p className="text-muted-foreground text-sm">Connected vehicle profile and identifiers.</p>
      </div>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>2011 BMW 335i</CardTitle>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/80">
              PROFILE
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          {infoRows.map((row) => (
            <div
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
              key={row.label}
            >
              <span className="text-white/65">{row.label}</span>
              <span className={row.mono ? "font-mono text-white/90" : "text-white/90"}>
                {row.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Flash History</CardTitle>
            <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/80">
              TUNING
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          {flashRows.map((row) => (
            <div
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
              key={row.label}
            >
              <span className="text-white/65">{row.label}</span>
              <span className="text-white/90">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
