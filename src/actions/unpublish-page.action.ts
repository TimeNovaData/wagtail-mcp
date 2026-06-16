import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import {
	jsonResult,
	writeApiPostWithRecovery,
} from "@/utils/write-api";

const toolName = "unpublish_page";
const toolDescription =
	"Unpublishes a live Wagtail page via wagtail-write-api, reverting it to draft. Use only when the user explicitly requests rollback after publication.";

const parameters = z.object({
	id: z.number().int().positive().describe("Page ID to unpublish."),
});

type UnpublishPageArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: UnpublishPageArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, args);

	try {
		const data = await writeApiPostWithRecovery<Record<string, unknown>>(
			`/pages/${args.id}/unpublish/`,
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
