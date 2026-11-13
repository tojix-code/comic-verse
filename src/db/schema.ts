import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

// ============================================
// BETTER AUTH TABLES
// ============================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: text("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    userIdIdx: index("session_user_id_idx").on(table.userId),
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdIdx: index("account_user_id_idx").on(table.userId),
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    identifierIdx: index("verification_identifier_idx").on(table.identifier),
  })
);

// ============================================
// USER LIBRARY
// ============================================

export const libraryEntry = pgTable(
  "library_entry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceKey: varchar("source_key", { length: 80 }).notNull(),
    sourceSeriesId: text("source_series_id").notNull(),
    title: text("title").notNull(),
    coverUrl: text("cover_url"),
    contentType: varchar("content_type", { length: 24 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("library_entry_user_id_idx").on(table.userId),
    uniqueUserSeries: uniqueIndex("library_entry_user_series_unique").on(
      table.userId,
      table.sourceKey,
      table.sourceSeriesId
    ),
  })
);

// ============================================
// READING PROGRESS
// ============================================

export const readingProgress = pgTable(
  "reading_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sourceKey: varchar("source_key", { length: 80 }).notNull(),
    sourceSeriesId: text("source_series_id").notNull(),
    sourceChapterId: text("source_chapter_id").notNull(),
    seriesTitle: text("series_title").notNull(),
    chapterLabel: text("chapter_label"),
    pageNumber: integer("page_number").notNull().default(1),
    totalPages: integer("total_pages"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userIdx: index("reading_progress_user_id_idx").on(table.userId),
    uniqueUserChapter: uniqueIndex("reading_progress_user_chapter_unique").on(
      table.userId,
      table.sourceKey,
      table.sourceChapterId
    ),
  })
);

// ============================================
// CONTENT SOURCES
// ============================================

export const contentSource = pgTable("content_source", {
  id: text("id").primaryKey(),
  sourceKey: varchar("source_key", { length: 80 }).notNull().unique(),
  displayName: text("display_name").notNull(),
  homepageUrl: text("homepage_url").notNull(),
  accessMode: varchar("access_mode", { length: 32 })
    .notNull()
    .default("manual-link"),
  approved: boolean("approved").notNull().default(false),
  enabled: boolean("enabled").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================
// SERIES / COMIC CATALOGUE
// ============================================

export const series = pgTable(
  "series",
  {
    id: text("id").primaryKey(),
    sourceKey: varchar("source_key", { length: 80 }).notNull(),
    sourceSeriesId: text("source_series_id").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    synopsis: text("synopsis"),
    coverUrl: text("cover_url"),
    contentType: varchar("content_type", { length: 24 }).notNull(),
    contentRating: varchar("content_rating", { length: 32 }),
    publicationStatus: varchar("publication_status", { length: 32 }),
    releaseYear: integer("release_year"),
    creator: text("creator"),
    published: boolean("published").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    sourceSeriesUnique: uniqueIndex("series_source_series_unique").on(
      table.sourceKey,
      table.sourceSeriesId
    ),
    slugIdx: index("series_slug_idx").on(table.slug),
  })
);

// ============================================
// CHAPTERS
// ============================================

export const chapter = pgTable(
  "chapter",
  {
    id: text("id").primaryKey(),
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),
    sourceChapterId: text("source_chapter_id").notNull(),
    chapterNumber: varchar("chapter_number", { length: 32 }),
    title: text("title"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    seriesIdx: index("chapter_series_id_idx").on(table.seriesId),
    sourceChapterUnique: uniqueIndex("chapter_source_chapter_unique").on(
      table.seriesId,
      table.sourceChapterId
    ),
  })
);

// ============================================
// CHAPTER PAGES
// NEW TABLE
// ============================================

export const chapterPage = pgTable(
  "chapter_page",
  {
    id: text("id").primaryKey(),

    chapterId: text("chapter_id")
      .notNull()
      .references(() => chapter.id, { onDelete: "cascade" }),

    pageNumber: integer("page_number").notNull(),

    imageUrl: text("image_url").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    chapterIdx: index("chapter_page_chapter_id_idx").on(table.chapterId),

    uniqueChapterPage: uniqueIndex("chapter_page_unique").on(
      table.chapterId,
      table.pageNumber
    ),
  })
);

// ============================================
// REPORTS
// ============================================

export const report = pgTable(
  "report",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    seriesId: text("series_id").references(() => series.id, {
      onDelete: "set null",
    }),
    chapterId: text("chapter_id").references(() => chapter.id, {
      onDelete: "set null",
    }),
    reason: varchar("reason", { length: 80 }).notNull(),
    details: text("details"),
    status: varchar("status", { length: 24 }).notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => ({
    statusIdx: index("report_status_idx").on(table.status),
  })
);

// ============================================
// GENRES
// ============================================

export const genre = pgTable("genre", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
});

// ============================================
// SERIES-GENRE RELATIONSHIP
// ============================================

export const seriesGenre = pgTable(
  "series_genre",
  {
    seriesId: text("series_id")
      .notNull()
      .references(() => series.id, { onDelete: "cascade" }),

    genreId: text("genre_id")
      .notNull()
      .references(() => genre.id, { onDelete: "cascade" }),
  },
  (table) => ({
    primary: uniqueIndex("series_genre_unique").on(
      table.seriesId,
      table.genreId
    ),
  })
);