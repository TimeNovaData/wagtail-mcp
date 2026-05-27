import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import { jsonResult, writeApiGet } from "@/utils/http-client";

const toolName = "get_content_schema";
const toolDescription =
	"Returns the content model schema from wagtail-write-api. Use before create_page or update_page to discover page types, fields, StreamField blocks, and InlinePanel children.";

const parameters = z.object({
	page_type: z
		.string()
		.optional()
		.describe(
			"Optional page type filter (e.g. home.PaginaConteudoLivrePremium). If omitted, returns all page types.",
		),
});

type GetContentSchemaArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: GetContentSchemaArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, args);

	try {
		const path = args.page_type
			? `/schema/${encodeURIComponent(args.page_type)}/`
			: "/schema/";
		const schema = await writeApiGet<Record<string, unknown>>(path);
		return jsonResult(schema);
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
