import axios from "axios";

import { getWagtailApiKey, getWagtailWriteApiUrl } from "@/utils/config";

export function getAuthHeaders(
	contentType?: string,
): Record<string, string> {
	const headers: Record<string, string> = {
		Accept: "application/json",
		"X-Hints": "wagapi",
	};

	if (contentType) {
		headers["Content-Type"] = contentType;
	}

	const apiKey = getWagtailApiKey();
	if (apiKey) {
		headers.Authorization = `Bearer ${apiKey}`;
	}

	return headers;
}

export async function writeApiGet<T>(
	path: string,
	queryParams?: Record<string, string | number | boolean>,
): Promise<T> {
	const url = getWagtailWriteApiUrl(path, queryParams);
	const response = await axios.get<T>(url, {
		headers: getAuthHeaders(),
	});
	return response.data;
}

export async function writeApiPost<T>(
	path: string,
	body?: unknown,
	queryParams?: Record<string, string | number | boolean>,
): Promise<T> {
	const url = getWagtailWriteApiUrl(path, queryParams);
	const response = await axios.post<T>(url, body ?? {}, {
		headers: getAuthHeaders("application/json"),
	});
	return response.data;
}

export async function writeApiPatch<T>(
	path: string,
	body: unknown,
	queryParams?: Record<string, string | number | boolean>,
): Promise<T> {
	const url = getWagtailWriteApiUrl(path, queryParams);
	const response = await axios.patch<T>(url, body, {
		headers: getAuthHeaders("application/json"),
	});
	return response.data;
}

export async function writeApiMultipartPost<T>(
	path: string,
	formData: FormData,
): Promise<T> {
	const url = getWagtailWriteApiUrl(path);
	const headers = getAuthHeaders();
	delete headers["Content-Type"];

	const response = await axios.post<T>(url, formData, {
		headers,
	});
	return response.data;
}

export function formatWriteApiError(error: unknown): string {
	if (!axios.isAxiosError(error)) {
		return error instanceof Error ? error.message : String(error);
	}

	const status = error.response?.status;
	const data = error.response?.data;
	let detail = error.message;

	if (data && typeof data === "object") {
		try {
			detail = JSON.stringify(data, null, 2);
		} catch {
			detail = error.message;
		}
	}

	return status ? `HTTP ${status}: ${detail}` : detail;
}

export function jsonResult(data: unknown) {
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(data, null, 2),
			},
		],
	};
}
