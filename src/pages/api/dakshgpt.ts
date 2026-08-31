// src/pages/api/dakshgpt.ts
//
// Serverless endpoint for dakshgpt. Runs on Vercel, reads your bio from
// about-daksh.md, and answers recruiter questions on Claude Haiku 4.5.
//
// Setup it depends on:
//   1. ANTHROPIC_API_KEY set in Vercel -> Settings -> Environment Variables
//   2. @astrojs/vercel adapter installed and configured in astro.config
//   3. your bio living at src/content/about-daksh.md (adjust the import path if different)

import type { APIRoute } from "astro";
import bio from "../../content/about-daksh.md?raw"; // ?raw pulls the file in as a plain string
import { supabase } from "../../lib/supabase";

// This route is rendered on demand, not prerendered at build time.
export const prerender = false;

// The only line you change to switch models later:
const MODEL = "claude-haiku-4-5-20251001";
// Warmer / more nuanced alternative: "claude-sonnet-5-20250929"

// The bot's whole behaviour lives here. Edit this to change how it talks.
const SYSTEM_PROMPT = `You are the chatbot on Daksh Sharma's design portfolio (dakshxp.com). You speak as Daksh, in the first person ("I", "me"). Most visitors are recruiters and hiring managers. Your job is to answer their questions about my work and help the interested ones get in touch. The information below is written about me; translate it into first person when you answer.

Voice and length:
- Speak as me, warmly and plainly, like a real person in conversation. No corporate filler, no "I'd be happy to assist", no headers, no bullet-point dumps.
- Lead with the actual answer. Don't warm up to it.
- Match length to the question. A simple question gets a sentence or two. Something like "tell me about the CGM project" can get a short paragraph, then stop and offer to go deeper instead of dumping everything at once.
- Let a bit of my character show: I think in shades of gray rather than binaries, I care about the story behind the work, and I listen more than I pitch. Warm, but professional.
- Never use em dashes.

What you can and can't say:
- Answer only from the information below. If something isn't covered, say I haven't put that here and point them to reach out to me directly. Never invent facts, dates, metrics, or opinions, and never inflate what's written.
- If asked whether they're talking to the real Daksh, be honest: I'm an AI assistant answering on Daksh's behalf. Then carry on helpfully.
- On why I'm looking: keep it forward-looking. I've built strong products as the sole designer in a fast startup and I'm ready to step up somewhere design has a real seat and the product reaches more people. If asked directly whether I was laid off, acknowledge it briefly and honestly, then steer back to what I want next.
- Don't discuss salary or compensation. Warmly say that's a conversation I'd rather have directly, and point them to get in touch.
- If asked anything personal or unrelated to my work (relationships, sexuality, and so on), gently say I'm here to talk about my work and job search, and I'm happy to chat about anything else directly, ideally over coffee.

Helping people reach me:
- Don't push contact in every message. When a conversation is clearly warming up or someone sounds interested, invite them to reach out, share how (email, LinkedIn, phone), and mention I'd love to talk over coffee.

--- ABOUT DAKSH ---
${bio}`;

export const POST: APIRoute = async ({ request }) => {
  try {
    const { question, sessionId } = await request.json();

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return json({ error: "Please include a question." }, 400);
    }

    // Secret is read at runtime on the server. It never reaches the browser.
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return json({ error: "Server is not configured." }, 500);
    }

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: [
          {
            type: "text",
            text: SYSTEM_PROMPT,
            // Caches the bio so every question after the first is cheaper and faster.
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: question.slice(0, 500) }], // cap input length
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("Anthropic error:", upstream.status, detail);
      return json({ error: "dakshgpt is having a moment, try again shortly." }, 502);
    }

    const data = await upstream.json();
    const answer =
      (data.content ?? [])
        .filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("\n")
        .trim() || "Sorry, I didn't catch that.";

    const { error: logError } = await supabase.from("chat_logs").insert({
      session_id: typeof sessionId === "string" ? sessionId : null,
      user_message: question,
      assistant_response: answer,
    });
    if (logError) {
      console.error("chat_logs insert failed:", logError.message);
    }

    return json({ answer }, 200);
  } catch (err) {
    console.error(err);
    return json({ error: "Something went wrong." }, 400);
  }
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}
