import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import { jsonResult, writeApiGet } from "@/utils/http-client";

const toolName = "get_site_theme";
const toolDescription =
	"Returns the default site theme (tema) from Wagtail SiteSettings via write-api. Use before creating a premium page to apply the correct theme.";

const parameters = z.object({});

type GetSiteThemeArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	_args: GetSiteThemeArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`);

	try {
		const data = await writeApiGet<Record<string, unknown>>("/site/");
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
