# belajar-vibe-coding

Backend API dengan Bun, ElysiaJS, Drizzle ORM, dan PostgreSQL.

## Prasyarat

- [Bun](https://bun.sh/) (versi terbaru)
- PostgreSQL yang sudah berjalan

## Install

```bash
bun install
```

## Environment

Salin file contoh environment lalu sesuaikan kredensial database:

```bash
cp .env.example .env
```

| Variable       | Keterangan                          |
|----------------|-------------------------------------|
| `DB_HOST`      | Host PostgreSQL                     |
| `DB_USER`      | Username database                   |
| `DB_PASSWORD`  | Password database                   |
| `DB_NAME`      | Nama database                       |
| `PORT`         | Port server (default: `3000`)       |

## Menjalankan Server

Development (hot reload):

```bash
bun run dev
```

Production:

```bash
bun run start
```

## Endpoint

### `GET /health`

Mengecek status server dan koneksi database.

**Berhasil (200):**

```json
{
  "status": "ok",
  "database": "connected"
}
```

**Database tidak tersedia (503):**

```json
{
  "status": "error",
  "database": "disconnected"
}
```

Contoh cek:

```bash
curl http://localhost:3000/health
```

## Database (Drizzle)

Generate migration dari schema:

```bash
bun run db:generate
```

Jalankan migration:

```bash
bun run db:migrate
```

Schema ada di `src/db/schema.ts` (saat ini masih kosong, siap diisi tabel).
