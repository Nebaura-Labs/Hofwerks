import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type CodingScreenProps = {
  onBack: () => void;
};

export const CodingScreen = ({ onBack }: CodingScreenProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Coding</h1>
        <p className="text-muted-foreground text-sm">Configure FRM and other BMW modules.</p>
      </div>

      <Card className="border border-white/12 bg-black/18 backdrop-blur-2xl">
        <CardHeader>
          <CardTitle>Available Modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-white/85">
          <p>FRM (Footwell Module)</p>
          <p>CAS</p>
          <p>KOMBI</p>
          <p className="text-white/60 text-xs">More module coding workflows coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
};
