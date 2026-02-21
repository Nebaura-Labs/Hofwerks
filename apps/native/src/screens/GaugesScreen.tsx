import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
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

export const GaugesScreen = ({ metrics, onRefresh, onBack, isVehicleConnected }: GaugesScreenProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="font-semibold text-3xl tracking-tight">Gauges</h1>
        <p className="text-muted-foreground text-sm">
          Real-time gauge dashboard for boost, AFR, timing, and temperatures.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant={isVehicleConnected ? "secondary" : "outline"}>
            {isVehicleConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
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
            <Card
              className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl"
              key={metric.key}
            >
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
                  className={`font-semibold text-2xl ${
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
