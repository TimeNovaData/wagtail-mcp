import { URLSearchParams } from "url";

function normalizeApiUrl(
	baseUrl: string,
	apiPath: string,
	specificPath: string,
	queryParams?: Record<string, string | number | boolean>,
): string {
	const normalizedBaseUrl = baseUrl.replace(/\/$/, "");
	const normalizedApiPath = `/${apiPath.replace(/^\/|\/$/g, "")}`;
	const normalizedSpecificPath =
		specificPath && !specificPath.startsWith("/")
			? `/${specificPath}`
			: specificPath;

	let fullUrl = `${normalizedBaseUrl}${normalizedApiPath}${normalizedSpecificPath}`;

	if (queryParams && Object.keys(queryParams).length > 0) {
		const stringParams: Record<string, string> = {};
		for (const key in queryParams) {
			stringParams[key] = String(queryParams[key]);
		}
		const searchParams = new URLSearchParams(stringParams);
		fullUrl += `?${searchParams.toString()}`;
	}

	return fullUrl;
}

function getBaseUrl(): string {
	const baseUrl = process.env.WAGTAIL_BASE_URL;
	if (!baseUrl) {
		console.error("WAGTAIL_BASE_URL environment variable is not set.");
		throw new Error("Server configuration error: WAGTAIL_BASE_URL is not set.");
	}
	return baseUrl;
}

/**
 * Builds URLs for the read-only Wagtail API v2.
 */
export function getWagtailApiUrl(
	specificPath: string,
	queryParams?: Record<string, string | number>,
): string {
	const apiPath = process.env.WAGTAIL_API_PATH || "/api/v2";
	return normalizeApiUrl(getBaseUrl(), apiPath, specificPath, queryParams);
}

/**
 * Builds URLs for the wagtail-write-api endpoints.
 */
export function getWagtailWriteApiUrl(
	specificPath: string,
	queryParams?: Record<string, string | number | boolean>,
): string {
	const apiPath = process.env.WAGTAIL_WRITE_API_PATH || "/api/write/v1";
	return normalizeApiUrl(getBaseUrl(), apiPath, specificPath, queryParams);
}

/**
 * Gets the Wagtail API Key from the environment.
 */
export function getWagtailApiKey(): string | undefined {
	return process.env.WAGTAIL_API_KEY;
}
