import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import {
	jsonResult,
	writeApiPostWithRecovery,
} from "@/utils/write-api";

const toolName = "publish_page";
const toolDescription =
	"Publishes the latest draft revision of a Wagtail page via wagtail-write-api.";

const parameters = z.object({
	id: z.number().int().positive().describe("Page ID to publish."),
});

type PublishPageArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: PublishPageArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, args);

	try {
		const data = await writeApiPostWithRecovery<Record<string, unknown>>(
			`/pages/${args.id}/publish/`,
			{},
			{ pageId: args.id },
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
