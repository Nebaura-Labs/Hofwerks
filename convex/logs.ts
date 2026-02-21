import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateLogUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new ConvexError("Unauthorized");
		}
		const uploadUrl = await ctx.storage.generateUploadUrl();
		return { uploadUrl };
	},
});

export const saveLogMetadata = mutation({
	args: {
		storageId: v.id("_storage"),
		fileName: v.string(),
		csvByteLength: v.number(),
		sampleCount: v.number(),
		totalBytes: v.number(),
		dmeProfile: v.string(),
		connectionMode: v.string(),
		parameterKeys: v.array(v.string()),
		startedAtMs: v.optional(v.number()),
		endedAtMs: v.number(),
		durationMs: v.number(),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new ConvexError("Unauthorized");
		}
		const now = Date.now();
		const createdAtIso = new Date(now).toISOString();

		const logId = await ctx.db.insert("datalogLogs", {
			userId: identity.subject,
			userEmail: identity.email ?? null,
			userName: identity.name ?? null,
			createdAtMs: now,
			createdAtIso,
			logDate: createdAtIso.slice(0, 10),
			...args,
		});

		return { logId };
	},
});

export const listMyLogs = query({
	args: {},
	handler: async (ctx) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new ConvexError("Unauthorized");
		}

		const logs = await ctx.db
			.query("datalogLogs")
			.filter((queryBuilder) =>
				queryBuilder.eq(queryBuilder.field("userId"), identity.subject)
			)
			.order("desc")
			.take(100);

		return logs.map((log) => ({
			_id: log._id,
			createdAtIso: log.createdAtIso,
			dmeProfile: log.dmeProfile,
			durationMs: log.durationMs,
			fileName: log.fileName,
			sampleCount: log.sampleCount,
		}));
	},
});

export const getLogDownloadUrl = query({
	args: {
		logId: v.id("datalogLogs"),
	},
	handler: async (ctx, args) => {
		const identity = await ctx.auth.getUserIdentity();
		if (identity === null) {
			throw new ConvexError("Unauthorized");
		}

		const log = await ctx.db.get(args.logId);
		if (log === null || log.userId !== identity.subject) {
			throw new ConvexError("Log not found");
		}

		const downloadUrl = await ctx.storage.getUrl(log.storageId);
		if (downloadUrl === null) {
			throw new ConvexError("Log file unavailable");
		}

		return {
			downloadUrl,
			fileName: log.fileName,
		};
	},
});
