import { AppTopCards } from "../components/app-top-cards";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";

type FlashTuneScreenProps = {
  onBack: () => void;
  userName: string;
  currentPlan: string;
  softwareVersion: string;
  isVehicleConnected: boolean;
};

export const FlashTuneScreen = ({
  onBack,
  userName,
  currentPlan,
  softwareVersion,
  isVehicleConnected,
}: FlashTuneScreenProps) => {
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
        <h1 className="text-3xl font-semibold tracking-tight">Flash Tune</h1>
        <p className="text-muted-foreground text-sm">
          Tune flashing workflow and map management.
        </p>
      </div>
      <Card className="border border-amber-500/40 bg-black/30 backdrop-blur-sm">
        <CardContent className="text-sm text-amber-200">
          Flashing workflow will be added after protocol validation and safety checks.
        </CardContent>
      </Card>
    </div>
  );
};
