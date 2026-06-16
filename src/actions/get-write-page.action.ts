import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import { jsonResult, writeApiGet } from "@/utils/http-client";

const toolName = "get_write_page";
const toolDescription =
	"Gets full page detail from wagtail-write-api, including draft content, StreamField blocks, and InlinePanel children.";

const parameters = z.object({
	id: z.number().int().positive().describe("Page ID."),
	version: z
		.enum(["draft", "live"])
		.default("draft")
		.describe("Return draft (default) or live published version."),
	rich_text_format: z
		.enum(["html", "markdown", "wagtail"])
		.optional()
		.describe("Format for rich text fields in the response."),
});

type GetWritePageArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: GetWritePageArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, args);

	try {
		const data = await writeApiGet<Record<string, unknown>>(
			`/pages/${args.id}/`,
			{
				...(args.version === "live" ? { version: "live" } : {}),
				...(args.rich_text_format
					? { rich_text_format: args.rich_text_format }
					: {}),
			},
		);
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
