import { ConvexHttpClient } from "convex/browser";
import { authBaseURL, authClient } from "./auth-client";

const TRAILING_SLASHES_REGEX = /\/+$/;

const trimTrailingSlash = (value: string): string => {
	return value.replace(TRAILING_SLASHES_REGEX, "");
};

const resolveConvexUrl = (): string => {
	const explicitConvexUrl =
		import.meta.env.VITE_CONVEX_URL ?? import.meta.env.CONVEX_URL;
	if (typeof explicitConvexUrl === "string" && explicitConvexUrl.length > 0) {
		return trimTrailingSlash(explicitConvexUrl);
	}

	const explicitAuthUrl =
		import.meta.env.VITE_AUTH_URL ?? import.meta.env.CONVEX_SITE_URL;
	if (
		typeof explicitAuthUrl === "string" &&
		explicitAuthUrl.includes(".convex.site")
	) {
		return trimTrailingSlash(
			explicitAuthUrl.replace(".convex.site", ".convex.cloud")
		);
	}

	if (authBaseURL.includes(".convex.site")) {
		return trimTrailingSlash(
			authBaseURL.replace(".convex.site", ".convex.cloud")
		);
	}

	return "https://basic-hound-820.convex.cloud";
};

const convex = new ConvexHttpClient(resolveConvexUrl());

const fetchConvexToken = async (): Promise<string> => {
	try {
		const clientWithConvexToken = authClient as {
			convex?: {
				token?: () => Promise<{ data?: { token?: string } }>;
			};
		};
		const tokenResult = await clientWithConvexToken.convex?.token?.();
		const tokenFromClient = tokenResult?.data?.token;
		if (typeof tokenFromClient === "string" && tokenFromClient.length > 0) {
			return tokenFromClient;
		}
	} catch {
		// Fall through to manual endpoint fetch for compatibility.
	}

	const runtimeOrigin = globalThis.location?.origin;
	const candidateBases = [
		authBaseURL,
		typeof runtimeOrigin === "string" ? trimTrailingSlash(runtimeOrigin) : null,
	].filter((value, index, array): value is string => {
		return typeof value === "string" && value.length > 0 && array.indexOf(value) === index;
	});
	const primaryBases =
		import.meta.env.DEV
			? candidateBases.filter((base) => !base.includes(".convex.site"))
			: candidateBases;
	const basesToTry = primaryBases.length > 0 ? primaryBases : candidateBases;

	let lastError: Error | null = null;
	const attemptMessages: string[] = [];
	for (const base of basesToTry) {
		const tokenEndpoint = `${base}/api/auth/convex/token`;
		const response = await fetch(tokenEndpoint, {
			credentials: "include",
		});

		if (!response.ok) {
			const statusLabel = response.statusText || "Unknown";
			attemptMessages.push(`${tokenEndpoint} -> ${response.status} ${statusLabel}`);
			lastError = new Error(`Unable to retrieve Convex auth token from ${tokenEndpoint}.`);
			continue;
		}

		const body = (await response.json()) as { token?: string };
		if (typeof body.token !== "string" || body.token.length === 0) {
			attemptMessages.push(`${tokenEndpoint} -> 200 OK (missing token body)`);
			lastError = new Error(`Convex auth token missing from ${tokenEndpoint}.`);
			continue;
		}

		return body.token;
	}

	const attemptsSuffix =
		attemptMessages.length > 0 ? ` Attempts: ${attemptMessages.join(" | ")}` : "";
	throw new Error((lastError?.message ?? "Unable to retrieve Convex auth token.") + attemptsSuffix);
};

export const convexMutation = async <TArgs extends object, TResult>(
	name: string,
	args: TArgs
): Promise<TResult> => {
	const token = await fetchConvexToken();
	convex.setAuth(token);
	return convex.mutation(name as never, args as never) as Promise<TResult>;
};

export const convexQuery = async <TArgs extends object, TResult>(
	name: string,
	args: TArgs
): Promise<TResult> => {
	const token = await fetchConvexToken();
	convex.setAuth(token);
	return convex.query(name as never, args as never) as Promise<TResult>;
};
