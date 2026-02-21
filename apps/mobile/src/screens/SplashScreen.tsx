import { useState } from "react";
import splashBackground from "@/assets/splash-bg.png";
import { LoginForm } from "@/components/login-form";
import { Logo } from "@/components/logo";
import { SignUpForm } from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";

interface SplashScreenProps {
	onLoginSubmit: (email: string, password: string) => Promise<void>;
	onSignUpSubmit: (
		name: string,
		email: string,
		password: string,
	) => Promise<void>;
}

export const SplashScreen = ({
	onLoginSubmit,
	onSignUpSubmit,
}: SplashScreenProps) => {
	const [activeAuthView, setActiveAuthView] = useState<"login" | "signup" | null>(
		null,
	);

	return (
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

			{activeAuthView === null && (
				<div className="fixed inset-x-0 bottom-0 z-30 px-6 pb-6 pt-2">
					<div className="space-y-3">
						<Button
							className="h-14 w-full text-base shadow-[0_0_24px_rgba(133,255,96,0.55)] ring-1 ring-primary/40"
							onClick={() => {
								setActiveAuthView("login");
							}}
							size="lg"
						>
							Login
						</Button>
						<Button
							className="h-14 w-full text-base ring-1 ring-secondary/70"
							onClick={() => {
								setActiveAuthView("signup");
							}}
							size="lg"
							style={{
								boxShadow: "0 0 24px var(--secondary)",
							}}
							variant="secondary"
						>
							Sign up
						</Button>
					</div>
				</div>
			)}

			{activeAuthView !== null && (
				<div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 p-6">
					<div className="w-full max-w-md rounded-3xl border-0 bg-black/15 p-4 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.22),0_-4px_42px_rgba(133,255,96,0.7)] backdrop-blur-lg">
						<div className="mb-3 flex justify-end">
							<Button
								className="h-8 px-3 text-xs"
								onClick={() => {
									setActiveAuthView(null);
								}}
								type="button"
								variant="secondary"
							>
								Close
							</Button>
						</div>
						<div className="-mx-1 max-h-[70svh] overflow-y-auto px-1 pb-1">
							{activeAuthView === "login" ? (
								<LoginForm
									className="text-white"
									onSubmitCredentials={async ({ email, password }) => {
										await onLoginSubmit(email, password);
										setActiveAuthView(null);
									}}
									onSwitchToSignUp={() => {
										setActiveAuthView("signup");
									}}
								/>
							) : (
								<SignUpForm
									className="text-white"
									onSubmitCredentials={async ({ name, email, password }) => {
										await onSignUpSubmit(name, email, password);
										setActiveAuthView(null);
									}}
									onSwitchToLogin={() => {
										setActiveAuthView("login");
									}}
								/>
							)}
						</div>
					</div>
				</div>
			)}
		</main>
	);
};
