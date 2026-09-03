"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { depthRank } from "@/ndfb/data/depthChart";
import { PLAYERS, type Player } from "@/ndfb/data/roster";

type Mode = "number" | "position" | "name";
type Order = "sequential" | "shuffle";

type Card =
  | { kind: "number"; number: number; players: Player[] }
  | { kind: "position"; position: string; players: Player[] }
  | { kind: "name"; player: Player };

const MODES: { id: Mode; label: string }[] = [
  { id: "number", label: "Number" },
  { id: "position", label: "Position" },
  { id: "name", label: "Name" },
];

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function buildCards(mode: Mode): Card[] {
  if (mode === "number") {
    const byNumber = new Map<number, Player[]>();
    for (const player of PLAYERS) {
      const list = byNumber.get(player.number) ?? [];
      list.push(player);
      byNumber.set(player.number, list);
    }
    return [...byNumber.entries()]
      .sort(([a], [b]) => a - b)
      .map(([number, players]) => ({
        kind: "number" as const,
        number,
        players,
      }));
  }

  if (mode === "position") {
    const byPosition = new Map<string, Player[]>();
    for (const player of PLAYERS) {
      const list = byPosition.get(player.position) ?? [];
      list.push(player);
      byPosition.set(player.position, list);
    }
    return [...byPosition.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([position, players]) => ({
        kind: "position" as const,
        position,
        players: [...players].sort(
          (a, b) =>
            depthRank(position, a.name) - depthRank(position, b.name) ||
            a.number - b.number ||
            a.name.localeCompare(b.name),
        ),
      }));
  }

  return [...PLAYERS]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((player) => ({ kind: "name" as const, player }));
}

function buildDeck(mode: Mode, order: Order): Card[] {
  const cards = buildCards(mode);
  return order === "shuffle" ? shuffle(cards) : cards;
}

function formatNumber(n: number): string {
  return `#${n}`;
}

export function FlashcardApp() {
  const [mode, setMode] = useState<Mode>("number");
  const [order, setOrder] = useState<Order>("sequential");
  const [deck, setDeck] = useState<Card[]>(() => buildDeck("number", "sequential"));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const touchMoved = useRef(false);

  const card = deck[index] ?? null;
  const progress = deck.length > 0 ? `${index + 1} / ${deck.length}` : "0 / 0";

  const loadDeck = useCallback((nextMode: Mode, nextOrder: Order) => {
    setMode(nextMode);
    setOrder(nextOrder);
    setDeck(buildDeck(nextMode, nextOrder));
    setIndex(0);
    setFlipped(false);
  }, []);

  const handleNext = useCallback(() => {
    if (deck.length === 0) return;
    if (index >= deck.length - 1) {
      setDeck(buildDeck(mode, order));
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
    setFlipped(false);
  }, [deck.length, index, mode, order]);

  const toggleFlip = useCallback(() => {
    if (touchMoved.current) return;
    setFlipped((f) => !f);
  }, []);

  const prompt = useMemo(() => {
    if (!card) return "";
    if (card.kind === "number") return formatNumber(card.number);
    if (card.kind === "position") return card.position;
    return card.player.name;
  }, [card]);

  return (
    <div
      className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-[var(--ndfb-bg)]"
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <header className="mx-auto w-full max-w-lg shrink-0 text-center pt-1 pb-3 sm:pt-2 sm:pb-4">
        <p className="mb-0.5 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-[var(--ndfb-muted)] sm:text-xs">
          Notre Dame Football
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-[var(--ndfb-navy)] sm:text-2xl">
          Roster Flashcards
        </h1>
      </header>

      <div
        className="mx-auto mb-2 flex w-full max-w-lg shrink-0 gap-1 rounded-lg border border-[var(--ndfb-border)] bg-[var(--ndfb-surface)] p-1 sm:mb-3"
        role="tablist"
        aria-label="Study mode"
      >
        {MODES.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => loadDeck(m.id, order)}
              className="min-h-11 flex-1 rounded-md px-2 text-sm font-medium transition-colors sm:min-h-11 sm:px-3"
              style={{
                background: active ? "var(--ndfb-navy)" : "transparent",
                color: active ? "#fff" : "var(--ndfb-muted)",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div
        className="mx-auto mb-3 flex w-full max-w-lg shrink-0 gap-1 rounded-lg border border-[var(--ndfb-border)] bg-[var(--ndfb-surface)] p-1"
        role="tablist"
        aria-label="Card order"
      >
        {(
          [
            { id: "sequential" as const, label: "In order" },
            { id: "shuffle" as const, label: "Shuffle" },
          ] as const
        ).map((o) => {
          const active = order === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => loadDeck(mode, o.id)}
              className="min-h-10 flex-1 rounded-md px-2 text-sm font-medium transition-colors"
              style={{
                background: active ? "var(--ndfb-navy)" : "transparent",
                color: active ? "#fff" : "var(--ndfb-muted)",
              }}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <p className="mx-auto mb-2 w-full max-w-lg shrink-0 text-center text-xs text-[var(--ndfb-muted)] sm:mb-3 sm:text-sm">
        {progress}
        <span className="mx-2 opacity-40">·</span>
        Tap card to {flipped ? "hide" : "reveal"}
      </p>

      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col pb-3">
        <div
          role="button"
          tabIndex={0}
          onClick={toggleFlip}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
          onTouchStart={() => {
            touchMoved.current = false;
          }}
          onTouchMove={() => {
            touchMoved.current = true;
          }}
          className="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-[var(--ndfb-border)] bg-[var(--ndfb-surface)] px-4 py-5 text-center active:bg-[#f3f2ef] sm:px-6 sm:py-8"
          aria-label={flipped ? "Hide answer" : "Reveal answer"}
        >
          {!flipped ? (
            <span
              className="max-w-full break-words px-1 font-semibold leading-tight tracking-tight text-[var(--ndfb-navy)]"
              style={{
                fontSize:
                  card?.kind === "name"
                    ? "clamp(1.35rem, 6.5vw, 2.1rem)"
                    : "clamp(3rem, 16vw, 4.75rem)",
              }}
            >
              {prompt}
            </span>
          ) : (
            <AnswerFace card={card} />
          )}
        </div>
      </div>

      <div
        className="mx-auto flex w-full max-w-lg shrink-0"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={handleNext}
          className="min-h-12 w-full rounded-lg bg-[var(--ndfb-navy)] px-4 text-base font-medium text-white active:opacity-90 sm:min-h-12"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function AnswerFace({ card }: { card: Card | null }) {
  if (!card) return null;

  if (card.kind === "name") {
    const { player } = card;
    return (
      <div className="flex w-full flex-col items-center gap-2 sm:gap-3">
        <p className="max-w-full break-words text-base font-medium text-[var(--ndfb-navy)] sm:text-lg">
          {player.name}
        </p>
        <p className="text-4xl font-semibold tracking-tight text-[var(--ndfb-navy)] sm:text-5xl">
          {formatNumber(player.number)}
        </p>
        <p className="text-sm text-[var(--ndfb-muted)] sm:text-base">
          {player.position} · {player.year}
        </p>
      </div>
    );
  }

  const players = card.players;
  const heading = card.kind === "number" ? formatNumber(card.number) : card.position;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] sm:gap-3">
      <p className="sticky top-0 shrink-0 bg-[var(--ndfb-surface)] pb-1 text-left text-xs font-medium uppercase tracking-wider text-[var(--ndfb-gold)] sm:text-sm">
        {heading}
        <span className="ml-2 font-normal normal-case tracking-normal text-[var(--ndfb-muted)]">
          {players.length} player{players.length === 1 ? "" : "s"}
        </span>
      </p>
      <ul className="flex flex-col text-left">
        {players.map((player) => (
          <li
            key={`${player.name}-${player.number}-${player.position}`}
            className="flex flex-col gap-0.5 border-b border-[var(--ndfb-border)] py-2.5 last:border-0 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-3 sm:py-2"
          >
            <span className="break-words text-[0.95rem] font-medium leading-snug text-[var(--ndfb-navy)] sm:text-base">
              {player.name}
            </span>
            <span className="text-xs text-[var(--ndfb-muted)] sm:text-sm">
              {card.kind === "number"
                ? `${player.position} · ${player.year}`
                : `${formatNumber(player.number)} · ${player.year}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
