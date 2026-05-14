// 301-redirect www.indri.studio → indri.studio (path/query/hash preserved),
// fall through to static-assets binding for everything else. Replaces the
// edge-level cloudflare_ruleset that the Free-plan API token couldn't
// manage. Plan: docs/plans/2026-05-14-www-apex-redirect.md.

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
}

const APEX = "indri.studio";
const WWW = "www.indri.studio";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === WWW) {
      url.hostname = APEX;
      return Response.redirect(url.toString(), 301);
    }
    const response = await env.ASSETS.fetch(request);
    const ct = response.headers.get("content-type") ?? "";
    if (ct.includes("text/html")) {
      const headers = new Headers(response.headers);
      headers.set("Cache-Control", "no-store");
      return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    }
    return response;
  },
};
