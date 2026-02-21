import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Outlet,
	redirect,
	useLocation,
	useNavigate,
} from "@tanstack/react-router";
import { Activity, FileSearch, Gauge, ScanLine, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getUser } from "@/functions/get-user";
import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

export const Route = createFileRoute("/dashboard/")({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUser();
		return { session };
	},
	loader: ({ context }) => {
		if (!context.session) {
			throw redirect({
				to: "/login",
			});
		}
	},
});

function RouteComponent() {
	const navigate = useNavigate();
	const location = useLocation();
	const { session } = Route.useRouteContext();
	const privateData = useQuery(orpc.privateData.queryOptions());

	if (
		location.pathname !== "/dashboard" &&
		location.pathname !== "/dashboard/"
	) {
		return <Outlet />;
	}
	const userName = session?.user?.name ?? "Driver";

	const currentPlan = "Free";

	const handleLogout = async (): Promise<void> => {
		const result = await authClient.signOut();
		if (result?.error) {
			return;
		}
		navigate({ to: "/login" });
	};

	return (
		<main className="relative min-h-svh w-full">
			<div
				className="absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(125% 125% at 50% 10%, #000000 40%, #350136 100%)",
				}}
			/>
			<section className="relative z-10 w-full space-y-8 px-6 py-8 md:px-8 md:py-10">
				<div className="flex justify-end gap-2">
					<Button
						className="border border-white/15 bg-black/25 text-white backdrop-blur-md hover:border-white/25 hover:bg-black/35"
						type="button"
						variant="outline"
					>
						View Account
					</Button>
					<Button
						className="border border-rose-400/30 bg-rose-500/15 text-rose-100 backdrop-blur-md hover:bg-rose-500/25"
						onClick={handleLogout}
						type="button"
						variant="outline"
					>
						Logout
					</Button>
				</div>

				<div className="grid items-stretch gap-6 md:grid-cols-2">
					<Card className="gap-0 border border-white/15 bg-black/25 py-0 backdrop-blur-md">
						<CardContent className="p-7">
							<div className="space-y-5">
								<div className="flex items-center gap-4">
									<div className="rounded-2xl border border-primary/35 bg-primary/20 p-2.5 shadow-[0_0_30px_rgba(168,85,247,0.18)] backdrop-blur-sm">
										<Logo className="h-12 w-12" />
									</div>
									<div>
										<h1 className="font-semibold text-3xl text-white tracking-tight">
											Hofwerks
										</h1>
										<p className="text-sm text-white/60">BMW Tool Suite</p>
									</div>
								</div>
								<div className="space-y-1">
									<p className="text-sm text-white/55">Hello</p>
									<p className="font-semibold text-2xl text-white">
										{userName}
									</p>
								</div>
								<p className="max-w-xl text-sm text-white/70 leading-relaxed">
									A modern BMW datalogging and diagnostics suite for enthusiasts
									and tuners.
								</p>
							</div>
						</CardContent>
					</Card>

					<Card className="h-full gap-0 border border-white/15 bg-black/25 py-0 backdrop-blur-md">
						<CardContent className="flex h-full p-5">
							<div className="flex flex-1 flex-col divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-black/20">
								<div className="flex flex-1 items-center justify-between px-4 py-4">
									<span className="text-white/55 text-xs uppercase tracking-wide">
										Vehicle connection
									</span>
									<span className="font-medium text-rose-400 text-sm">
										Disconnected
									</span>
								</div>
								<div className="flex flex-1 items-center justify-between px-4 py-4">
									<span className="text-white/55 text-xs uppercase tracking-wide">
										Current version
									</span>
									<span className="font-medium text-sm text-white">0.1.0</span>
								</div>
								<div className="flex flex-1 items-center justify-between px-4 py-4">
									<span className="text-white/55 text-xs uppercase tracking-wide">
										Current plan
									</span>
									<span className="font-medium text-sm text-white">
										{currentPlan}
									</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="mt-3 mb-5 flex items-center justify-between">
					<h2 className="font-medium text-sm text-white/70 uppercase tracking-[0.12em]">
						Available modes
					</h2>
				</div>

				<div className="grid gap-8 md:grid-cols-2">
					<FeatureCard
						description="Connect to your K+DCAN cable and record live engine data."
						icon={<Gauge className="size-4" />}
						onOpen={() => {
							navigate({ to: "/dashboard" });
						}}
						tag="Core"
						title="Datalogging"
					/>
					<FeatureCard
						description="Scan and clear diagnostic trouble codes from the DME."
						icon={<ScanLine className="size-4" />}
						onOpen={() => {
							navigate({ to: "/dashboard" });
						}}
						tag="Core"
						title="Read Codes"
					/>
					<FeatureCard
						description="Manage tune flashing workflows and map operations."
						icon={<Wrench className="size-4" />}
						onOpen={() => {
							navigate({ to: "/dashboard" });
						}}
						tag="Planned"
						title="Flash Tune"
					/>
					<FeatureCard
						description="View real-time performance gauges for key engine metrics."
						icon={<Activity className="size-4" />}
						onOpen={() => {
							navigate({ to: "/dashboard" });
						}}
						tag="Core"
						title="Gauges"
					/>
					<FeatureCard
						description="Upload CSV logs and visualize engine data on interactive graphs."
						icon={<FileSearch className="size-4" />}
						onOpen={() => {
							navigate({ to: "/dashboard/log-viewer" });
						}}
						tag="Core"
						title="Log Viewer"
					/>
				</div>

				<Card className="border border-white/15 bg-black/25 backdrop-blur-md">
					<CardHeader>
						<CardTitle className="text-white">Account</CardTitle>
						<CardDescription className="text-white/65">
							API: {privateData.data?.message ?? "Connected"}
						</CardDescription>
					</CardHeader>
					<CardFooter className="pt-0">
						<Button type="button" variant="outline">
							Billing Integration Coming Soon
						</Button>
					</CardFooter>
				</Card>
			</section>
		</main>
	);
}

interface FeatureCardProps {
	description: string;
	icon: ReactNode;
	onOpen: () => void;
	tag: string;
	title: string;
}

function FeatureCard({
	title,
	description,
	tag,
	icon,
	onOpen,
}: FeatureCardProps) {
	return (
		<Card className="border border-white/15 bg-black/25 backdrop-blur-md transition-colors hover:border-white/25 hover:bg-black/35">
			<CardHeader className="pb-2">
				<CardAction>
					<Badge
						className="border-white/20 bg-white/5 text-white/80"
						variant="outline"
					>
						{tag}
					</Badge>
				</CardAction>
				<div className="mb-1 flex items-center gap-3">
					<div className="rounded-lg border border-white/15 bg-white/10 p-2 text-white/85">
						{icon}
					</div>
					<CardTitle className="text-base text-white">{title}</CardTitle>
				</div>
				<CardDescription className="text-white/65">
					{description}
				</CardDescription>
			</CardHeader>
			<CardFooter className="pt-2">
				<Button className="w-full" onClick={onOpen} type="button">
					Open
				</Button>
			</CardFooter>
		</Card>
	);
}
