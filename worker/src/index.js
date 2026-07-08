export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const secret = request.headers.get("X-Submit-Secret");
    if (!env.SUBMIT_SECRET || secret !== env.SUBMIT_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    let data;
    try {
      data = await request.json();
    } catch {
      return new Response("Bad JSON body", { status: 400 });
    }

    const answers = data.answers || {};

    const nameKey = Object.keys(answers).find((k) => /name|username|discord/i.test(k));
    const applicantName = (nameKey ? String(answers[nameKey]) : "").trim() || "New Applicant";

    const fields = Object.entries(answers)
      .slice(0, 25)
      .map(([question, answer]) => ({
        name: question.slice(0, 256) || "\u200b",
        value:
          (Array.isArray(answer) ? answer.join(", ") : String(answer ?? "")).slice(0, 1024) ||
          "\u200b",
        inline: false,
      }));

    const embed = {
      title: "📋 New Editing Unit Application",
      description: `Application from **${applicantName}**`,
      color: 0xff2d78,
      fields,
      timestamp: data.submittedAt || new Date().toISOString(),
      footer: { text: "Editing Unit Applications" },
      ...(env.EMBED_THUMBNAIL_URL ? { thumbnail: { url: env.EMBED_THUMBNAIL_URL } } : {}),
    };

    const discordPayload = {
      username: "Applications",
      ...(env.EMBED_AVATAR_URL ? { avatar_url: env.EMBED_AVATAR_URL } : {}),
      ...(env.ROLE_ID ? { content: `<@&${env.ROLE_ID}>` } : {}),
      allowed_mentions: { roles: env.ROLE_ID ? [env.ROLE_ID] : [] },
      thread_name: `${applicantName}'s Application`.slice(0, 100),
      ...(env.TAG_PENDING_ID ? { applied_tags: [env.TAG_PENDING_ID] } : {}),
      embeds: [embed],
    };

    const discordRes = await fetch(`${env.DISCORD_WEBHOOK_URL}?wait=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text();
      console.error("Discord error:", discordRes.status, errText);
      return new Response(`Discord error: ${errText}`, { status: 502 });
    }

    return new Response("OK", { status: 200 });
  },
};
