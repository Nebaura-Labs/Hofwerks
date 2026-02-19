import { env } from "@hofwerkz/env/server";

type SessionPayload = {
	session: unknown;
	user: unknown;
};

const getConvexAuthUrl = (path: string): URL => {
	return new URL(path, env.CONVEX_SITE_URL);
};

const copyHeaders = (headers: Headers): Headers => {
	const result = new Headers();
	for (const [key, value] of headers.entries()) {
		result.append(key, value);
	}
	return result;
};

const FORWARDED_HEADER_KEYS = new Set([
	"accept",
	"authorization",
	"content-type",
	"cookie",
	"origin",
	"referer",
	"user-agent",
	"x-forwarded-for",
	"x-forwarded-host",
	"x-forwarded-proto",
]);

const forwardProxyHeaders = (headers: Headers): Headers => {
	const result = new Headers();
	for (const [key, value] of headers.entries()) {
		const normalizedKey = key.toLowerCase();
		if (!FORWARDED_HEADER_KEYS.has(normalizedKey)) {
			continue;
		}
		result.append(key, value);
	}
	return result;
};

const sanitizeProxyResponseHeaders = (headers: Headers): Headers => {
	const result = new Headers(headers);
	result.delete("content-encoding");
	result.delete("content-length");
	result.delete("transfer-encoding");
	result.delete("connection");
	result.delete("keep-alive");
	return result;
};

const handler = async (request: Request): Promise<Response> => {
	const incomingUrl = new URL(request.url);
	const targetUrl = getConvexAuthUrl(`${incomingUrl.pathname}${incomingUrl.search}`);

	const init: RequestInit = {
		method: request.method,
		headers: forwardProxyHeaders(request.headers),
		redirect: "manual",
	};

	if (request.method !== "GET" && request.method !== "HEAD") {
		init.body = await request.arrayBuffer();
	}

	const response = await fetch(targetUrl, init);
	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: sanitizeProxyResponseHeaders(response.headers),
	});
};

const getSession = async ({
	headers,
}: {
	headers: Headers;
}): Promise<SessionPayload | null> => {
	const response = await fetch(getConvexAuthUrl("/api/auth/get-session"), {
		method: "GET",
		headers: copyHeaders(headers),
	});

	if (!response.ok) {
		return null;
	}

	return (await response.json()) as SessionPayload | null;
};

export const auth = {
	handler,
	api: {
		getSession,
	},
} as const;
