import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import splashBackground from "@/assets/splash-bg.png";
import { Logo } from "@/components/logo";
import "./index.css";

const ERROR_OVERLAY_ID = "__hofwerkz_native_error_overlay";

const ensureErrorOverlay = (): HTMLPreElement => {
  const existing = document.getElementById(ERROR_OVERLAY_ID);
  if (existing instanceof HTMLPreElement) {
    return existing;
  }

  const overlay = document.createElement("pre");
  overlay.id = ERROR_OVERLAY_ID;
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.overflow = "auto";
  overlay.style.padding = "16px";
  overlay.style.margin = "0";
  overlay.style.whiteSpace = "pre-wrap";
  overlay.style.wordBreak = "break-word";
  overlay.style.background = "#120000";
  overlay.style.color = "#ffd9d9";
  overlay.style.font = "12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace";
  document.body.appendChild(overlay);
  return overlay;
};

const showFatalOverlay = (title: string, details: string): void => {
  const overlay = ensureErrorOverlay();
  overlay.textContent = `${title}\n\n${details}`;
};

window.addEventListener("error", (event) => {
  const location = `${event.filename}:${event.lineno}:${event.colno}`;
  showFatalOverlay("Runtime Error", `${event.message}\n${location}`);
});

window.addEventListener("unhandledrejection", (event) => {
  let reason = "Unknown rejection reason";
  if (event.reason instanceof Error) {
    reason = `${event.reason.name}: ${event.reason.message}\n${event.reason.stack ?? ""}`;
  } else if (typeof event.reason === "string") {
    reason = event.reason;
  } else {
    try {
      reason = JSON.stringify(event.reason, null, 2);
    } catch {
      reason = String(event.reason);
    }
  }

  showFatalOverlay("Unhandled Promise Rejection", reason);
});

const rootElement: HTMLElement | null = document.getElementById("root");

if (rootElement === null) {
  showFatalOverlay("Boot Error", "Root element '#root' was not found");
  throw new Error("Root element '#root' was not found");
}

document.documentElement.classList.add("dark");

const root = createRoot(rootElement);

root.render(
  <main className="relative m-0 h-[100lvh] min-h-[100lvh] w-full overflow-hidden bg-black p-0">
    <div
      className="absolute inset-0 z-0"
      style={{
        backgroundImage: `url(${splashBackground})`,
        backgroundPosition: "center bottom",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
    <div
      className="fixed inset-x-6 z-20 flex flex-col items-center text-center text-white"
      style={{ top: "40%", transform: "translateY(-50%)" }}
    >
      <Logo className="mb-2 h-20 w-20" />
      <h1 className="font-bold text-6xl text-primary">Hofwerks</h1>
      <p className="mt-3 max-w-sm font-semibold text-lg text-white/90">
        The modern BMW toolkit.
      </p>
    </div>
  </main>,
);

const boot = async (): Promise<void> => {
  try {
    const [{ App }, { Toaster }] = await Promise.all([import("./App"), import("sonner")]);
    root.render(
      <StrictMode>
        <HashRouter>
          <App />
          <Toaster
            closeButton={false}
            offset={24}
            position="bottom-center"
            theme="dark"
            toastOptions={{
              className:
                "border border-primary/55 bg-black/35 text-white backdrop-blur-xl rounded-2xl px-4 py-3 text-base shadow-[0_10px_30px_rgba(0,0,0,0.35),0_0_24px_rgba(133,255,96,0.35)]",
              style: {
                background: "rgba(12, 12, 16, 0.72)",
                border: "1px solid rgba(133,255,96,0.55)",
                color: "#ffffff",
                backdropFilter: "blur(16px)",
                marginBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
              },
              classNames: {
                description: "text-white/75",
                title: "text-white font-semibold",
                toast:
                  "bg-black/35 backdrop-blur-xl border border-primary/55 text-white rounded-2xl data-[type=success]:border-primary/60 data-[type=success]:shadow-[0_0_24px_rgba(133,255,96,0.45)] data-[type=error]:border-rose-400/55 data-[type=error]:shadow-[0_0_24px_rgba(251,113,133,0.45)]",
              },
            }}
            visibleToasts={1}
          />
        </HashRouter>
      </StrictMode>,
    );
  } catch (error) {
    const message =
      error instanceof Error ? `${error.message}\n${error.stack ?? ""}` : String(error);
    showFatalOverlay("Boot Error", message);
    throw error;
  }
};

void boot();
