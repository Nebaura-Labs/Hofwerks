import splashBackground from "@/assets/splash-bg.png";
import { Logo } from "@/components/logo";
import { SignUpForm } from "@/components/sign-up-form";
import { Button } from "@/components/ui/button";

type SignUpScreenProps = {
	onSubmit: (name: string, email: string, password: string) => Promise<void>;
	onBack: () => void;
};

export const SignUpScreen = ({ onSubmit, onBack }: SignUpScreenProps) => {
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
				style={{ top: "31%", transform: "translateY(-50%)" }}
			>
				<Logo className="mb-2 h-20 w-20" />
				<h1 className="font-bold text-6xl text-primary">Hofwerks</h1>
				<p className="mt-3 max-w-sm font-semibold text-lg text-white/90">
					The modern BMW toolkit.
				</p>
			</div>

			<div className="fixed inset-0 z-30 flex items-center justify-center bg-black/20 p-6">
				<div className="w-full max-w-md rounded-3xl border-0 bg-black/15 p-4 text-white shadow-[0_-10px_30px_rgba(0,0,0,0.22),0_-4px_42px_rgba(133,255,96,0.7)] backdrop-blur-lg">
					<div className="mb-3 flex justify-end">
						<Button
							className="h-8 px-3 text-xs"
							onClick={onBack}
							type="button"
							variant="secondary"
						>
							Close
						</Button>
					</div>
					<div className="max-h-[70svh] overflow-y-auto">
						<SignUpForm
							className="text-white"
							onSubmitCredentials={async ({ name, email, password }) => {
								await onSubmit(name, email, password);
							}}
						/>
					</div>
				</div>
			</div>
		</main>
	);
};
