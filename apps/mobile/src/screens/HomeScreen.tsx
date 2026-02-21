import { Activity, Gauge, ScanLine, Wrench } from "lucide-react";
import { AppTopCards } from "../components/app-top-cards";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import type { FeatureCardData } from "../types";

type HomeScreenProps = {
  isSerialPortsLoading: boolean;
  isVehicleConnected: boolean;
  softwareVersion: string;
  userName: string;
  currentPlan: string;
  onGoDatalogging: () => void;
  onGoReadCodes: () => void;
  onGoFlashTune: () => void;
  onGoGauges: () => void;
};

const FeatureCard = ({ title, description, tag, icon, onClick }: FeatureCardData) => {
  return (
    <Card className="border border-white/15 bg-black/25 backdrop-blur-md transition-colors hover:border-white/25 hover:bg-black/35">
      <CardHeader className="pb-2">
        <CardAction>
          <Badge className="border-white/20 bg-white/5 text-white/80" variant="outline">
            {tag}
          </Badge>
        </CardAction>
        <div className="mb-1 flex items-center gap-3">
          <div className="rounded-lg border border-white/15 bg-white/10 p-2 text-white/85">
            {icon}
          </div>
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription className="text-white/65">{description}</CardDescription>
      </CardHeader>
      <CardFooter className="pt-2">
        <Button className="w-full" onClick={onClick} type="button">
          Open
        </Button>
      </CardFooter>
    </Card>
  );
};

export const HomeScreen = ({
  isSerialPortsLoading,
  isVehicleConnected,
  softwareVersion,
  userName,
  currentPlan,
  onGoDatalogging,
  onGoReadCodes,
  onGoFlashTune,
  onGoGauges,
}: HomeScreenProps) => {
  return (
    <div className="space-y-6">
      <AppTopCards
        currentPlan={currentPlan}
        isSerialPortsLoading={isSerialPortsLoading}
        isVehicleConnected={isVehicleConnected}
        softwareVersion={softwareVersion}
        userName={userName}
      />
      <div className="mt-2 mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-[0.12em] text-white/70 uppercase">
          Available modes
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <FeatureCard
          description="Connect to your K+DCAN cable and record live engine data."
          icon={<Gauge className="size-4" />}
          onClick={onGoDatalogging}
          tag="Core"
          title="Datalogging"
        />
        <FeatureCard
          description="Scan and clear diagnostic trouble codes from the DME."
          icon={<ScanLine className="size-4" />}
          onClick={onGoReadCodes}
          tag="Core"
          title="Read Codes"
        />
        <FeatureCard
          description="Manage tune flashing workflows and map operations."
          icon={<Wrench className="size-4" />}
          onClick={onGoFlashTune}
          tag="Planned"
          title="Flash Tune"
        />
        <FeatureCard
          description="View real-time performance gauges for key engine metrics."
          icon={<Activity className="size-4" />}
          onClick={onGoGauges}
          tag="Core"
          title="Gauges"
        />
      </div>
    </div>
  );
};
