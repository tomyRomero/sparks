/** A page's search params, from the server (a record) or the browser. */
export type ParamSource = Record<string, string | string[] | undefined> | URLSearchParams;

export function paramValues(params: ParamSource, name: string): string[] {
  if (params instanceof URLSearchParams) return params.getAll(name);
  return [params[name] ?? []].flat();
}
