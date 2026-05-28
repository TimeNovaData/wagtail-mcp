import { registerTool as registerCreatePage } from "@/actions/create-page.action";
import { registerTool as registerGetContentSchema } from "@/actions/get-content-schema.action";
import { registerTool as registerGetSiteTheme } from "@/actions/get-site-theme.action";
import { registerTool as registerGetWritePage } from "@/actions/get-write-page.action";
import { registerTool as registerListWritePages } from "@/actions/list-write-pages.action";
import { registerTool as registerPublishPage } from "@/actions/publish-page.action";
import { registerTool as registerUnpublishPage } from "@/actions/unpublish-page.action";
import { registerTool as registerUpdatePage } from "@/actions/update-page.action";
import { registerTool as registerUploadImage } from "@/actions/upload-image.action";
import { registerTool as registerUploadDocument } from "@/actions/upload-document.action";

import type { FastMCP } from "fastmcp";

export function registerWriteActions(server: FastMCP) {
	registerGetContentSchema(server);
	registerGetSiteTheme(server);
	registerListWritePages(server);
	registerGetWritePage(server);
	registerCreatePage(server);
	registerUpdatePage(server);
	registerPublishPage(server);
	registerUnpublishPage(server);
	registerUploadImage(server);
	registerUploadDocument(server);
}
