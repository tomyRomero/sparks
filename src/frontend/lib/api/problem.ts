/**
 * The API answers every error with RFC 9457 problem details: a status, a
 * human title, a machine-readable `code` for expected failures, and
 * `errors` keyed by JSON field name for validation failures.
 */
export type Problem = {
  status: number;
  title?: string;
  code?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string | undefined;
  readonly fieldErrors: Record<string, string[]>;

  constructor(problem: Problem) {
    super(problem.title ?? `The request failed (${problem.status}).`);
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.fieldErrors = problem.errors ?? {};
  }

  /** Reads a failed response's problem details, whatever shape the body has. */
  static async from(response: Response): Promise<ApiError> {
    let problem: Problem = { status: response.status };
    try {
      const body = (await response.json()) as Partial<Problem>;
      problem = { ...body, status: response.status };
    } catch {
      // Not JSON (a proxy error page, an empty body): the status alone.
    }
    return new ApiError(problem);
  }

  /** The first message for a field, as a form shows it. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }
}

/** A message fit to show a member, for any error. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "That's a lot of requests. Wait a moment and try again.";
    if (error.status >= 500 && !error.code) return "Something went wrong on our side. Try again in a moment.";
    return error.message;
  }
  return "Couldn't reach Sparks. Check your connection and try again.";
}
