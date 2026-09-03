"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLAYERS, type Player } from "@/ndfb/data/roster";

type Mode = "number" | "position" | "name";

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
        players: [...players].sort((a, b) => a.number - b.number || a.name.localeCompare(b.name)),
      }));
  }

  return PLAYERS.map((player) => ({ kind: "name" as const, player }));
}

function buildDeck(mode: Mode): Card[] {
  return shuffle(buildCards(mode));
}

function formatNumber(n: number): string {
  return `#${n}`;
}

export function FlashcardApp() {
  const [mode, setMode] = useState<Mode>("number");
  const [deck, setDeck] = useState<Card[]>(() => buildCards("number"));
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const touchMoved = useRef(false);

  useEffect(() => {
    setDeck(buildDeck("number"));
  }, []);

  const card = deck[index] ?? null;
  const progress = deck.length > 0 ? `${index + 1} / ${deck.length}` : "0 / 0";

  const resetDeck = useCallback((nextMode: Mode) => {
    setMode(nextMode);
    setDeck(buildDeck(nextMode));
    setIndex(0);
    setFlipped(false);
  }, []);

  const handleShuffle = useCallback(() => {
    setDeck(buildDeck(mode));
    setIndex(0);
    setFlipped(false);
  }, [mode]);

  const handleNext = useCallback(() => {
    if (deck.length === 0) return;
    if (index >= deck.length - 1) {
      setDeck(buildDeck(mode));
      setIndex(0);
    } else {
      setIndex((i) => i + 1);
    }
    setFlipped(false);
  }, [deck.length, index, mode]);

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
      className="flex h-dvh max-h-dvh w-full flex-col overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 90% 50% at 50% 0%, #1a3a5c 0%, var(--ndfb-navy-deep) 55%)",
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingLeft: "max(1rem, env(safe-area-inset-left))",
        paddingRight: "max(1rem, env(safe-area-inset-right))",
      }}
    >
      <header className="mx-auto w-full max-w-lg shrink-0 text-center pt-1 pb-3 sm:pt-2 sm:pb-4">
        <p
          className="mb-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.22em] sm:text-xs sm:tracking-[0.25em]"
          style={{ color: "var(--ndfb-gold)" }}
        >
          Notre Dame Football
        </p>
        <h1
          className="text-xl font-bold tracking-tight sm:text-3xl"
          style={{ color: "var(--ndfb-cream)" }}
        >
          Roster Flashcards
        </h1>
      </header>

      <div
        className="mx-auto mb-3 flex w-full max-w-lg shrink-0 gap-1 rounded-xl p-1 sm:mb-4"
        style={{ background: "var(--ndfb-card)", border: "1px solid var(--ndfb-border)" }}
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
              onClick={() => resetDeck(m.id)}
              className="min-h-11 flex-1 rounded-lg px-2 text-sm font-semibold transition-colors sm:min-h-12 sm:px-3"
              style={{
                background: active ? "var(--ndfb-gold)" : "transparent",
                color: active ? "var(--ndfb-navy-deep)" : "var(--ndfb-muted)",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <p
        className="mx-auto mb-2 w-full max-w-lg shrink-0 text-center text-xs sm:mb-3 sm:text-sm"
        style={{ color: "var(--ndfb-muted)" }}
      >
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
          className="flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl px-4 py-5 text-center transition-transform active:scale-[0.99] sm:px-6 sm:py-8"
          style={{
            background: "var(--ndfb-card)",
            border: "1px solid var(--ndfb-border)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
          }}
          aria-label={flipped ? "Hide answer" : "Reveal answer"}
        >
          {!flipped ? (
            <span
              className="max-w-full break-words px-1 font-bold leading-tight tracking-tight"
              style={{
                color: "var(--ndfb-gold-bright)",
                fontSize:
                  card?.kind === "name"
                    ? "clamp(1.35rem, 6.5vw, 2.25rem)"
                    : "clamp(3.25rem, 18vw, 5.5rem)",
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
        className="mx-auto flex w-full max-w-lg shrink-0 gap-3"
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <button
          type="button"
          onClick={handleShuffle}
          className="min-h-12 flex-1 rounded-xl px-4 text-base font-semibold transition-opacity active:opacity-80 sm:min-h-14"
          style={{
            background: "transparent",
            border: "1px solid var(--ndfb-border)",
            color: "var(--ndfb-cream)",
          }}
        >
          Shuffle
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="min-h-12 flex-[1.5] rounded-xl px-4 text-base font-semibold transition-opacity active:opacity-80 sm:min-h-14"
          style={{
            background: "var(--ndfb-gold)",
            color: "var(--ndfb-navy-deep)",
          }}
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
        <p
          className="max-w-full break-words text-base font-semibold sm:text-lg"
          style={{ color: "var(--ndfb-cream)" }}
        >
          {player.name}
        </p>
        <p
          className="text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ color: "var(--ndfb-gold-bright)" }}
        >
          {formatNumber(player.number)}
        </p>
        <p className="text-sm sm:text-base" style={{ color: "var(--ndfb-muted)" }}>
          {player.position} · {player.year}
        </p>
      </div>
    );
  }

  const players = card.players;
  const heading = card.kind === "number" ? formatNumber(card.number) : card.position;

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-2 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] sm:gap-3">
      <p
        className="sticky top-0 shrink-0 pb-1 text-left text-xs font-semibold uppercase tracking-widest sm:text-sm"
        style={{
          color: "var(--ndfb-gold)",
          background: "var(--ndfb-card)",
        }}
      >
        {heading}
        <span
          className="ml-2 font-normal normal-case tracking-normal"
          style={{ color: "var(--ndfb-muted)" }}
        >
          {players.length} player{players.length === 1 ? "" : "s"}
        </span>
      </p>
      <ul className="flex flex-col gap-1 text-left sm:gap-2">
        {players.map((player) => (
          <li
            key={`${player.name}-${player.number}-${player.position}`}
            className="flex flex-col gap-0.5 border-b py-2.5 last:border-0 sm:flex-row sm:flex-wrap sm:items-baseline sm:justify-between sm:gap-x-3 sm:py-2"
            style={{ borderColor: "rgba(201, 151, 0, 0.15)" }}
          >
            <span
              className="break-words text-[0.95rem] font-semibold leading-snug sm:text-base"
              style={{ color: "var(--ndfb-cream)" }}
            >
              {player.name}
            </span>
            <span className="text-xs sm:text-sm" style={{ color: "var(--ndfb-muted)" }}>
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
