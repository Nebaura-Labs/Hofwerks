import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { AppTopCards } from "../components/app-top-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import type { DtcFilter, DtcRecord, DtcSeverity, DtcStatus } from "../types";

type ReadCodesScreenProps = {
  dtcRecords: DtcRecord[];
  filter: DtcFilter;
  isLoading: boolean;
  errorMessage: string | null;
  isClearing: boolean;
  onFilterChange: (value: DtcFilter) => void;
  onScan: () => void;
  onClear: () => void;
  onBack: () => void;
  userName: string;
  currentPlan: string;
  softwareVersion: string;
  isVehicleConnected: boolean;
};

const statusBadgeVariant = (status: DtcStatus): "default" | "secondary" | "outline" => {
  if (status === "active") {
    return "default";
  }

  if (status === "pending") {
    return "secondary";
  }

  return "outline";
};

const severityClassName = (severity: DtcSeverity): string => {
  if (severity === "high") {
    return "text-rose-300";
  }

  if (severity === "medium") {
    return "text-amber-300";
  }

  return "text-emerald-300";
};

export const ReadCodesScreen = ({
  dtcRecords,
  filter,
  isLoading,
  errorMessage,
  isClearing,
  onFilterChange,
  onScan,
  onClear,
  onBack,
  userName,
  currentPlan,
  softwareVersion,
  isVehicleConnected,
}: ReadCodesScreenProps) => {
  const visibleRecords =
    filter === "all"
      ? dtcRecords
      : dtcRecords.filter((record) => {
          return record.status === filter;
        });

  return (
    <div className="space-y-6">
      <AppTopCards
        currentPlan={currentPlan}
        isSerialPortsLoading={isLoading}
        isVehicleConnected={isVehicleConnected}
        softwareVersion={softwareVersion}
        userName={userName}
      />
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="text-3xl font-semibold tracking-tight">Read Codes</h1>
        <p className="text-muted-foreground text-sm">
          Read and clear DTCs for supported BMW DMEs.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={onScan} type="button" variant="outline">
          Scan Codes
        </Button>
        <Button
          disabled={isClearing || isLoading}
          onClick={onClear}
          type="button"
          variant="destructive"
        >
          {isClearing ? "Clearing..." : "Clear Codes"}
        </Button>
      </div>

      <Tabs
        className="space-y-3"
        onValueChange={(value) => {
          onFilterChange(value as DtcFilter);
        }}
        value={filter}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="stored">Stored</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
        </TabsList>
      </Tabs>

      <Card className="border border-white/20 bg-black/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Diagnostic Trouble Codes</CardTitle>
          <CardDescription>Read and filter DTCs reported by the DME.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && <p className="text-muted-foreground text-sm">Reading codes...</p>}
          {errorMessage !== null && <p className="text-sm text-rose-300">{errorMessage}</p>}
          {!isLoading && errorMessage === null && visibleRecords.length === 0 && (
            <p className="text-muted-foreground text-sm">No codes found for this filter.</p>
          )}
          {visibleRecords.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRecords.map((record) => (
                  <TableRow key={`${record.code}-${record.timestamp}`}>
                    <TableCell className="font-medium">{record.code}</TableCell>
                    <TableCell className="max-w-md truncate">{record.description}</TableCell>
                    <TableCell className={`capitalize ${severityClassName(record.severity)}`}>
                      {record.severity}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(record.status)}>{record.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.timestamp}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
