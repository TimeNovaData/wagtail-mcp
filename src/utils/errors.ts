import axios from "axios";
import { UserError } from "fastmcp";

import { formatWriteApiError } from "@/utils/http-client";

export function throwWriteApiError(error: unknown, action: string): never {
	const detail = formatWriteApiError(error);

	if (axios.isAxiosError(error)) {
		const status = error.response?.status;
		if (status && status >= 400 && status < 500) {
			throw new UserError(`${action} failed: ${detail}`);
		}
	}

	throw new Error(`${action} failed: ${detail}`);
}
