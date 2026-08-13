export type ChatErrorCode =
  | "validation_error"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "internal_error";

export interface ChatErrorBody {
  code: ChatErrorCode;
  message: string;
  details?: string;
}

export interface ChatErrorResponse {
  error: ChatErrorBody;
}

export class ChatApiError extends Error {
  readonly status: number;
  readonly code: ChatErrorCode;
  readonly details?: string;

  constructor(
    status: number,
    code: ChatErrorCode,
    message: string,
    details?: string,
  ) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toChatErrorResponse(error: unknown): {
  status: number;
  body: ChatErrorResponse;
} {
  if (error instanceof ChatApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
    };
  }

  const fallbackMessage =
    error instanceof Error ? error.message : "Internal server error";

  return {
    status: 500,
    body: {
      error: {
        code: "internal_error",
        message: "Internal server error",
        details: fallbackMessage,
      },
    },
  };
}
