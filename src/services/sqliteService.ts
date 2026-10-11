import initSqlJs, { Database } from 'sql.js';
import { MediaItem, MusicTrack, StorageFolder } from '../types/media';

const SQLITE_IDB_NAME = 'novastream_sqlite_vault';
const SQLITE_IDB_STORE = 'sqlite_blobs';
const SQLITE_DB_KEY = 'main_database_bytes';

// Multi-layer resilient loader for SQLite WebAssembly
async function getSqlJsEngine(): Promise<any> {
  const getWasmUrl = (file: string) => {
    if (file.endsWith('.wasm')) {
      const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
      const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      return `${cleanBase}sql-wasm.wasm`;
    }
    return file;
  };

  // Tier 1: Local same-origin static WASM asset (fastest, zero external network dependency)
  try {
    return await initSqlJs({
      locateFile: getWasmUrl,
    });
  } catch (localErr) {
    console.warn('Direct streaming compile for local sql-wasm.wasm failed, trying ArrayBuffer fetch:', localErr);
  }

  // Tier 2: Fetch local WASM binary directly into ArrayBuffer (bypasses streaming compile HTTP status or MIME constraints)
  try {
    const wasmUrl = getWasmUrl('sql-wasm.wasm');
    const response = await fetch(wasmUrl);
    if (response.ok) {
      const wasmBinary = await response.arrayBuffer();
      const bytes = new Uint8Array(wasmBinary);
      // Verify valid WASM magic number (\0asm)
      if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x61 && bytes[2] === 0x73 && bytes[3] === 0x6d) {
        return await initSqlJs({
          wasmBinary,
        });
      }
    }
  } catch (bufErr) {
    console.warn('ArrayBuffer fetch failed, trying matching CDN fallback:', bufErr);
  }

  // Tier 3: Version-matched 1.14.2 CDN fallback
  try {
    return await initSqlJs({
      locateFile: (file) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.14.2/${file}`,
    });
  } catch (cdnErr) {
    console.warn('CDN fallback also failed:', cdnErr);
    throw cdnErr;
  }
}

export interface SqlQueryResult {
  columns: string[];
  values: any[][];
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

export interface SqliteStats {
  dbSizeBytes: number;
  mediaCount: number;
  musicCount: number;
  folderCount: number;
  tableCount: number;
  indexCount: number;
  isWasmActive: boolean;
  version: string;
}

class SqliteService {
  private db: Database | null = null;
  private sqlEngine: any = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  private memoryFallbackData: {
    media: MediaItem[];
    music: MusicTrack[];
    folders: StorageFolder[];
  } = { media: [], music: [], folders: [] };

  constructor() {
    // Lazily initialized
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized && this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const SQL = await getSqlJsEngine();
        this.sqlEngine = SQL;

        // Try to load existing database bytes from IndexedDB
        const savedBytes = await this.loadBytesFromIndexedDb();
        if (savedBytes && savedBytes.length > 0) {
          try {
            this.db = new SQL.Database(savedBytes);
          } catch (e) {
            console.warn('Failed to parse saved SQLite bytes, creating fresh database:', e);
            this.db = new SQL.Database();
          }
        } else {
          this.db = new SQL.Database();
        }

        this.createSchema();
        this.isInitialized = true;
      } catch (err) {
        console.warn('Sql.js WebAssembly initialization failed or deferred, using resilient SQL engine fallback:', err);
        this.isInitialized = true;
      }
    })();

    return this.initPromise;
  }

  private createSchema(): void {
    if (!this.db) return;

    const schemaSql = `
      -- 1. Media Library Table
      CREATE TABLE IF NOT EXISTS media_items (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        original_title TEXT,
        type TEXT NOT NULL,
        year INTEGER,
        rating_douban REAL,
        rating_imdb REAL,
        release_date TEXT,
        runtime_minutes INTEGER,
        resolution TEXT,
        hdr TEXT,
        video_codec TEXT,
        audio_codec TEXT,
        poster_url TEXT,
        backdrop_url TEXT,
        video_url TEXT,
        file_path TEXT,
        file_size_gb REAL,
        bitrate_mbps REAL,
        director TEXT,
        overview TEXT,
        genres_json TEXT,
        cast_json TEXT,
        audio_tracks_json TEXT,
        subtitles_json TEXT,
        available_subtitles_json TEXT,
        cover_options_json TEXT,
        nfo_content TEXT,
        matched_source TEXT,
        match_score REAL,
        added_date TEXT,
        watch_progress_sec INTEGER,
        is_favorite INTEGER,
        folder_id TEXT
      );

      -- 2. Music Tracks Table
      CREATE TABLE IF NOT EXISTS music_tracks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        album TEXT,
        duration_sec INTEGER,
        cover_url TEXT,
        audio_url TEXT,
        year INTEGER,
        genre TEXT,
        format TEXT,
        sample_rate TEXT,
        bit_depth TEXT,
        bitrate_kbps INTEGER,
        is_favorite INTEGER,
        folder_id TEXT,
        lrc_lyrics TEXT,
        nfo_content TEXT
      );

      -- 3. Storage Folders Table
      CREATE TABLE IF NOT EXISTS storage_folders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        path TEXT NOT NULL,
        type TEXT NOT NULL,
        total_files INTEGER,
        total_size_gb REAL,
        last_scanned TEXT,
        status TEXT
      );

      -- 4. High-Performance Query Indexes
      CREATE INDEX IF NOT EXISTS idx_media_title ON media_items(title);
      CREATE INDEX IF NOT EXISTS idx_media_type ON media_items(type);
      CREATE INDEX IF NOT EXISTS idx_media_year ON media_items(year);
      CREATE INDEX IF NOT EXISTS idx_media_rating_imdb ON media_items(rating_imdb);
      CREATE INDEX IF NOT EXISTS idx_media_director ON media_items(director);
      CREATE INDEX IF NOT EXISTS idx_media_resolution ON media_items(resolution);
      CREATE INDEX IF NOT EXISTS idx_media_is_favorite ON media_items(is_favorite);

      CREATE INDEX IF NOT EXISTS idx_music_title ON music_tracks(title);
      CREATE INDEX IF NOT EXISTS idx_music_artist ON music_tracks(artist);
      CREATE INDEX IF NOT EXISTS idx_music_format ON music_tracks(format);
    `;

    this.db.exec(schemaSql);
  }

  /**
   * Synchronize media items from application state into SQLite database
   */
  public async syncMediaItems(items: MediaItem[]): Promise<void> {
    await this.initialize();
    this.memoryFallbackData.media = [...items];

    if (!this.db) return;

    try {
      this.db.exec('BEGIN TRANSACTION;');

      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO media_items (
          id, title, original_title, type, year,
          rating_douban, rating_imdb, release_date, runtime_minutes,
          resolution, hdr, video_codec, audio_codec,
          poster_url, backdrop_url, video_url, file_path, file_size_gb, bitrate_mbps,
          director, overview, genres_json, cast_json, audio_tracks_json,
          subtitles_json, available_subtitles_json, cover_options_json,
          nfo_content, matched_source, match_score, added_date,
          watch_progress_sec, is_favorite, folder_id
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        );
      `);

      for (const item of items) {
        insertStmt.run([
          item.id,
          item.title,
          item.originalTitle || '',
          item.type,
          item.year,
          item.ratingDouban || 0,
          item.ratingImdb || 0,
          item.releaseDate || '',
          item.runtimeMinutes || 0,
          item.resolution || '',
          item.hdr || '',
          item.videoCodec || '',
          item.audioCodec || '',
          item.posterUrl || '',
          item.backdropUrl || '',
          item.videoUrl || '',
          item.filePath || '',
          item.fileSizeGB || 0,
          item.bitrateMbps || 0,
          item.director || '',
          item.overview || '',
          JSON.stringify(item.genres || []),
          JSON.stringify(item.cast || []),
          JSON.stringify(item.audioTracks || []),
          JSON.stringify(item.subtitles || []),
          JSON.stringify(item.availableSubtitles || []),
          JSON.stringify(item.coverOptions || []),
          item.nfoContent || '',
          item.matchedSource || '',
          item.matchScore || 0,
          item.addedDate || '',
          item.watchProgressSec || 0,
          item.isFavorite ? 1 : 0,
          item.folderId || '',
        ]);
      }

      insertStmt.free();
      this.db.exec('COMMIT;');
      await this.persistToIndexedDb();
    } catch (e) {
      console.error('Error inserting media items into SQLite:', e);
      try {
        this.db.exec('ROLLBACK;');
      } catch (rbErr) {}
    }
  }

  /**
   * Synchronize music tracks into SQLite database
   */
  public async syncMusicTracks(tracks: MusicTrack[]): Promise<void> {
    await this.initialize();
    this.memoryFallbackData.music = [...tracks];

    if (!this.db) return;

    try {
      this.db.exec('BEGIN TRANSACTION;');

      const insertStmt = this.db.prepare(`
        INSERT OR REPLACE INTO music_tracks (
          id, title, artist, album, duration_sec,
          cover_url, audio_url, year, genre, format,
          sample_rate, bit_depth, bitrate_kbps, is_favorite,
          folder_id, lrc_lyrics, nfo_content
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?
        );
      `);

      for (const trk of tracks) {
        insertStmt.run([
          trk.id,
          trk.title,
          trk.artist,
          trk.album,
          trk.durationSec,
          trk.coverUrl,
          trk.audioUrl,
          trk.year,
          trk.genre,
          trk.format,
          trk.sampleRate,
          trk.bitDepth || '',
          trk.bitrateKbps,
          trk.isFavorite ? 1 : 0,
          trk.folderId || '',
          trk.lrcLyrics,
          trk.nfoContent || '',
        ]);
      }

      insertStmt.free();
      this.db.exec('COMMIT;');
      await this.persistToIndexedDb();
    } catch (e) {
      console.error('Error inserting music tracks into SQLite:', e);
      try {
        this.db.exec('ROLLBACK;');
      } catch (rbErr) {}
    }
  }

  /**
   * High-Performance Media Search via SQLite Query
   */
  public async searchMedia(options: {
    query?: string;
    type?: string;
    minRating?: number;
    year?: number;
    resolution?: string;
    codec?: string;
    onlyFavorites?: boolean;
    sortBy?: 'year' | 'rating_imdb' | 'rating_douban' | 'title';
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<MediaItem[]> {
    await this.initialize();

    if (!this.db) {
      // Resilient fallback query
      return this.memoryFallbackData.media.filter((item) => {
        if (options.query) {
          const q = options.query.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q) || item.originalTitle.toLowerCase().includes(q);
          const matchDirector = item.director.toLowerCase().includes(q);
          const matchGenres = item.genres.some((g) => g.toLowerCase().includes(q));
          if (!matchTitle && !matchDirector && !matchGenres) return false;
        }
        if (options.type && options.type !== 'all' && item.type !== options.type) return false;
        if (options.minRating && item.ratingImdb < options.minRating) return false;
        if (options.resolution && item.resolution !== options.resolution) return false;
        if (options.onlyFavorites && !item.isFavorite) return false;
        return true;
      });
    }

    try {
      const conditions: string[] = [];
      const params: any[] = [];

      if (options.query && options.query.trim()) {
        const qPattern = `%${options.query.trim()}%`;
        conditions.push(`(title LIKE ? OR original_title LIKE ? OR director LIKE ? OR genres_json LIKE ? OR overview LIKE ?)`);
        params.push(qPattern, qPattern, qPattern, qPattern, qPattern);
      }

      if (options.type && options.type !== 'all') {
        conditions.push(`type = ?`);
        params.push(options.type);
      }

      if (options.minRating) {
        conditions.push(`rating_imdb >= ?`);
        params.push(options.minRating);
      }

      if (options.year) {
        conditions.push(`year = ?`);
        params.push(options.year);
      }

      if (options.resolution && options.resolution !== 'all') {
        conditions.push(`resolution = ?`);
        params.push(options.resolution);
      }

      if (options.codec && options.codec !== 'all') {
        conditions.push(`video_codec LIKE ?`);
        params.push(`%${options.codec}%`);
      }

      if (options.onlyFavorites) {
        conditions.push(`is_favorite = 1`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const sortColumn = options.sortBy || 'rating_imdb';
      const order = options.sortOrder || 'DESC';
      const sql = `SELECT * FROM media_items ${whereClause} ORDER BY ${sortColumn} ${order};`;

      const stmt = this.db.prepare(sql);
      stmt.bind(params);

      const items: MediaItem[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        items.push(this.rowToMediaItem(row));
      }
      stmt.free();

      return items;
    } catch (e) {
      console.warn('SQLite query failed, falling back to memory search:', e);
      return this.memoryFallbackData.media;
    }
  }

  /**
   * Execute Raw SQL with performance timing
   */
  public async executeRawSql(sql: string): Promise<SqlQueryResult> {
    await this.initialize();
    const start = performance.now();

    if (!this.db) {
      return {
        columns: ['info'],
        values: [['SQLite Engine (Fallback Mode): Database is currently running in-memory']],
        rowCount: 1,
        executionTimeMs: Math.round(performance.now() - start),
      };
    }

    try {
      const results = this.db.exec(sql);
      const executionTimeMs = parseFloat((performance.now() - start).toFixed(2));

      if (!results || results.length === 0) {
        // Successful non-select statement (e.g. UPDATE, INSERT, CREATE TABLE)
        await this.persistToIndexedDb();
        return {
          columns: ['status'],
          values: [['Statement executed successfully. Changes persisted to SQLite binary store.']],
          rowCount: 0,
          executionTimeMs,
        };
      }

      const firstResult = results[0];
      return {
        columns: firstResult.columns,
        values: firstResult.values,
        rowCount: firstResult.values.length,
        executionTimeMs,
      };
    } catch (err: any) {
      return {
        columns: ['error'],
        values: [[err.message || String(err)]],
        rowCount: 0,
        executionTimeMs: parseFloat((performance.now() - start).toFixed(2)),
        error: err.message || String(err),
      };
    }
  }

  /**
   * Get SQLite Database Statistics
   */
  public async getStats(): Promise<SqliteStats> {
    await this.initialize();

    let mediaCount = this.memoryFallbackData.media.length;
    let musicCount = this.memoryFallbackData.music.length;
    let folderCount = this.memoryFallbackData.folders.length;
    let tableCount = 3;
    let indexCount = 10;
    let dbSizeBytes = 0;

    if (this.db) {
      try {
        const mRes = this.db.exec('SELECT COUNT(*) as cnt FROM media_items;');
        if (mRes.length > 0) mediaCount = Number(mRes[0].values[0][0]);

        const muRes = this.db.exec('SELECT COUNT(*) as cnt FROM music_tracks;');
        if (muRes.length > 0) musicCount = Number(muRes[0].values[0][0]);

        const tblRes = this.db.exec("SELECT COUNT(*) FROM sqlite_master WHERE type='table';");
        if (tblRes.length > 0) tableCount = Number(tblRes[0].values[0][0]);

        const idxRes = this.db.exec("SELECT COUNT(*) FROM sqlite_master WHERE type='index';");
        if (idxRes.length > 0) indexCount = Number(idxRes[0].values[0][0]);

        const exported = this.db.export();
        dbSizeBytes = exported.byteLength;
      } catch (e) {
        console.warn('Error reading SQLite stats:', e);
      }
    }

    return {
      dbSizeBytes,
      mediaCount,
      musicCount,
      folderCount,
      tableCount,
      indexCount,
      isWasmActive: !!this.db,
      version: 'SQLite 3.46 (WebAssembly Wasm2JS)',
    };
  }

  /**
   * Export the actual SQLite .db / .sqlite binary file
   */
  public async exportDatabaseBinary(): Promise<Uint8Array | null> {
    await this.initialize();
    if (!this.db) return null;
    return this.db.export();
  }

  /**
   * Import a user-provided .sqlite / .db binary file
   */
  public async importDatabaseBinary(bytes: Uint8Array): Promise<boolean> {
    try {
      await this.initialize();
      const SQL = this.sqlEngine || (await getSqlJsEngine());
      const newDb = new SQL.Database(bytes);
      this.db = newDb;
      await this.persistToIndexedDb();
      return true;
    } catch (e) {
      console.error('Failed to import SQLite binary file:', e);
      return false;
    }
  }

  // --- IndexedDB Persistence Helpers ---

  private async persistToIndexedDb(): Promise<void> {
    if (!this.db) return;
    try {
      const binaryData = this.db.export();
      await this.saveBytesToIndexedDb(binaryData);
    } catch (e) {
      console.warn('Failed to persist SQLite to IndexedDB:', e);
    }
  }

  private openIdb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(SQLITE_IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SQLITE_IDB_STORE)) {
          db.createObjectStore(SQLITE_IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async saveBytesToIndexedDb(bytes: Uint8Array): Promise<void> {
    const db = await this.openIdb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(SQLITE_IDB_STORE, 'readwrite');
      const store = tx.objectStore(SQLITE_IDB_STORE);
      const req = store.put(bytes, SQLITE_DB_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async loadBytesFromIndexedDb(): Promise<Uint8Array | null> {
    try {
      const db = await this.openIdb();
      return new Promise((resolve) => {
        const tx = db.transaction(SQLITE_IDB_STORE, 'readonly');
        const store = tx.objectStore(SQLITE_IDB_STORE);
        const req = store.get(SQLITE_DB_KEY);
        req.onsuccess = () => {
          if (req.result instanceof Uint8Array) {
            resolve(req.result);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch (e) {
      return null;
    }
  }

  private rowToMediaItem(row: Record<string, any>): MediaItem {
    let genres: string[] = [];
    try {
      genres = JSON.parse(row.genres_json || '[]');
    } catch (e) {}

    let cast: any[] = [];
    try {
      cast = JSON.parse(row.cast_json || '[]');
    } catch (e) {}

    let audioTracks: any[] = [];
    try {
      audioTracks = JSON.parse(row.audio_tracks_json || '[]');
    } catch (e) {}

    let subtitles: any[] = [];
    try {
      subtitles = JSON.parse(row.subtitles_json || '[]');
    } catch (e) {}

    let availableSubtitles: any[] = [];
    try {
      availableSubtitles = JSON.parse(row.available_subtitles_json || '[]');
    } catch (e) {}

    let coverOptions: any[] = [];
    try {
      coverOptions = JSON.parse(row.cover_options_json || '[]');
    } catch (e) {}

    return {
      id: String(row.id),
      title: String(row.title),
      originalTitle: String(row.original_title || row.title),
      type: row.type || 'movie',
      year: Number(row.year) || 2024,
      ratingDouban: Number(row.rating_douban) || 0,
      ratingImdb: Number(row.rating_imdb) || 0,
      releaseDate: String(row.release_date || ''),
      runtimeMinutes: Number(row.runtime_minutes) || 120,
      resolution: row.resolution || '4K UHD',
      hdr: row.hdr || 'SDR',
      videoCodec: row.videoCodec || row.video_codec || 'HEVC/H.265',
      audioCodec: row.audioCodec || row.audio_codec || 'Dolby Atmos TrueHD 7.1',
      audioTracks,
      subtitles,
      availableSubtitles,
      coverOptions,
      overview: String(row.overview || ''),
      genres,
      director: String(row.director || ''),
      cast,
      posterUrl: String(row.poster_url || ''),
      backdropUrl: String(row.backdrop_url || ''),
      videoUrl: String(row.video_url || ''),
      filePath: String(row.file_path || ''),
      fileSizeGB: Number(row.file_size_gb) || 0,
      bitrateMbps: Number(row.bitrate_mbps) || 0,
      nfoContent: String(row.nfo_content || ''),
      matchedSource: (String(row.matched_source || 'TMDB') as any),
      matchScore: Number(row.match_score) || 98.0,
      addedDate: String(row.added_date || ''),
      watchProgressSec: Number(row.watch_progress_sec) || 0,
      isFavorite: Boolean(row.is_favorite),
      folderId: String(row.folder_id || ''),
    };
  }
}

export const sqliteService = new SqliteService();
