import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { z } from "zod";

import type { ContentResult, Context, FastMCP } from "fastmcp";
import { UserError } from "fastmcp";

import { throwWriteApiError } from "@/utils/errors";
import { jsonResult, writeApiMultipartPost } from "@/utils/http-client";

const toolName = "upload_document";
const toolDescription =
	"Uploads a document (PDF, video, etc.) to Wagtail via write-api. Use for pdf_file, video_file and video fields in premium page blocks.";

const parameters = z.object({
	file_path: z
		.string()
		.describe("Absolute or relative path to the file on disk (PDF, MP4, etc.)."),
	title: z.string().describe("Document title in the Wagtail media library."),
});

type UploadDocumentArgs = z.infer<typeof parameters>;
type ToolContext = Context<any>;

const execute = async (
	args: UploadDocumentArgs,
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

	try {
		const data = await writeApiMultipartPost<Record<string, unknown>>(
			"/documents/",
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
