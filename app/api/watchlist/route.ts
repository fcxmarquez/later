import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth/server";
import type { MediaItem, MediaType, SavedMedia } from "@/lib/types";
import {
  deleteWatchlistItem,
  migrateWatchlistItems,
  saveWatchlistItem,
  setWatchlistItemWatched,
} from "@/lib/watchlist";

const MAX_MIGRATION_ITEMS = 1_000;

type MediaIdentity = {
  id: number;
  mediaType: MediaType;
};

async function getAuthorizedUserId() {
  const { data: session } = await getAuth().getSession();

  if (!session?.user) {
    return {
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    };
  }

  return { userId: session.user.id };
}

function isMediaType(value: unknown): value is MediaType {
  return value === "movie" || value === "tv";
}

function isMediaIdentity(value: unknown): value is MediaIdentity {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MediaIdentity>;

  return (
    Number.isInteger(candidate.id) &&
    Number(candidate.id) > 0 &&
    isMediaType(candidate.mediaType)
  );
}

function isMediaItem(value: unknown): value is MediaItem {
  if (!isMediaIdentity(value)) return false;
  const candidate = value as Partial<MediaItem>;

  return (
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    typeof candidate.overview === "string" &&
    typeof candidate.posterPath === "string" &&
    candidate.posterPath.length > 0 &&
    typeof candidate.backdropPath === "string" &&
    candidate.backdropPath.length > 0 &&
    typeof candidate.year === "string" &&
    typeof candidate.rating === "number" &&
    Number.isFinite(candidate.rating) &&
    candidate.rating >= 0 &&
    candidate.rating <= 10 &&
    Array.isArray(candidate.genres) &&
    candidate.genres.every((genre) => typeof genre === "string")
  );
}

function isSavedMedia(value: unknown): value is SavedMedia {
  if (!isMediaIdentity(value)) return false;
  const candidate = value as Partial<SavedMedia>;

  return (
    typeof candidate.title === "string" &&
    candidate.title.trim().length > 0 &&
    typeof candidate.overview === "string" &&
    typeof candidate.posterPath === "string" &&
    typeof candidate.backdropPath === "string" &&
    typeof candidate.year === "string" &&
    typeof candidate.rating === "number" &&
    Number.isFinite(candidate.rating) &&
    candidate.rating >= 0 &&
    candidate.rating <= 10 &&
    Array.isArray(candidate.genres) &&
    candidate.genres.every((genre) => typeof genre === "string") &&
    typeof candidate.watched === "boolean" &&
    typeof candidate.addedAt === "number" &&
    Number.isFinite(candidate.addedAt) &&
    candidate.addedAt >= 0 &&
    candidate.addedAt <= 8.64e15
  );
}

function dedupeMigrationItems(items: SavedMedia[]) {
  const deduped = new Map<string, SavedMedia>();

  for (const item of items) {
    const key = `${item.mediaType}:${item.id}`;
    const existing = deduped.get(key);

    if (!existing) {
      deduped.set(key, item);
      continue;
    }

    deduped.set(key, {
      ...existing,
      watched: existing.watched || item.watched,
      addedAt: Math.min(existing.addedAt, item.addedAt),
    });
  }

  return [...deduped.values()];
}

export async function PUT(request: Request) {
  const auth = await getAuthorizedUserId();
  if (auth.response) return auth.response;

  const body = (await request.json().catch(() => null)) as {
    items?: unknown;
  } | null;
  if (
    !body ||
    !Array.isArray(body.items) ||
    body.items.length > MAX_MIGRATION_ITEMS ||
    !body.items.every(isSavedMedia)
  ) {
    return NextResponse.json(
      { error: "Lista local no válida" },
      { status: 400 },
    );
  }

  const items = await migrateWatchlistItems(
    auth.userId,
    dedupeMigrationItems(body.items),
  );
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const auth = await getAuthorizedUserId();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  if (!isMediaItem(body)) {
    return NextResponse.json({ error: "Título no válido" }, { status: 400 });
  }

  const item = await saveWatchlistItem(auth.userId, body);
  return NextResponse.json({ item }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await getAuthorizedUserId();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  if (
    !isMediaIdentity(body) ||
    typeof (body as { watched?: unknown }).watched !== "boolean"
  ) {
    return NextResponse.json({ error: "Cambio no válido" }, { status: 400 });
  }

  const watched = (body as MediaIdentity & { watched: boolean }).watched;
  const item = await setWatchlistItemWatched(
    auth.userId,
    body.id,
    body.mediaType,
    watched,
  );

  if (!item) {
    return NextResponse.json(
      { error: "Título no encontrado" },
      { status: 404 },
    );
  }

  return NextResponse.json({ item });
}

export async function DELETE(request: Request) {
  const auth = await getAuthorizedUserId();
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  if (!isMediaIdentity(body)) {
    return NextResponse.json({ error: "Título no válido" }, { status: 400 });
  }

  await deleteWatchlistItem(auth.userId, body.id, body.mediaType);

  return new Response(null, { status: 204 });
}
