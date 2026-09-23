import { env } from "cloudflare:workers";

type GameInput = {
  title?: unknown;
  status?: unknown;
  platform?: unknown;
  progress?: unknown;
  level?: unknown;
  maxLevel?: unknown;
  notes?: unknown;
  tasks?: unknown;
};

function fallback(game: GameInput, minutes: number) {
  const tasks = Array.isArray(game.tasks) ? game.tasks.filter((task) => typeof task === "string") : [];
  if (tasks[0]) return `${minutes} мин: ${tasks[0]}. После этого сохрани прогресс и остановись на удобной точке.`;
  const progress = Math.max(0, Math.min(100, Number(game.progress) || 0));
  if (progress >= 100) return "Игра пройдена. Запиши короткое впечатление или выбери следующую игру.";
  if (progress === 0) return `${minutes} мин: запусти игру, проверь настройки и пройди первый небольшой этап.`;
  return `${minutes} мин: продолжи ближайшую цель, затем обнови прогресс и одну заметку.`;
}

function getOutputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const response = payload as { output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  return (response.output || [])
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
}

export async function POST(request: Request) {
  let body: { game?: GameInput; minutes?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Неверный запрос" }, { status: 400 });
  }

  const game = body.game || {};
  const title = typeof game.title === "string" ? game.title.trim().slice(0, 140) : "";
  if (!title) return Response.json({ error: "Нужно название игры" }, { status: 400 });

  const minutes = [20, 45, 90].includes(Number(body.minutes)) ? Number(body.minutes) : 45;
  const runtimeEnv = env as unknown as Record<string, string | undefined>;
  const apiKey = runtimeEnv.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ advice: fallback(game, minutes), source: "local" });
  }

  const compactGame = {
    title,
    status: String(game.status || ""),
    platform: String(game.platform || ""),
    progress: Math.max(0, Math.min(100, Number(game.progress) || 0)),
    level: Number.isFinite(Number(game.level)) ? Number(game.level) : null,
    maxLevel: Number.isFinite(Number(game.maxLevel)) ? Number(game.maxLevel) : null,
    notes: typeof game.notes === "string" ? game.notes.slice(0, 700) : "",
    tasks: Array.isArray(game.tasks) ? game.tasks.filter((task) => typeof task === "string").slice(0, 8) : [],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-6-luna",
        store: false,
        max_output_tokens: 160,
        instructions: "Ты помощник по видеоиграм. Отвечай по-русски, очень кратко и понятно. Дай один безопасный следующий шаг на указанное время. Не добавляй сюжетных спойлеров, если пользователь их явно не просил. Не выдумывай факты об игре; опирайся на заметки и задачи пользователя.",
        input: `Свободно минут: ${minutes}. Данные игры: ${JSON.stringify(compactGame)}`,
      }),
    });

    if (!response.ok) {
      return Response.json({ advice: fallback(game, minutes), source: "local" });
    }
    const advice = getOutputText(await response.json());
    return Response.json({ advice: advice || fallback(game, minutes), source: advice ? "openai" : "local" });
  } catch {
    return Response.json({ advice: fallback(game, minutes), source: "local" });
  }
}
