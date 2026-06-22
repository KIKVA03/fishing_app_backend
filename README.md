# 🎣 FishMap Georgia — Backend API

NestJS + Prisma (Supabase / PostgreSQL) + JWT backend for the FishMap (ფიშმეპ საქართველო) Expo app.
It provides everything the app currently fakes with `AsyncStorage`:

- **Auth** — register / login / session (JWT, bcrypt-hashed passwords)
- **Lakes** — the 16 lakes + fish species (seeded from the app's `lakesData.json`)
- **Catches** — per-lake & per-user catch photos, with image upload
- **Leaderboard** — users ranked by the same scoring formula the app uses

> Weather stays in the app (it calls Open-Meteo directly), so there is no weather endpoint here.

---

## ✅ What you need to fill in

Everything is built. You only provide secrets/connection info in **`.env`**:

1. Copy the template:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set the values marked `<-- FILL IN`:
   - `DATABASE_URL` + `DIRECT_URL` — your **Supabase** connection strings (see below)
   - `JWT_SECRET` — a long random string (there's a generator command in the file)
   - (optional) `PUBLIC_URL` — must be reachable from your phone for catch photos to load
     (use your computer's LAN IP in dev, e.g. `http://192.168.1.10:4000`, not `localhost`)

### Getting the Supabase connection strings

1. In the [Supabase dashboard](https://supabase.com/dashboard) open your project.
2. Click **Connect** (top bar) → **ORMs** tab → **Prisma**.
3. Copy the two URLs into `.env`:
   - **`DATABASE_URL`** = the pooled one (host `...pooler.supabase.com:6543`, ends with `?pgbouncer=true`) — the running app uses this.
   - **`DIRECT_URL`** = the direct one (port `5432`) — Prisma uses this for migrations.
4. Replace `[PASSWORD]` with your database password (Settings → Database → reset it if you forgot).

> Why two URLs? Supabase serves app traffic through a connection pooler (PgBouncer), but
> schema migrations need a direct connection. Prisma's `directUrl` handles this automatically.

---

## 🚀 Setup & run

```bash
# 1. install dependencies
npm install

# 2. create the .env (see above) with your Supabase URLs + JWT_SECRET

# 3. generate client, run migrations, and seed the lakes — all in one:
npm run setup

# 4. start the dev server (auto-reload)
npm run start:dev
```

The API runs at **`http://localhost:4000/api`** (port configurable in `.env`).

Individual commands if you prefer:

| Command | What it does |
|---|---|
| `npm run prisma:generate` | Generate the Prisma client |
| `npm run prisma:migrate` | Create/apply DB migrations (dev) |
| `npm run db:seed` | Seed the 16 lakes from `prisma/lakesData.json` |
| `npm run prisma:studio` | Open Prisma Studio (DB GUI) |
| `npm run start:dev` | Run with hot reload |
| `npm run build && npm run start:prod` | Production build & run |

> **Migrations on Supabase:** `prisma migrate` connects via `DIRECT_URL` (port 5432) to
> apply schema changes, then the app runs against the pooled `DATABASE_URL` (port 6543).
> Both must point at the same Supabase project. After `npm run setup` you'll see the
> `users`, `lakes` and `catches` tables under **Table Editor** in the Supabase dashboard.
>
> **Image storage:** catch photos are stored on this server's local `./uploads` folder by
> default. That's fine for local dev and a normal VM/container host. If you later deploy to a
> serverless/ephemeral host, switch uploads to **Supabase Storage** — ask and I'll wire it up.

---

## 📡 API reference

Base URL: `http://<host>:<port>/api`
Auth: send `Authorization: Bearer <token>` on protected routes (🔒).

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/register` | `{ username, email, password }` | `{ token, user }` |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| GET  | `/auth/me` 🔒 | — | `user` |

`user` shape (matches the app's `AuthUser`):
```json
{ "id": "...", "username": "გიო", "email": "g@x.com", "avatar": "🎣", "total_catches": 3, "createdAt": "2026-06-13T..." }
```

### Users
| Method | Path | Body | Returns |
|---|---|---|---|
| PATCH | `/users/me` 🔒 | `{ avatar? }` | updated `user` |
| GET | `/users/me/catches` 🔒 | — | `CatchPhoto[]` (all of the user's catches) |
| GET | `/leaderboard?limit=100` | — | ranked users with `score`, `rank`, `tier` |

> `total_catches` is **not** editable directly — the server increments/decrements it automatically when catches are created/deleted.

### Lakes
| Method | Path | Returns |
|---|---|---|
| GET | `/lakes` | `Lake[]` |
| GET | `/lakes/:id` | `Lake` |
| GET | `/lakes/:id/catches` | `CatchPhoto[]` for that lake |

`Lake` matches the app's `Lake` type (`name_ka`, `coordinates`, `fish_species`, …).

### Catches
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/catches` 🔒 | **multipart/form-data**: `image` (file) + `lakeId` (number) | created `CatchPhoto` |
| DELETE | `/catches/:id` 🔒 | — | `{ success: true }` (owner only) |

`CatchPhoto` shape (matches the app's type):
```json
{ "id": "...", "lakeId": 1, "lakeName": "თბილისის ზღვა", "username": "გიო", "avatar": "🎣",
  "imageUri": "http://<PUBLIC_URL>/uploads/<uuid>.jpg", "timestamp": 1718300000000 }
```

Uploaded photos are stored in `./uploads` and served statically at `/uploads/<file>`.
The author's `username`/`avatar` come from the token, not the request body.

### Health
`GET /health` → `{ status: "ok", timestamp }`

---

## 🔌 Wiring the app to this backend (next step)

The app today reads/writes `AsyncStorage` directly. To use this API instead, the
relevant frontend pieces map 1:1 to endpoints:

| App function (frontend) | Replace with |
|---|---|
| `AuthContext.login` / `register` | `POST /auth/login` / `/auth/register`, store the returned `token` |
| `AuthContext` session rehydrate | `GET /auth/me` with the saved token |
| `AuthContext.updateUser({ avatar })` | `PATCH /users/me` |
| `loadLakePhotos(lakeId)` | `GET /lakes/:id/catches` |
| `loadAllUserPhotos(username)` | `GET /users/me/catches` |
| `addLakePhoto(photo)` | `POST /catches` (multipart with the compressed image) |
| `deletePhoto(lakeId, id)` | `DELETE /catches/:id` |
| `lakesData.json` import | `GET /lakes` (or keep the bundled JSON as offline fallback) |

Keep the token in `AsyncStorage` and send it as `Authorization: Bearer <token>`.

---

## 🗂️ Project structure

```
backend/
├─ prisma/
│  ├─ schema.prisma        # User / Lake / Catch models
│  ├─ seed.ts              # seeds lakes from lakesData.json
│  └─ lakesData.json       # copied from the app
├─ src/
│  ├─ main.ts              # bootstrap, CORS, static /uploads, /api prefix
│  ├─ app.module.ts
│  ├─ prisma/              # PrismaService (global)
│  ├─ auth/                # register/login/me, JWT strategy + guard
│  ├─ users/               # profile update, leaderboard, my catches
│  ├─ lakes/               # lakes list/detail + lake catches
│  ├─ catches/             # create (upload) / delete + serializers
│  ├─ common/scoring.ts    # ranking formula (mirrors app)
│  └─ health/
└─ uploads/                # stored catch photos (git-ignored)
```
