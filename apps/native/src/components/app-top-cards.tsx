import { Logo } from "./logo";
import { Card, CardContent } from "./ui/card";

interface AppTopCardsProps {
  userName: string;
  currentPlan: string;
  softwareVersion: string;
  isSerialPortsLoading: boolean;
  isVehicleConnected: boolean;
}

export const AppTopCards = ({
  userName,
  currentPlan,
  softwareVersion,
  isSerialPortsLoading,
  isVehicleConnected,
}: AppTopCardsProps) => {
  let connectionLabel = "Disconnected";
  let connectionClassName = "text-rose-400";

  if (isSerialPortsLoading) {
    connectionLabel = "Checking...";
    connectionClassName = "text-white/70";
  } else if (isVehicleConnected) {
    connectionLabel = "Connected";
    connectionClassName = "text-emerald-400";
  }

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2">
      <Card className="gap-0 border border-white/15 bg-black/25 py-0 backdrop-blur-md">
        <CardContent className="p-7">
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-primary/35 bg-primary/20 p-2.5 shadow-[0_0_30px_rgba(168,85,247,0.18)] backdrop-blur-sm">
                <Logo className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">Hofworks</h1>
                <p className="text-sm text-white/60">BMW Tool Suite</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-white/55">Hello</p>
              <p className="text-2xl font-semibold text-white">{userName}</p>
            </div>
            <p className="max-w-xl text-sm leading-relaxed text-white/70">
              A modern BMW datalogging and diagnostics suite for enthusiasts and tuners.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="h-full gap-0 border border-white/15 bg-black/25 py-0 backdrop-blur-md">
        <CardContent className="flex h-full p-5">
          <div className="flex flex-1 flex-col divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <div className="flex flex-1 items-center justify-between px-4 py-4">
              <span className="text-xs tracking-wide text-white/55 uppercase">Vehicle connection</span>
              <span className={`text-sm font-medium ${connectionClassName}`}>{connectionLabel}</span>
            </div>
            <div className="flex flex-1 items-center justify-between px-4 py-4">
              <span className="text-xs tracking-wide text-white/55 uppercase">Current version</span>
              <span className="text-sm font-medium text-white">{softwareVersion}</span>
            </div>
            <div className="flex flex-1 items-center justify-between px-4 py-4">
              <span className="text-xs tracking-wide text-white/55 uppercase">Current plan</span>
              <span className="text-sm font-medium text-white">{currentPlan}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
