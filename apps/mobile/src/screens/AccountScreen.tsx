import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";

type AccountScreenProps = {
  email: string;
  memberSince: string;
  onBack: () => void;
  onLogout: () => void;
  plan: string;
  softwareVersion: string;
};

export const AccountScreen = ({
  email,
  memberSince,
  onBack,
  onLogout,
  plan,
  softwareVersion,
}: AccountScreenProps) => {
  const rowClass =
    "flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2";

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button onClick={onBack} type="button" variant="outline">
          Back
        </Button>
        <h1 className="font-semibold text-3xl tracking-tight">Account</h1>
        <p className="text-sm text-white/65">
          Manage profile, security, and app preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-white/12 bg-black/18 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/85">
            PLAN: {plan.toUpperCase()}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/85">
            MEMBER SINCE: {memberSince}
          </span>
          <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/85">
            APP: v{softwareVersion}
          </span>
        </div>
      </div>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className={rowClass}>
            <span className="text-white/65">Email</span>
            <span className="text-white/90">{email}</span>
          </div>
          <div className={rowClass}>
            <span className="text-white/65">Display Name</span>
            <span className="text-white/90">Jonah</span>
          </div>
          <div className={rowClass}>
            <span className="text-white/65">Primary Vehicle</span>
            <span className="text-white/90">2011 BMW 335i</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className={rowClass}>
            <span className="text-white/65">Password</span>
            <span className="text-white/90">Last changed 14 days ago</span>
          </div>
          <div className={rowClass}>
            <span className="text-white/65">2FA</span>
            <span className="text-amber-300">Not enabled</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline">
              Change Password
            </Button>
            <Button type="button" variant="outline">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className={rowClass}>
            <span className="text-white/65">Units</span>
            <span className="text-white/90">Imperial</span>
          </div>
          <div className={rowClass}>
            <span className="text-white/65">Log Sample Rate</span>
            <span className="text-white/90">10 Hz</span>
          </div>
          <div className={rowClass}>
            <span className="text-white/65">Export Format</span>
            <span className="text-white/90">CSV</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button type="button" variant="outline">
              App Settings
            </Button>
            <Button type="button" variant="outline">
              Notification Prefs
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-rose-400/30 bg-rose-500/10 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className={rowClass}>
            <span className="text-white/70">Sign out of this device</span>
            <Button onClick={onLogout} size="sm" type="button" variant="destructive">
              Logout
            </Button>
          </div>
          <div className={rowClass}>
            <span className="text-white/70">Delete account</span>
            <Button size="sm" type="button" variant="outline">
              Request Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/12 bg-black/18 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
        <CardHeader>
          <CardTitle>Technical</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 text-sm">
          <div className={rowClass}>
            <span className="text-white/65">Plan</span>
            <span className="text-white/90">{plan}</span>
          </div>
          <div className={rowClass}>
            <span className="text-white/65">App Version</span>
            <span className="text-white/90">v{softwareVersion}</span>
          </div>
          <div className={rowClass}>
            <span className="text-white/65">Member Since</span>
            <span className="text-white/90">{memberSince}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
