import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import {
	jsonResult,
	writeApiPostWithRecovery,
} from "@/utils/write-api";

const toolName = "create_page";
const toolDescription =
	"Creates a new Wagtail page via wagtail-write-api. Pages are created as drafts unless action=publish. Use get_content_schema first. For secaopaginalivre_set rich_text blocks, use HTML strings in value (e.g. \"<p>text</p>\"), not markdown dicts.";

const parameters = z.object({
	type: z
		.string()
		.describe("Page type as app_label.ModelName (e.g. home.PaginaConteudoLivrePremium)."),
	parent: z
		.union([z.number().int().positive(), z.string()])
		.describe("Parent page ID or URL path (e.g. /feed/my-feed/)."),
	title: z.string().describe("Page title."),
	slug: z.string().optional().describe("URL slug. Auto-generated from title if omitted."),
	fields: z
		.record(z.unknown())
		.optional()
		.describe(
			"Additional page fields as JSON object (e.g. titulo, body, tema, secaopaginalivre_set).",
		),
	action: z
		.enum(["draft", "publish"])
		.default("draft")
		.describe("Create as draft (default) or publish immediately."),
});

type CreatePageArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: CreatePageArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, {
		type: args.type,
		parent: args.parent,
		title: args.title,
		action: args.action,
	});

	const fields: Record<string, unknown> = { ...(args.fields ?? {}) };
	if (fields.body === undefined || fields.body === null) {
		fields.body = "";
	}

	const body: Record<string, unknown> = {
		type: args.type,
		parent: args.parent,
		title: args.title,
		...(args.slug ? { slug: args.slug } : {}),
		...fields,
		...(args.action === "publish" ? { action: "publish" } : {}),
	};

	try {
		const data = await writeApiPostWithRecovery<Record<string, unknown>>(
			"/pages/",
			body,
			{
				type: args.type,
				parent: args.parent,
				title: args.title,
				slug: args.slug,
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
