export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const authHeader = request.headers.get("X-Auth-Token");
    if (authHeader !== env.SHARED_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    let data;
    try { data = await request.json(); } catch { return new Response("Bad JSON", { status: 400 }); }

    // Bare minimum test payload
    const payload = {
      "thread_name": "Test Application Thread",
      "content": "<@&1524197706925604865> A new form was submitted!"
    };

    const discordRes = await fetch(env.WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      return new Response("Discord error: " + errText, { status: 502 });
    }

    return new Response("OK", { status: 200 });
  }
};
