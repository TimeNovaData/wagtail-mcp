import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import { jsonResult, writeApiGet } from "@/utils/http-client";

const toolName = "list_write_pages";
const toolDescription =
	"Lists pages from wagtail-write-api. Useful to find parent FeedPage IDs before creating a child page.";

const parameters = z.object({
	type: z
		.string()
		.optional()
		.describe("Filter by page type (e.g. home.FeedPage)."),
	parent: z
		.union([z.number().int().positive(), z.string()])
		.optional()
		.describe("Parent page ID or URL path (e.g. /feed/)."),
	search: z.string().optional().describe("Full-text search."),
	limit: z.number().int().positive().max(100).default(20),
	offset: z.number().int().nonnegative().default(0),
	status: z
		.enum(["draft", "live", "live+draft"])
		.optional()
		.describe("Filter by publication status."),
});

type ListWritePagesArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: ListWritePagesArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, args);

	try {
		const data = await writeApiGet<Record<string, unknown>>("/pages/", {
			limit: args.limit,
			offset: args.offset,
			...(args.type ? { type: args.type } : {}),
			...(args.parent !== undefined ? { parent: args.parent } : {}),
			...(args.search ? { search: args.search } : {}),
			...(args.status ? { status: args.status } : {}),
		});
		return jsonResult(data);
	} catch (error) {
		throwWriteApiError(error, toolName);
	}
};

export function registerTool(server: FastMCP) {
	server.addTool({
		name: toolName,
		description: toolDescription,
		parameters,
		execute,
	});
}
