import { Logo } from "@/components/logo"
import { SignUpForm } from "@/components/sign-up-form"
import splashBackground from "@/assets/splash-bg.png"

type SignUpScreenProps = {
  onSubmit: (name: string, email: string, password: string) => Promise<void>
  onSwitchToLogin: () => void
}

export const SignUpScreen = ({ onSubmit, onSwitchToLogin }: SignUpScreenProps) => {
  return (
    <div className="relative min-h-svh w-full bg-background">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${splashBackground})` }}
      />
      <div className="relative z-10 grid min-h-svh lg:grid-cols-2">
        <div className="pointer-events-none absolute top-1/2 left-1/2 hidden h-3/4 w-px -translate-x-1/2 -translate-y-1/2 bg-primary/60 lg:block" />
        <div className="flex flex-col gap-4 p-6 md:p-10 lg:order-2">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <SignUpForm
                onSubmitCredentials={async ({ name, email, password }) => {
                  await onSubmit(name, email, password)
                }}
                onSwitchToLogin={onSwitchToLogin}
              />
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-svh w-full lg:order-1 lg:block">
          <div className="absolute inset-0 z-10 flex items-center justify-center p-10 text-foreground">
            <div className="flex max-w-md flex-col items-center gap-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <Logo className="h-20 w-20" />
                <p className="text-2xl font-semibold text-primary">Hofwerks</p>
                <p className="text-base text-muted-foreground">The modern BMW toolkit</p>
              </div>

              <div className="w-full space-y-5 rounded-2xl border border-white/12 bg-black/18 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.2)] backdrop-blur-2xl">
                <p className="text-base leading-relaxed text-white/95">
                  Create your account to unlock datalogging, diagnostics, and tuning workflows
                  built for BMW enthusiasts.
                </p>
                <ul className="space-y-3">
                  <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90">
                    DME-specific live data channels
                  </li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90">
                    Fast fault-code scanning and clearing
                  </li>
                  <li className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/90">
                    Real-time gauges for key engine health metrics
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
