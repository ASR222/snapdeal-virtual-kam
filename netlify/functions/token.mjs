// Mints a short-lived Gemini Live token so the real API key never reaches the browser.
// The browser calls POST /api/token, then opens the Live API WebSocket with the token.
// Set GEMINI_API_KEY in Netlify: Site configuration → Environment variables.

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  // Only hand out tokens to pages served from this site.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json({ error: "Forbidden" }, 403);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "GEMINI_API_KEY is not set on the server. Add it in Netlify's environment variables, then redeploy." }, 500);

  const now = Date.now();
  const res = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      uses: 1,                                                   // one call per token
      expireTime: new Date(now + 30 * 60 * 1000).toISOString(),  // call can last up to 30 min
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString() // must connect within 1 min
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.name) {
    return json({ error: "Could not create a session token: " + (data.error?.message || res.status) }, 502);
  }
  return json({ token: data.name });
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

export const config = { path: "/api/token" };
