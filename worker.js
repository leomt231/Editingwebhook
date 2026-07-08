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
    try {
      data = await request.json();
    } catch {
      return new Response("Bad JSON", { status: 400 });
    }

    const { name, answers } = data;
    if (!name || !Array.isArray(answers)) {
      return new Response("Missing name or answers", { status: 400 });
    }

    const fields = answers.map(a => ({
      name: "** **\n" + String(a.question).slice(0, 256),
      value: "```" + String(a.answer || "N/A").slice(0, 1000) + "```",
      inline: false
    }));

    const embed = {
      title: "✦ New Application — " + name,
      color: 0xFF2E63,
      fields,
      timestamp: new Date().toISOString(),
      footer: { text: "Editing Team Applications" }
    };

    const payload = {
      thread_name: name.slice(0, 100),
      content: "<@&1524197706925604865> new application received!",
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
