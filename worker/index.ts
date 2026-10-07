import { json, routeRequest } from "./base.ts";

export type Env = {
  ASSETS: Fetcher;
};

// ErinnerMich has no backend: the Worker only serves the static assets through
// web-base's shared router (SPA fallback, /healthz, 404 for stale /assets/*,
// security headers). There is no API — every /api request is a 404.
export default {
  fetch: (request, env, ctx) => routeRequest(request, env, ctx, handleApi),
} satisfies ExportedHandler<Env>;

async function handleApi(_request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
  return json({ error: "not_found" }, 404);
}
