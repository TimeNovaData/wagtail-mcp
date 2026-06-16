import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";
import { UserError } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import { jsonResult, writeApiMultipartPost } from "@/utils/http-client";

const toolName = "upload_image";
const toolDescription =
	"Uploads an image to Wagtail via wagtail-write-api. Provide a local file_path accessible to the MCP server.";

const parameters = z.object({
	file_path: z.string().describe("Absolute or relative path to the image file on disk."),
	title: z.string().describe("Image title in the Wagtail media library."),
	collection_id: z
		.number()
		.int()
		.positive()
		.optional()
		.describe("Optional Wagtail collection ID."),
});

type UploadImageArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: UploadImageArgs,
	context: ToolContext,
): Promise<ContentResult> => {
	context.log.info(`Executing ${toolName}`, args);

	let fileBuffer: Buffer;
	try {
		fileBuffer = readFileSync(args.file_path);
	} catch {
		throw new UserError(`Could not read file at path: ${args.file_path}`);
	}

	const formData = new FormData();
	formData.append(
		"file",
		new Blob([fileBuffer]),
		basename(args.file_path),
	);
	formData.append("title", args.title);
	if (args.collection_id !== undefined) {
		formData.append("collection_id", String(args.collection_id));
	}

	try {
		const data = await writeApiMultipartPost<Record<string, unknown>>(
			"/images/",
			formData,
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
