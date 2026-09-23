"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronRight,
  Download,
  Gamepad2,
  Library,
  ListFilter,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";

type GameStatus = "Играю" | "Пройдено" | "Хочу пройти" | "Библиотека";

type Game = {
  id: string;
  title: string;
  status: GameStatus;
  platform: string;
  progress: number;
  level?: number;
  maxLevel?: number;
  notes?: string;
  tasks?: string[];
  current?: boolean;
};

type DraftGame = Omit<Game, "id"> & { id?: string };

const STATUSES: Array<"Все" | GameStatus> = [
  "Все",
  "Играю",
  "Пройдено",
  "Хочу пройти",
  "Библиотека",
];

const libraryTitles = [
  "Age of Empires: Definitive Edition",
  "American Truck Simulator",
  "Anno 1800",
  "Anno 2205",
  "Arcanum",
  "Assassin's Creed Syndicate",
  "Assassin's Creed Unity",
  "Assassin's Creed Valhalla",
  "Baba Is You",
  "Baldur's Gate 3",
  "Command & Conquer Red Alert",
  "Crusader Kings III",
  "Crysis Remastered",
  "Cuphead",
  "Cyberpunk 2077",
  "DAVE THE DIVER",
  "Don't Starve",
  "Don't Starve Together",
  "DOOM",
  "DOOM Eternal",
  "DREDGE",
  "ENDLESS Legend",
  "Genshin Impact",
  "Grand Theft Auto III",
  "Grand Theft Auto IV",
  "Grand Theft Auto V",
  "Grand Theft Auto: San Andreas",
  "Grand Theft Auto: Vice City",
  "Halo: Combat Evolved",
  "Hidden Folks",
  "Hogwarts Legacy",
  "Honkai: Star Rail",
  "INSIDE",
  "It Takes Two",
  "Jurassic World Evolution 3",
  "Kingdom Come: Deliverance",
  "Mass Effect Legendary Edition",
  "Microsoft Flight Simulator 2024",
  "MIO: Memories in Orbit",
  "No Man's Sky",
  "Northgard: Definitive Edition",
  "Ori and the Blind Forest",
  "Ori and the Will of the Wisps",
  "Path of Exile 2",
  "Plague Inc: Evolved",
  "Planet Zoo",
  "Poly Bridge",
  "Portal",
  "S.T.A.L.K.E.R.: Shadow of Chernobyl",
  "Space Rangers HD: A War Apart",
  "Spiritfarer",
  "Spyro Reignited Trilogy",
  "Stardew Valley",
  "Subnautica",
  "Terraria",
  "The Elder Scrolls V: Skyrim Special Edition",
  "The Long Dark",
  "The Witcher 3: Wild Hunt",
  "Total War: EMPIRE Definitive Edition",
  "Total War: WARHAMMER II",
  "Warhammer 40,000: Gladius",
  "while True: learn()",
];

const seedGames: Game[] = [
  {
    id: "expedition-33",
    title: "Clair Obscur: Expedition 33",
    status: "Играю",
    platform: "PC / Xbox",
    level: 5,
    maxLevel: 99,
    progress: 5,
    notes: "Гюстав и Люнэ — 5 уровень. Прохожу спокойно, без спешки.",
    tasks: ["Продолжить сюжет", "Исследовать локации", "Проверить оружие и пиктосы"],
    current: true,
  },
  { id: "death-stranding", title: "Death Stranding Director's Cut", status: "Пройдено", platform: "PC", progress: 100 },
  { id: "indiana-jones", title: "Indiana Jones and the Great Circle", status: "Пройдено", platform: "PC / Xbox", progress: 100 },
  { id: "soma", title: "SOMA", status: "Пройдено", platform: "PC", progress: 100 },
  { id: "rdr2", title: "Red Dead Redemption 2", status: "Играю", platform: "PC", progress: 35 },
  { id: "oblivion", title: "The Elder Scrolls IV: Oblivion Remastered", status: "Играю", platform: "PC", progress: 10 },
  { id: "fallout-3", title: "Fallout 3 GOTY", status: "Играю", platform: "PC", progress: 10 },
  { id: "wuthering-waves", title: "Wuthering Waves", status: "Играю", platform: "PC", progress: 20 },
  { id: "silksong", title: "Hollow Knight: Silksong", status: "Играю", platform: "PC", progress: 20 },
  { id: "wow", title: "World of Warcraft", status: "Играю", platform: "PC", progress: 20 },
  { id: "onimusha", title: "Onimusha: Way of the Sword", status: "Хочу пройти", platform: "PC", progress: 0 },
  ...libraryTitles.map((title, index) => ({
    id: `library-${index + 1}`,
    title,
    status: "Библиотека" as const,
    platform: "PC",
    progress: 0,
  })),
];

const emptyDraft: DraftGame = {
  title: "",
  status: "Хочу пройти",
  platform: "PC",
  progress: 0,
  notes: "",
  tasks: [],
};

function clampProgress(value: unknown) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

function makeId(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 42);
  return `${base || "game"}-${Date.now().toString(36)}`;
}

function normalizeGames(value: unknown): Game[] {
  if (!Array.isArray(value)) return seedGames;
  return value
    .filter((game) => game && typeof game === "object" && typeof game.title === "string")
    .map((game, index) => ({
      id: typeof game.id === "string" ? game.id : `imported-${index}-${makeId(game.title)}`,
      title: game.title,
      status: STATUSES.includes(game.status) && game.status !== "Все" ? game.status : "Библиотека",
      platform: typeof game.platform === "string" ? game.platform : "PC",
      progress: clampProgress(game.progress),
      level: Number.isFinite(Number(game.level)) ? Number(game.level) : undefined,
      maxLevel: Number.isFinite(Number(game.maxLevel)) ? Number(game.maxLevel) : undefined,
      notes: typeof game.notes === "string" ? game.notes : "",
      tasks: Array.isArray(game.tasks) ? game.tasks.filter((task: unknown) => typeof task === "string") : [],
      current: Boolean(game.current),
    }));
}

function initials(title: string) {
  const parts = title.replace(/[^a-zа-яё0-9 ]/gi, " ").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "G";
}

function statusClass(status: GameStatus) {
  return status === "Играю"
    ? "playing"
    : status === "Пройдено"
      ? "done"
      : status === "Хочу пройти"
        ? "wishlist"
        : "library";
}

function fallbackAdvice(game: Game, minutes: string) {
  const firstTask = game.tasks?.[0];
  if (firstTask) return `${minutes} мин: ${firstTask}. После этого сохрани прогресс и остановись на удобной точке.`;
  if (game.progress >= 100) return "Игра пройдена. Можно дописать короткое впечатление или выбрать следующую игру.";
  if (game.progress === 0) return `${minutes} мин: запусти игру, проверь настройки и пройди первый небольшой этап.`;
  return `${minutes} мин: продолжи ближайшую сюжетную цель, затем обнови прогресс и одну заметку.`;
}

declare global {
  interface Document {
    modelContext?: {
      registerTool: (tool: {
        name: string;
        title?: string;
        description: string;
        inputSchema: Record<string, unknown>;
        annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
        execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
      }, options?: { signal?: AbortSignal }) => void | Promise<void>;
    };
  }
}

export default function Home() {
  const [games, setGames] = useState<Game[]>(seedGames);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof STATUSES)[number]>("Все");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<DraftGame>(emptyDraft);
  const [minutes, setMinutes] = useState("45");
  const [advice, setAdvice] = useState("");
  const [adviceSource, setAdviceSource] = useState<"openai" | "local" | "">("");
  const [adviceLoading, setAdviceLoading] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myGamesHubData");
      if (saved) setGames(normalizeGames(JSON.parse(saved)));
    } catch {
      toast.error("Не удалось прочитать старые данные");
    }
  }, []);

  const persist = (next: Game[]) => {
    setGames(next);
    localStorage.setItem("myGamesHubData", JSON.stringify(next));
  };

  const currentGame = games.find((game) => game.current) || games.find((game) => game.status === "Играю") || games[0];
  const filteredGames = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games.filter((game) =>
      (filter === "Все" || game.status === filter) &&
      (!needle || game.title.toLowerCase().includes(needle)),
    );
  }, [games, query, filter]);

  const counts = useMemo(() => ({
    playing: games.filter((game) => game.status === "Играю").length,
    done: games.filter((game) => game.status === "Пройдено").length,
    next: games.filter((game) => game.status === "Хочу пройти").length,
  }), [games]);

  const openGame = (game: Game) => {
    setDraft({ ...game, tasks: [...(game.tasks || [])] });
    setAdvice("");
    setAdviceSource("");
    setSheetOpen(true);
  };

  const addGame = () => {
    setDraft({ ...emptyDraft, tasks: [] });
    setAdvice("");
    setAdviceSource("");
    setSheetOpen(true);
  };

  const saveDraft = () => {
    const title = draft.title.trim();
    if (!title) {
      toast.error("Напиши название игры");
      return;
    }
    const game: Game = {
      id: draft.id || makeId(title),
      title,
      status: draft.status,
      platform: draft.platform.trim() || "PC",
      progress: clampProgress(draft.progress),
      level: draft.level === undefined || draft.level === null ? undefined : Number(draft.level),
      maxLevel: draft.maxLevel === undefined || draft.maxLevel === null ? undefined : Number(draft.maxLevel),
      notes: draft.notes?.trim() || "",
      tasks: draft.tasks || [],
      current: draft.current,
    };
    const exists = games.some((item) => item.id === game.id);
    persist(exists ? games.map((item) => item.id === game.id ? game : item) : [game, ...games]);
    setSheetOpen(false);
    toast.success("Сохранено");
  };

  const selectCurrent = (id: string) => {
    persist(games.map((game) => ({ ...game, current: game.id === id })));
    toast.success("Текущая игра выбрана");
  };

  const deleteGame = () => {
    if (!draft.id) return;
    persist(games.filter((game) => game.id !== draft.id));
    setSheetOpen(false);
    toast.success("Игра удалена");
  };

  const askAi = async () => {
    const game = draft.id ? games.find((item) => item.id === draft.id) : undefined;
    const source = game || ({ ...draft, id: "draft" } as Game);
    setAdviceLoading(true);
    setAdvice("");
    setAdviceSource("");
    try {
      const response = await fetch("/api/advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: source, minutes: Number(minutes) }),
      });
      if (!response.ok) throw new Error("request_failed");
      const data = await response.json() as { advice?: string; source?: "openai" | "local" };
      setAdvice(data.advice || fallbackAdvice(source, minutes));
      setAdviceSource(data.source || "local");
    } catch {
      setAdvice(fallbackAdvice(source, minutes));
      setAdviceSource("local");
    } finally {
      setAdviceLoading(false);
    }
  };

  const exportGames = () => {
    const blob = new Blob([JSON.stringify(games, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "my-games-hub.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importGames = async (file?: File) => {
    if (!file) return;
    try {
      const imported = normalizeGames(JSON.parse(await file.text()));
      if (!imported.length) throw new Error("empty");
      persist(imported);
      toast.success(`Загружено игр: ${imported.length}`);
    } catch {
      toast.error("Не удалось загрузить JSON");
    }
  };

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = async () => {
      await Promise.all([
        context.registerTool({
          name: "select_current_game",
          title: "Выбрать текущую игру",
          description: "Выбирает одну игру как текущую в My Games Hub.",
          inputSchema: { type: "object", properties: { title: { type: "string" } }, required: ["title"], additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: ({ title }) => {
            const game = games.find((item) => item.title.toLowerCase() === String(title).toLowerCase());
            if (!game) throw new Error("Игра не найдена");
            selectCurrent(game.id);
            return { selected: game.title };
          },
        }, { signal: lifecycle.signal }),
        context.registerTool({
          name: "update_game_progress",
          title: "Обновить прогресс игры",
          description: "Обновляет прогресс существующей игры от 0 до 100 процентов.",
          inputSchema: { type: "object", properties: { title: { type: "string" }, progress: { type: "number", minimum: 0, maximum: 100 } }, required: ["title", "progress"], additionalProperties: false },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute: ({ title, progress }) => {
            const index = games.findIndex((item) => item.title.toLowerCase() === String(title).toLowerCase());
            if (index < 0) throw new Error("Игра не найдена");
            const next = games.map((item, itemIndex) => itemIndex === index ? { ...item, progress: clampProgress(progress) } : item);
            persist(next);
            return { title: next[index].title, progress: next[index].progress };
          },
        }, { signal: lifecycle.signal }),
      ]);
    };
    void register().catch(() => undefined);
    return () => lifecycle.abort();
  }, [games]);

  return (
    <main className="hub-shell">
      <Toaster richColors position="top-center" />
      <header className="hub-header">
        <div className="brand-mark"><Gamepad2 aria-hidden="true" /></div>
        <div className="brand-copy">
          <h1>My Games Hub</h1>
          <p>{games.length} игр · всё в одном месте</p>
        </div>
        <div className="header-actions">
          <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}><Upload /> Импорт</Button>
          <Button variant="outline" size="sm" onClick={exportGames}><Download /> Экспорт</Button>
          <Button size="sm" onClick={addGame}><Plus /> Добавить</Button>
          <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={(event) => void importGames(event.target.files?.[0])} />
        </div>
      </header>

      <section className="focus-panel" aria-labelledby="current-game-title">
        <div className="focus-emblem" aria-hidden="true">{initials(currentGame.title)}</div>
        <div className="focus-main">
          <span className="eyebrow"><Sparkles /> Сейчас играю</span>
          <h2 id="current-game-title">{currentGame.title}</h2>
          <div className="focus-meta">
            <span>{currentGame.platform}</span>
            {currentGame.level !== undefined && <span>Уровень {currentGame.level}{currentGame.maxLevel ? ` / ${currentGame.maxLevel}` : ""}</span>}
            <span>{currentGame.progress}%</span>
          </div>
          <Progress value={currentGame.progress} className="focus-progress" />
        </div>
        <div className="focus-next">
          <span>Следующий шаг</span>
          <strong>{currentGame.tasks?.[0] || "Продолжить ближайшую цель"}</strong>
          <Button size="sm" variant="secondary" onClick={() => openGame(currentGame)}>Открыть <ChevronRight /></Button>
        </div>
      </section>

      <section className="stats-row" aria-label="Статистика библиотеки">
        <div><Gamepad2 /><span><strong>{counts.playing}</strong> играю</span></div>
        <div><Check /><span><strong>{counts.done}</strong> пройдено</span></div>
        <div><Star /><span><strong>{counts.next}</strong> хочу пройти</span></div>
        <div><Library /><span><strong>{games.length}</strong> всего</span></div>
      </section>

      <section className="library-panel" aria-labelledby="library-title">
        <div className="library-topline">
          <div>
            <span className="eyebrow"><ListFilter /> Моя библиотека</span>
            <h2 id="library-title">Все игры</h2>
          </div>
          <div className="search-box">
            <Search aria-hidden="true" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти игру…" aria-label="Поиск игр" />
          </div>
        </div>

        <div className="filter-row" aria-label="Фильтр по статусу">
          {STATUSES.map((status) => (
            <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>
              {status}
              <span>{status === "Все" ? games.length : games.filter((game) => game.status === status).length}</span>
            </button>
          ))}
        </div>

        {filteredGames.length ? (
          <div className="games-grid">
            {filteredGames.map((game) => (
              <article key={game.id} className={`game-card ${game.current ? "current" : ""}`}>
                <button className="game-open" onClick={() => openGame(game)} aria-label={`Открыть ${game.title}`}>
                  <div className={`mini-cover cover-${statusClass(game.status)}`}>
                    <span>{initials(game.title)}</span>
                    {game.current && <Star className="current-star" fill="currentColor" />}
                  </div>
                  <div className="game-info">
                    <span className={`status-pill ${statusClass(game.status)}`}>{game.status}</span>
                    <h3>{game.title}</h3>
                    <div className="game-line"><span>{game.platform}</span><strong>{game.progress}%</strong></div>
                    <Progress value={game.progress} className="card-progress" />
                  </div>
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state"><AlertCircle /><h3>Ничего не найдено</h3><p>Измени поиск или выбери другой статус.</p></div>
        )}
      </section>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="game-sheet sm:max-w-xl">
          <SheetHeader className="sheet-heading">
            <SheetDescription>{draft.id ? "Карточка игры" : "Новая игра"}</SheetDescription>
            <SheetTitle>{draft.title || "Добавить игру"}</SheetTitle>
          </SheetHeader>
          <div className="sheet-body">
            <label>Название<Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <div className="form-grid">
              <label>Статус
                <Select value={draft.status} onValueChange={(value) => setDraft({ ...draft, status: value as GameStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.slice(1).map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label>Платформа<Input value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value })} /></label>
            </div>
            <div className="form-grid three">
              <label>Прогресс, %<Input type="number" min="0" max="100" value={draft.progress} onChange={(event) => setDraft({ ...draft, progress: clampProgress(event.target.value) })} /></label>
              <label>Уровень<Input type="number" min="0" value={draft.level ?? ""} onChange={(event) => setDraft({ ...draft, level: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
              <label>Макс. уровень<Input type="number" min="1" value={draft.maxLevel ?? ""} onChange={(event) => setDraft({ ...draft, maxLevel: event.target.value === "" ? undefined : Number(event.target.value) })} /></label>
            </div>
            <label>Заметки<Textarea value={draft.notes || ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Где остановился, что важно помнить…" /></label>
            <label>Следующие задачи<Textarea value={(draft.tasks || []).join("\n")} onChange={(event) => setDraft({ ...draft, tasks: event.target.value.split("\n").map((task) => task.trim()).filter(Boolean) })} placeholder="Каждая задача с новой строки" /></label>

            <section className="ai-box" aria-labelledby="ai-title">
              <div className="ai-title-row">
                <div><Bot /><span><small>{adviceSource === "openai" ? "OpenAI" : adviceSource === "local" ? "Локальный план" : "AI-помощник"}</small><strong id="ai-title">Что делать дальше?</strong></span></div>
                <Select value={minutes} onValueChange={setMinutes}>
                  <SelectTrigger size="sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20 минут</SelectItem>
                    <SelectItem value="45">45 минут</SelectItem>
                    <SelectItem value="90">90 минут</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="secondary" onClick={() => void askAi()} disabled={adviceLoading || !draft.title.trim()}>
                {adviceLoading ? <Loader2 className="animate-spin" /> : <Sparkles />} Подсказать без спойлеров
              </Button>
              {advice && <p className="ai-answer">{advice}</p>}
            </section>
          </div>
          <SheetFooter className="sheet-footer">
            {draft.id && (
              <div className="sheet-left-actions">
                <Button variant="outline" onClick={() => selectCurrent(draft.id!)} disabled={draft.current}><Star /> {draft.current ? "Текущая" : "Сделать текущей"}</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button variant="ghost" size="icon" aria-label="Удалить игру"><Trash2 /></Button></AlertDialogTrigger>
                  <AlertDialogContent size="sm">
                    <AlertDialogHeader><AlertDialogTitle>Удалить игру?</AlertDialogTitle><AlertDialogDescription>Карточка «{draft.title}» будет удалена с этого устройства.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Отмена</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={deleteGame}>Удалить</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
            <Button onClick={saveDraft}><Check /> Сохранить</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
}
