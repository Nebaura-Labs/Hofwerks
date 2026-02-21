import { createFileRoute } from "@tanstack/react-router";

import { Logo } from "@/components/logo";
import SignInForm from "@/components/sign-in-form";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="relative min-h-svh w-full">
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(125% 125% at 50% 10%, #000000 40%, #350136 100%)",
        }}
      />
      <div className="relative z-10 grid min-h-svh lg:grid-cols-2">
        <div className="pointer-events-none absolute top-1/2 left-1/2 hidden h-3/4 w-px -translate-x-1/2 -translate-y-1/2 bg-white/15 lg:block" />
        <div className="relative hidden min-h-svh w-full lg:block">
          <div className="absolute inset-0 z-10 flex items-center justify-center p-10 text-white">
            <div className="flex max-w-md flex-col items-center gap-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <Logo className="h-20 w-20" />
                <p className="text-2xl font-semibold text-white">Hofwerks</p>
                <p className="text-base text-white/80">The modern BMW toolkit</p>
              </div>

              <div className="w-full space-y-5 rounded-2xl border border-white/20 bg-black/30 p-6 shadow-lg backdrop-blur-sm">
                <p className="text-base leading-relaxed text-white/95">
                  Built for enthusiasts and tuners who need reliable K+DCAN diagnostics,
                  datalogging, and calibration workflows.
                </p>
                <ul className="space-y-3">
                  <li className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90">
                    Live datalogging with DME-specific parameter selection
                  </li>
                  <li className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90">
                    Read and clear diagnostic trouble codes
                  </li>
                  <li className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90">
                    Real-time gauges for boost, AFR, timing, and temperatures
                  </li>
                  <li className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/90">
                    Flash tune workflow foundation with safety-first guardrails
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <SignInForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
