import axios from "axios";

import {
	formatWriteApiError,
	jsonResult,
	writeApiGet,
	writeApiPatch,
	writeApiPost,
} from "@/utils/http-client";

const STREAM_SERIALIZATION_ERROR =
	"Object of type StreamValue is not JSON serializable";

export function isStreamSerializationError(error: unknown): boolean {
	if (!axios.isAxiosError(error)) {
		return false;
	}
	const message =
		typeof error.response?.data === "object" &&
		error.response?.data !== null &&
		"message" in error.response.data
			? String((error.response.data as { message?: string }).message)
			: "";
	return message.includes(STREAM_SERIALIZATION_ERROR);
}

export async function fetchPageSummary(pageId: number) {
	return writeApiGet<Record<string, unknown>>(`/pages/${pageId}/`, {
		version: "live",
	});
}

export async function findPageBySlug(
	pageType: string,
	slug: string,
	parent?: number | string,
) {
	type PageListResponse = {
		items?: Array<{ id: number; slug: string; meta?: Record<string, unknown> }>;
	};

	const data = await writeApiGet<PageListResponse>("/pages/", {
		type: pageType,
		slug,
		limit: 5,
		...(parent !== undefined ? { parent } : {}),
	});
	const items = data.items ?? [];
	return items.find((item) => item.slug === slug) ?? items[0];
}

function slugify(title: string): string {
	return title
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export async function recoverAfterStreamSerializationError(
	error: unknown,
	context: {
		pageId?: number;
		title?: string;
		type?: string;
		parent?: number | string;
		slug?: string;
	},
): Promise<Record<string, unknown>> {
	if (!isStreamSerializationError(error)) {
		throw error;
	}

	if (context.pageId) {
		try {
			const page = await fetchPageSummary(context.pageId);
			return {
				...page,
				_warning:
					"Write succeeded but the API response failed to serialize sections. Page data recovered from a follow-up read.",
			};
		} catch {
			return {
				id: context.pageId,
				_warning:
					"Write likely succeeded (StreamValue serialization bug) but could not read the page back. Verify in Wagtail admin.",
				_error_detail: formatWriteApiError(error),
			};
		}
	}

	if (context.type && (context.slug || context.title)) {
		const slug = context.slug ?? slugify(context.title ?? "");
		try {
			const match = await findPageBySlug(
				context.type,
				slug,
				context.parent,
			);
			if (match?.id) {
				const page = await fetchPageSummary(match.id);
				return {
					...page,
					_warning:
						"Page was created but the API response failed to serialize sections. Recovered via slug lookup.",
				};
			}
		} catch {
			// fall through
		}
	}

	return {
		_warning:
			"Write likely succeeded (StreamValue serialization bug) but the page could not be recovered automatically.",
		_error_detail: formatWriteApiError(error),
		_hint: context.title
			? `Search with list_write_pages type=${context.type} slug=${context.slug ?? slugify(context.title)}`
			: undefined,
	};
}

export async function writeApiPostWithRecovery<T extends Record<string, unknown>>(
	path: string,
	body: Record<string, unknown>,
	recovery: Parameters<typeof recoverAfterStreamSerializationError>[1] & {
		pageId?: number;
	},
): Promise<T> {
	try {
		return await writeApiPost<T>(path, body);
	} catch (error) {
		const recovered = await recoverAfterStreamSerializationError(error, {
			...recovery,
			pageId: recovery.pageId,
		});
		return recovered as T;
	}
}

export async function writeApiPatchWithRecovery<T extends Record<string, unknown>>(
	path: string,
	body: Record<string, unknown>,
	pageId: number,
): Promise<T> {
	try {
		return await writeApiPatch<T>(path, body);
	} catch (error) {
		const recovered = await recoverAfterStreamSerializationError(error, {
			pageId,
		});
		return recovered as T;
	}
}

export { jsonResult };
