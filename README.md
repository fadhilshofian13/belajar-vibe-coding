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

### `POST /api/v1/users`

Registrasi user baru. Password disimpan sebagai hash bcrypt.

**Request body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "password"
}
```

**Berhasil (200):**

```json
{
  "message": "User created successfully"
}
```

**Email sudah terdaftar (409):**

```json
{
  "message": "User already exists"
}
```

Body yang tidak valid (field kurang atau format email salah) ditolak dengan status 422.

Contoh:

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john.doe@example.com","password":"password"}'
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

Schema ada di `src/db/schema.ts` (saat ini berisi tabel `users`). File migration ada di folder `drizzle/`.
