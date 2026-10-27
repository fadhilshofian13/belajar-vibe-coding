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

## Testing

Semua tes ada di `src/tests/`, satu file tes untuk satu file source:

| File tes                         | Yang dites                                          |
|----------------------------------|-----------------------------------------------------|
| `src/tests/health.test.ts`       | `GET /health`                                       |
| `src/tests/users-routes.test.ts` | `POST /api/v1/users`, `GET /api/v1/users/profile`   |
| `src/tests/auth-routes.test.ts`  | `POST /api/v1/login`, `DELETE /api/v1/logout`       |
| `src/tests/bearer-token.test.ts` | helper `extractBearerToken`                         |

Tes API memakai database PostgreSQL dari `.env`, jadi pastikan PostgreSQL berjalan dan migration sudah dijalankan.

```bash
bun run test
```

Setiap tes membuat user dengan email unik miliknya sendiri, lalu menghapus kembali hanya data tersebut setelah tes selesai. Data lain di database tidak tersentuh.

CI di GitHub Actions menjalankan `bun run typecheck`, migration, dan `bun run test` di setiap Pull Request.

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

### `GET /api/v1/users/profile`

Mengambil data user yang sedang login. Token didapat dari `POST /api/v1/login`.

**Headers:**

```
Authorization: Bearer <token>
```

**Berhasil (200):**

```json
{
  "data": {
    "id": "a0ca5b8d-3438-4036-be6d-158f85f28265",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "createdAt": "2026-10-26T15:56:09.818Z"
  }
}
```

**Token tidak ada, format header salah, atau token tidak valid (401):**

```json
{
  "message": "Unauthorized"
}
```

Contoh:

```bash
curl http://localhost:3000/api/v1/users/profile \
  -H "Authorization: Bearer <token>"
```

### `POST /api/v1/login`

Login user. Jika berhasil, server membuat sesi baru dan mengembalikan token (uuid).

**Request body:**

```json
{
  "email": "john.doe@example.com",
  "password": "password"
}
```

**Berhasil (200):**

```json
{
  "message": "Login successful",
  "data": "72d8fa01-7f0d-4301-a879-19969750d3bc"
}
```

**Email atau password salah (401):**

```json
{
  "message": "Email or password is incorrect"
}
```

Body yang tidak valid (field kurang atau format email salah) ditolak dengan status 422.

Contoh:

```bash
curl -X POST http://localhost:3000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"password"}'
```

### `DELETE /api/v1/logout`

Logout user yang sedang login. Sesi dengan token yang dikirim dihapus, sehingga token itu tidak bisa dipakai lagi. Sesi lain milik user yang sama tidak terpengaruh.

**Headers:**

```
Authorization: Bearer <token>
```

**Berhasil (200):**

```json
{
  "message": "Logout successful"
}
```

**Token tidak ada, format header salah, atau token tidak valid (401):**

```json
{
  "message": "Unauthorized"
}
```

Contoh:

```bash
curl -X DELETE http://localhost:3000/api/v1/logout \
  -H "Authorization: Bearer <token>"
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

Schema ada di `src/db/schema.ts` (saat ini berisi tabel `users` dan `sessions`). File migration ada di folder `drizzle/`.
