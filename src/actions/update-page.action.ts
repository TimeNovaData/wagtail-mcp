import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import {
	jsonResult,
	writeApiPatchWithRecovery,
} from "@/utils/write-api";

const toolName = "update_page";
const toolDescription =
	"Updates an existing Wagtail page via wagtail-write-api. Send only fields to change. For secaopaginalivre_set, include section id when updating existing sections. Use HTML for rich_text block values.";

const parameters = z.object({
	id: z.number().int().positive().describe("Page ID to update."),
	fields: z
		.record(z.unknown())
		.describe(
			"Fields to update as JSON object (e.g. title, body, banner_image, secaopaginalivre_set).",
		),
	action: z
		.enum(["save", "publish"])
		.default("save")
		.describe("Save draft revision (default) or publish after update."),
});

type UpdatePageArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: UpdatePageArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, {
		id: args.id,
		action: args.action,
	});

	const body: Record<string, unknown> = {
		...args.fields,
		...(args.action === "publish" ? { action: "publish" } : {}),
	};

	try {
		const data = await writeApiPatchWithRecovery<Record<string, unknown>>(
			`/pages/${args.id}/`,
			body,
			args.id,
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
