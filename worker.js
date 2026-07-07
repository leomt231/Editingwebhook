export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Simple shared-secret check so random people can't hit your worker
    const authHeader = request.headers.get("X-Auth-Token");
    if (authHeader !== env.SHARED_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    const { name, answers } = data; // answers: [{ question, answer }, ...]
    if (!name || !Array.isArray(answers)) {
      return new Response("Missing name or answers", { status: 400 });
    }

    const fields = answers.map(a => ({
      name: String(a.question).slice(0, 256),
      value: String(a.answer || "N/A").slice(0, 1024),
      inline: false
    }));

    const embed = {
      title: `New Application — ${name}`,
      color: 0xFF2E63, // red-pink accent
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: "Editing Team Applications" }
    };

    const payload = {
      thread_name: String(name).slice(0, 100), // creates the forum post title
      embeds: [embed]
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
