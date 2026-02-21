import { AppTopCards } from "../components/app-top-cards";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import type { GaugeMetric } from "../types";

type GaugesScreenProps = {
  metrics: GaugeMetric[];
  onRefresh: () => void;
  onBack: () => void;
  userName: string;
  currentPlan: string;
  softwareVersion: string;
  isVehicleConnected: boolean;
};

const gaugeStatus = (
  value: number,
  warnLow: number | undefined,
  warnHigh: number | undefined,
): "good" | "warn" => {
  if (warnLow !== undefined && value < warnLow) {
    return "warn";
  }

  if (warnHigh !== undefined && value > warnHigh) {
    return "warn";
  }

  return "good";
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const GaugesScreen = ({
  metrics,
  onRefresh,
  onBack,
  userName,
  currentPlan,
  softwareVersion,
  isVehicleConnected,
}: GaugesScreenProps) => {
  return (
    <div className="space-y-6">
      <AppTopCards
        currentPlan={currentPlan}
        isSerialPortsLoading={false}
        isVehicleConnected={isVehicleConnected}
        softwareVersion={softwareVersion}
        userName={userName}
      />
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Gauges</h1>
        <p className="text-muted-foreground text-sm">
          Real-time gauge dashboard for boost, AFR, timing, and temperatures.
        </p>
      </div>

      <div className="flex justify-start">
        <Button onClick={onRefresh} type="button" variant="outline">
          Refresh Gauges
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {metrics.map((metric) => {
          const progressValue = ((metric.value - metric.min) / (metric.max - metric.min)) * 100;
          const normalizedProgressValue = clamp(progressValue, 0, 100);
          const status = gaugeStatus(metric.value, metric.warnLow, metric.warnHigh);

          return (
            <Card className="border border-white/20 bg-black/30 backdrop-blur-sm" key={metric.key}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{metric.label}</CardTitle>
                  <Badge variant={status === "warn" ? "destructive" : "secondary"}>
                    {status === "warn" ? "Alert" : "Normal"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div
                  className={`text-2xl font-semibold ${
                    status === "warn" ? "text-rose-300" : "text-emerald-300"
                  }`}
                >
                  {metric.value.toFixed(metric.precision)} {metric.unit}
                </div>
                <Progress value={normalizedProgressValue} />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>
                    Min: {metric.min.toFixed(metric.precision)} {metric.unit}
                  </span>
                  <span>
                    Max: {metric.max.toFixed(metric.precision)} {metric.unit}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
