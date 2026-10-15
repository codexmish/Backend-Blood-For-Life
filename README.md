# Blood For Life — Backend

A REST API for a blood donation platform. People who need blood post a request, eligible donors with the same blood group find it and commit to donate, and every completed donation is recorded so donors, the public and admins can see the history.

This repository is the **backend (v1)**. The frontend is built separately.

---

## Table of Contents

- [Features (v1)](#features-v1)
- [Tech Stack](#tech-stack)
- [How It Works](#how-it-works)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
  - [Conventions](#conventions)
  - [Endpoint overview](#endpoint-overview)
  - [Auth](#auth-apiv1auth)
  - [User](#user-apiv1user)
  - [Donor](#donor-apiv1donor)
  - [Blood Request](#blood-request-apiv1blood-request)
  - [Donation](#donation-apiv1donation)
- [Security](#security)
- [Roadmap (v2)](#roadmap-v2)
- [Author](#author)

---

## Features (v1)

- **Authentication** — signup with email OTP verification (stored in Redis), resend OTP with a 1-minute cooldown, sign in, refresh token, logout, forgot / reset password, change password.
- **JWT in httpOnly cookies** — access and refresh tokens are never exposed to JavaScript.
- **Role based access** — `RECIPIENT`, `DONOR`, `ADMIN`, `SUPER_ADMIN`. Roles are always read from the database, so a role change takes effect without logging in again.
- **User profile** — update profile, upload avatar to Cloudinary (old image is removed).
- **Donor profile** — any recipient can register as a donor, update donor info and toggle availability.
- **Donor search** — filter by blood group and area, paginated and sortable. Only available donors who are **eligible** (last donation at least 4 months ago) are shown. Phone and email are never exposed.
- **Blood requests** — create, edit, close (fulfilled / cancelled), public feed with search, filters and pagination. Expired requests are hidden automatically.
- **Donation flow** — donors commit to a request, the requester sees their contact numbers, and when the request is marked fulfilled a donation record is created for every committed donor and their donation history is updated, all in one transaction.
- **Donation data** — personal history for donors, an anonymous public list for the homepage, and a full report for admins.

---

## Tech Stack

| Area | Technology |
|---|---|
| Runtime | Node.js, TypeScript |
| Framework | Express 5 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 (with `@prisma/adapter-pg`) |
| Cache / OTP store | Redis |
| Validation | Zod 4 |
| Auth | JSON Web Token, bcrypt, httpOnly cookies |
| File upload | Multer (memory storage) + Cloudinary |
| Email | Nodemailer (SMTP) |
| Security | Helmet, CORS, express-rate-limit |
| Dev tools | tsx (watch mode), Biome (lint + format) |

---

## How It Works

### Roles

| Role | Can do |
|---|---|
| `RECIPIENT` | Default role after signup. Can post blood requests and register as a donor. |
| `DONOR` | Everything a recipient can, plus commit to blood requests that match their blood group. |
| `ADMIN` / `SUPER_ADMIN` | View full donation reports. (The admin panel is planned for v2.) |

### Donation flow

```
1. A user posts a blood request                    POST  /blood-request/create
2. Donors see it in the feed                        GET   /blood-request/requests
3. A donor clicks "I will donate"                   POST  /donation/:requestId
   (they can step back while the request is open)   DELETE /donation/:requestId
4. The requester sees committed donors' phones      GET   /blood-request/request/:id
5. After donating, the requester marks it done      PATCH /blood-request/request/:id/status  { "status": "FULFILLED" }
   -> one transaction:
      - a Donation record for every committed donor
      - each donor's lastDonationDate = today, totalDonations + 1
      - request status = FULFILLED
```

**Rules**

- Blood group must match exactly.
- A request never gets more donors than `bagsNeeded`.
- A donor can't join their own request, and must be available and eligible (4 months since the last donation).
- A donation is counted only when the request is fulfilled, not when the donor commits.
- Eligibility is calculated at query time — nothing has to run on a schedule.

### Data model

| Model | Purpose |
|---|---|
| `User` | Account, profile, role, status. |
| `Donor` | One-to-one with `User`. Availability, last donation date, total donations, weight, health note. |
| `Bloodrequest` | Patient, blood group, bags needed, hospital, address, needed date, urgency, contact phone, status. Has a many-to-many `donors` relation for committed donors. |
| `Donation` | A completed donation: donor, request, blood group, date. Unique per (request, donor). |

---

## Project Structure

```
prisma/
  schema/                 # Prisma schema split by model
  migrations/
src/
  server.ts               # connects DB + Redis, starts the server
  app.ts                  # middleware and routes
  app/
    envConfig/            # reads .env
    lib/                  # prisma, redis, cloudinary, multer
    middleWares/          # authCheck, zodValidation, error handler, 404
    utils/                # jwt, mail, rate limiter, response helper, uploads
    emailTemplates/       # OTP and welcome emails
    interfaces/           # shared query types
    module/
      auth/               # router, controller, services, validation, interface
      user/
      donor/
      bloodRequest/
      donation/
```

Every module follows the same pattern: **router → validation → controller → service**.

---

## Getting Started

### Requirements

- Node.js 20+
- PostgreSQL database
- Redis
- Cloudinary account
- SMTP account (for example Gmail with an app password)

### Install and run

```bash
git clone https://github.com/codexmish/Backend-Blood-For-Life.git
cd Backend-Blood-For-Life
npm install
cp .env.example .env        # then fill in the values
npx prisma migrate dev --config prisma7.config.ts
npx prisma generate --config prisma7.config.ts
npm run dev
```

The server runs on `http://localhost:8000` and the API on `http://localhost:8000/api/v1`.

> With Prisma 7, `migrate dev` does not generate the client. Run `prisma generate` after every schema change and restart the server.

### Environment variables

| Variable | Example | Description |
|---|---|---|
| `NODE_ENV` | `development` | Use `production` in deployment (secure cookies, no stack traces). |
| `PORT` | `8000` | Server port. |
| `BASE_URL` | `/api/v1` | API prefix. |
| `DATABASE_URL` | `postgresql://...` | PostgreSQL connection string. |
| `JWT_ACCESS_SECRET` | | Secret for access tokens. |
| `JWT_REFRESH_SECRET` | | Secret for refresh tokens. |
| `JWT_ACCESS_EXPIRES_IN` | `1d` | Access token lifetime. |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token lifetime. |
| `BCRYPT_SALT_ROUNDS` | `10` | bcrypt cost. |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin. |
| `SMTP_USER`, `SMTP_PASS` | | SMTP credentials for emails. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | | Avatar uploads. |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASS` | | Redis connection. |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start in watch mode. |
| `npm run lint:check` / `lint:fix` | Lint with Biome. |
| `npm run format:check` / `format:fix` | Format with Biome. |

---

## API Documentation

### Conventions

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** sign in (or verify OTP) sets `accessToken` and `refreshToken` as **httpOnly cookies**. Send requests with credentials:

```js
fetch(url, { credentials: "include" });          // fetch
axios.get(url, { withCredentials: true });        // axios
```

**Access levels used below**

| Label | Meaning |
|---|---|
| Public | No login needed. |
| Login | Any signed-in user. |
| `DONOR` / `RECIPIENT` / `ADMIN` | Signed-in user with that role. |

**Success response**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Blood request get Successfully",
  "data": {},
  "meta": { "page": 1, "limit": 5, "total": 12, "totalPages": 3 }
}
```

`meta` is only present on paginated lists.

**Error response**

```json
{
  "success": false,
  "statusCode": 400,
  "name": "Error",
  "message": "Invalid blood group",
  "error": "stack trace (development only)"
}
```

**Pagination (all lists):** `page` (default `1`) and `limit` (default `5` or `10`, max `50`). Invalid values fall back to the defaults.

**Enums**

| Enum | Values |
|---|---|
| Blood group | `A_POSITIVE` `A_NEGATIVE` `B_POSITIVE` `B_NEGATIVE` `AB_POSITIVE` `AB_NEGATIVE` `O_POSITIVE` `O_NEGATIVE` |
| Urgency | `NORMAL` `URGENT` `EMERGENCY` |
| Request status | `OPEN` `FULFILLED` `CANCELLED` |

Blood group and urgency filters in query strings are case-insensitive.

**Dates** in request bodies use `YYYY-MM-DD`.

---

### Endpoint overview

| # | Method | Endpoint | Access |
|---|---|---|---|
| Auth 1 | POST | `/auth/signup` | Public |
| Auth 2 | POST | `/auth/otp-verify` | Public |
| Auth 3 | POST | `/auth/resend-otp` | Public |
| Auth 4 | POST | `/auth/signin` | Public |
| Auth 5 | POST | `/auth/refresh-token` | Public (refresh cookie) |
| Auth 6 | POST | `/auth/logout` | Public |
| Auth 7 | POST | `/auth/forget-password` | Public |
| Auth 8 | POST | `/auth/reset-password` | Public |
| Auth 9 | PATCH | `/auth/change-password` | Login |
| Auth 10 | GET | `/auth/me` | Login |
| User 1 | PATCH | `/user/update` | Login |
| User 2 | PATCH | `/user/avater` | Login |
| Donor 1 | POST | `/donor/register` | RECIPIENT |
| Donor 2 | PATCH | `/donor/me` | DONOR |
| Donor 3 | PATCH | `/donor/me/availability` | DONOR |
| Donor 4 | GET | `/donor/donors` | Login |
| Donor 5 | GET | `/donor/:id` | Login |
| Blood Request 1 | POST | `/blood-request/create` | Login |
| Blood Request 2 | GET | `/blood-request/requests` | Login |
| Blood Request 3 | GET | `/blood-request/request/:id` | Login |
| Blood Request 4 | GET | `/blood-request/my-requests` | Login |
| Blood Request 5 | PATCH | `/blood-request/request/:id` | Requester |
| Blood Request 6 | PATCH | `/blood-request/request/:id/status` | Requester |
| Donation 1 | POST | `/donation/:requestId` | DONOR |
| Donation 2 | DELETE | `/donation/:requestId` | DONOR |
| Donation 3 | GET | `/donation/my-commitments` | DONOR |
| Donation 4 | GET | `/donation/my-donations` | DONOR |
| Donation 5 | GET | `/donation/public` | Public |
| Donation 6 | GET | `/donation` | ADMIN, SUPER_ADMIN |

All paths start with `/api/v1`.

---

### How to read each endpoint

Every endpoint below starts with a numbered heading and ends with a horizontal line. Each one lists:

- **Access** — who can call it.
- **URL params** — values inside the URL (like `:id`).
- **Query params** — values after `?` in the URL.
- **Request body** — JSON you send (or form-data for file upload).
- **Cookies** — `accessToken` / `refreshToken` are sent automatically by the browser when `credentials: "include"` is used.

If a section says **None**, nothing needs to be sent for it.

---

### Auth `/api/v1/auth`

---

#### Auth 1. Sign up

`POST /api/v1/auth/signup`

**Access:** Public · **Rate limit:** 5 requests / 10 min

**URL params:** None · **Query params:** None · **Cookies:** None

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | Yes | At least 3 characters |
| `email` | string | Yes | Valid email (stored in lowercase) |
| `bloodGroup` | string | Yes | One of the blood group values |
| `password` | string | Yes | 8–32 characters |

```json
{
  "name": "Rahim Uddin",
  "email": "rahim@example.com",
  "bloodGroup": "B_POSITIVE",
  "password": "Pass@1234"
}
```

**Response:** `200` — an OTP is emailed. It is valid for 5 minutes. The account is created only after OTP verification.

---

#### Auth 2. Verify OTP

`POST /api/v1/auth/otp-verify`

**Access:** Public · **Rate limit:** 5 failed requests / 10 min

**URL params:** None · **Query params:** None · **Cookies:** None

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | Yes | The email used in signup |
| `otp` | string | Yes | Exactly 6 characters |

```json
{
  "email": "rahim@example.com",
  "otp": "483920"
}
```

**Response:** `201` — returns the new user (without password) and sets `accessToken` and `refreshToken` cookies.

---

#### Auth 3. Resend OTP

`POST /api/v1/auth/resend-otp`

**Access:** Public · **Rate limit:** 5 requests / 10 min + 1 request per minute per email

**URL params:** None · **Query params:** None · **Cookies:** None

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | Yes | The email used in signup |

```json
{
  "email": "rahim@example.com"
}
```

**Response:** `200` — a new OTP is emailed and the previous one stops working.
**Errors:** `400` signup expired or email already registered · `429` asked again within 1 minute.

---

#### Auth 4. Sign in

`POST /api/v1/auth/signin`

**Access:** Public · **Rate limit:** 5 failed requests / 10 min

**URL params:** None · **Query params:** None · **Cookies:** None

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | Yes | Valid email |
| `password` | string | Yes | 8–32 characters |

```json
{
  "email": "rahim@example.com",
  "password": "Pass@1234"
}
```

**Response:** `200` — sets `accessToken` and `refreshToken` cookies.

---

#### Auth 5. Refresh token

`POST /api/v1/auth/refresh-token`

**Access:** Public (needs a valid refresh token) · **Rate limit:** 5 failed requests / 10 min

**URL params:** None · **Query params:** None · **Request body:** None

**Cookies:** `refreshToken`

**Response:** `200` — sets new `accessToken` and `refreshToken` cookies.

---

#### Auth 6. Logout

`POST /api/v1/auth/logout`

**Access:** Public

**URL params:** None · **Query params:** None · **Request body:** None · **Cookies:** None needed

**Response:** `200` — clears both cookies.

---

#### Auth 7. Forget password

`POST /api/v1/auth/forget-password`

**Access:** Public · **Rate limit:** 5 requests / 10 min

**URL params:** None · **Query params:** None · **Cookies:** None

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | Yes | Email of an existing account |

```json
{
  "email": "rahim@example.com"
}
```

**Response:** `200` — a reset OTP is emailed (valid for 5 minutes).

---

#### Auth 8. Reset password

`POST /api/v1/auth/reset-password`

**Access:** Public · **Rate limit:** 5 failed requests / 10 min

**URL params:** None · **Query params:** None · **Cookies:** None

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `email` | string | Yes | Email of the account |
| `otp` | string | Yes | Exactly 6 characters, from the reset email |
| `newPassword` | string | Yes | 8–32 characters |

```json
{
  "email": "rahim@example.com",
  "otp": "529184",
  "newPassword": "NewPass@123"
}
```

**Response:** `200` — password updated.

---

#### Auth 9. Change password

`PATCH /api/v1/auth/change-password`

**Access:** Login · **Rate limit:** 5 failed requests / 10 min

**URL params:** None · **Query params:** None

**Cookies:** `accessToken`

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `oldPassword` | string | Yes | Current password, 8–32 characters |
| `newPassword` | string | Yes | 8–32 characters, different from the old one |

```json
{
  "oldPassword": "Pass@1234",
  "newPassword": "NewPass@123"
}
```

**Response:** `200` — password changed.
**Errors:** `401` old password is wrong · `400` new password is the same as the old one.

---

#### Auth 10. Get my profile

`GET /api/v1/auth/me`

**Access:** Login

**URL params:** None · **Query params:** None · **Request body:** None

**Cookies:** `accessToken`

**Response:** `200` — the current user (without password). If the user is a donor, a `donor` object is included (availability, last donation date, total donations, weight, health note); otherwise `donor` is `null`.

---

### User `/api/v1/user`

---

#### User 1. Update profile

`PATCH /api/v1/user/update`

**Access:** Login

**URL params:** None · **Query params:** None

**Cookies:** `accessToken`

**Request body** — send at least one field

| Field | Type | Required | Rules |
|---|---|---|---|
| `name` | string | No | 3–50 characters |
| `phone` | string | No | Bangladeshi number: `01XXXXXXXXX`, `8801XXXXXXXXX` or `+8801XXXXXXXXX` |
| `address` | string | No | 3–200 characters |

```json
{
  "name": "Rahim Uddin",
  "phone": "01712345678",
  "address": "Mirpur 10, Dhaka"
}
```

**Response:** `200` — the updated user (without password). Any other field (role, email, status…) is ignored.

---

#### User 2. Upload avatar

`PATCH /api/v1/user/avater`

**Access:** Login

**URL params:** None · **Query params:** None

**Cookies:** `accessToken`

**Request body** — `multipart/form-data`

| Field | Type | Required | Rules |
|---|---|---|---|
| `avater` | file | Yes | Image file |

**Response:** `200` — the updated user with the new `avater` URL. The previous image is deleted from Cloudinary.

---

### Donor `/api/v1/donor`

---

#### Donor 1. Register as donor

`POST /api/v1/donor/register`

**Access:** `RECIPIENT` · **Rate limit:** 5 requests / 5 min

**URL params:** None · **Query params:** None

**Cookies:** `accessToken`

**Before calling:** the user must have `phone` and `address` set (User 1).

**Request body** — all fields optional

| Field | Type | Required | Rules |
|---|---|---|---|
| `weight` | string | No | Number in kg, at least 50 (e.g. `"62"`, `"62.5"`) |
| `healthNote` | string | No | Up to 300 characters |
| `lastDonationDate` | string | No | `YYYY-MM-DD`, not in the future |

```json
{
  "weight": "62",
  "healthNote": "No health issues",
  "lastDonationDate": "2026-05-01"
}
```

**Response:** `201` — the donor profile. The user's role becomes `DONOR`.

---

#### Donor 2. Update donor profile

`PATCH /api/v1/donor/me`

**Access:** `DONOR`

**URL params:** None · **Query params:** None

**Cookies:** `accessToken`

**Request body** — send at least one field

| Field | Type | Required | Rules |
|---|---|---|---|
| `weight` | string | No | Number in kg, at least 50 |
| `healthNote` | string | No | Up to 300 characters |
| `lastDonationDate` | string | No | `YYYY-MM-DD`, not in the future |

```json
{
  "weight": "65"
}
```

**Response:** `200` — the updated donor profile.

---

#### Donor 3. Change availability

`PATCH /api/v1/donor/me/availability`

**Access:** `DONOR`

**URL params:** None · **Query params:** None

**Cookies:** `accessToken`

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `isAvailable` | boolean | Yes | `true` or `false` (not a string) |

```json
{
  "isAvailable": false
}
```

**Response:** `200` — the updated donor profile. Unavailable donors don't appear in search.

---

#### Donor 4. Search donors

`GET /api/v1/donor/donors`

**Access:** Login

**URL params:** None · **Request body:** None

**Cookies:** `accessToken`

**Query params** — all optional

| Param | Description |
|---|---|
| `searchTerm` | Matches donor name or address (case-insensitive) |
| `bloodGroup` | Exact blood group, case-insensitive (e.g. `b_positive`) |
| `sortBy` | `createdAt` (default), `lastDonationDate`, `totalDonations` |
| `sortOrder` | `asc` or `desc` (default) |
| `page` | Default `1` |
| `limit` | Default `5`, max `50` |

```
GET /api/v1/donor/donors?bloodGroup=B_POSITIVE&searchTerm=mirpur&page=1&limit=10
```

**Response:** `200` — list + `meta`. Only available, eligible (4 months since last donation), active, verified donors. Each item has donor info and the user's `name`, `bloodGroup`, `gender`, `address`, `avater` — no phone or email.

---

#### Donor 5. Get single donor

`GET /api/v1/donor/:id`

**Access:** Login

**Query params:** None · **Request body:** None

**Cookies:** `accessToken`

**URL params**

| Param | Description |
|---|---|
| `id` | Donor id (the `id` from the search result, not the user id) |

```
GET /api/v1/donor/1e5a1382-b19b-4db7-9003-db1f39a0dd88
```

**Response:** `200` — same fields as a search item. `404` if not found or inactive.

---

### Blood Request `/api/v1/blood-request`

---

#### Blood Request 1. Create request

`POST /api/v1/blood-request/create`

**Access:** Login

**URL params:** None · **Query params:** None

**Cookies:** `accessToken`

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `patientName` | string | Yes | 3–50 characters |
| `bloodGroup` | string | Yes | Blood group value in capitals (e.g. `B_POSITIVE`) |
| `bagsNeeded` | number | Yes | Whole number 1–5 (not a string) |
| `hospitalName` | string | Yes | 3–100 characters |
| `address` | string | Yes | 3–200 characters |
| `urgency` | string | No | `NORMAL` (default), `URGENT`, `EMERGENCY` |
| `needAt` | string | Yes | `YYYY-MM-DD`, today or later |
| `phoneNumber` | string | Yes | Bangladeshi number, shown to donors |
| `note` | string | No | 3–200 characters |

```json
{
  "patientName": "Rahim Uddin",
  "bloodGroup": "B_POSITIVE",
  "bagsNeeded": 2,
  "hospitalName": "Dhaka Medical College Hospital",
  "address": "Bakshibazar, Dhaka",
  "urgency": "URGENT",
  "needAt": "2026-10-20",
  "phoneNumber": "01712345678",
  "note": "Patient is in ICU"
}
```

**Response:** `201` — the created request with `status: "OPEN"`. The requester is the logged-in user.

---

#### Blood Request 2. Get request feed

`GET /api/v1/blood-request/requests`

**Access:** Login

**URL params:** None · **Request body:** None

**Cookies:** `accessToken`

**Query params** — all optional

| Param | Description |
|---|---|
| `searchTerm` | Matches hospital name or address (case-insensitive) |
| `bloodGroup` | Exact blood group, case-insensitive |
| `urgency` | `NORMAL`, `URGENT`, `EMERGENCY`, case-insensitive |
| `sortBy` | `createdAt` (default), `needAt`, `bagsNeeded` |
| `sortOrder` | `asc` or `desc` (default) |
| `page` | Default `1` |
| `limit` | Default `5`, max `50` |

```
GET /api/v1/blood-request/requests?bloodGroup=O_NEGATIVE&urgency=EMERGENCY&sortBy=needAt&sortOrder=asc
```

**Response:** `200` — list + `meta`. Only `OPEN` requests dated today or later, including the contact `phoneNumber`.

---

#### Blood Request 3. Get single request

`GET /api/v1/blood-request/request/:id`

**Access:** Login

**Query params:** None · **Request body:** None

**Cookies:** `accessToken`

**URL params**

| Param | Description |
|---|---|
| `id` | Blood request id |

```
GET /api/v1/blood-request/request/01b5d5fd-20f8-4af1-991b-cfecc03071d8
```

**Response:** `200` — the request and `_count.donors`. If the caller is the **requester**, a `donors` list is added with each committed donor's name, blood group, phone and avatar. `404` if not found.

---

#### Blood Request 4. Get my requests

`GET /api/v1/blood-request/my-requests`

**Access:** Login

**URL params:** None · **Request body:** None

**Cookies:** `accessToken`

**Query params** — all optional, same as the feed: `searchTerm`, `bloodGroup`, `urgency`, `sortBy`, `sortOrder`, `page`, `limit`

```
GET /api/v1/blood-request/my-requests?page=1&limit=10
```

**Response:** `200` — the logged-in user's open requests + `meta`.

---

#### Blood Request 5. Edit request

`PATCH /api/v1/blood-request/request/:id`

**Access:** Login, only the requester, only while `OPEN`

**Query params:** None

**Cookies:** `accessToken`

**URL params**

| Param | Description |
|---|---|
| `id` | Blood request id |

**Request body** — any field from *Create request*, all optional, same rules

```json
{
  "bagsNeeded": 3,
  "needAt": "2026-10-22",
  "note": "Please call before coming"
}
```

**Response:** `200` — the updated request. `403` if not the owner, `400` if not open, `404` if not found.

---

#### Blood Request 6. Change request status

`PATCH /api/v1/blood-request/request/:id/status`

**Access:** Login, only the requester, only once (while `OPEN`)

**Query params:** None

**Cookies:** `accessToken`

**URL params**

| Param | Description |
|---|---|
| `id` | Blood request id |

**Request body**

| Field | Type | Required | Rules |
|---|---|---|---|
| `status` | string | Yes | `FULFILLED` or `CANCELLED` |

```json
{
  "status": "FULFILLED"
}
```

**Response:** `200` — the updated request. With `FULFILLED`, a donation record is created for every committed donor and their donation history is updated in the same transaction.

---

### Donation `/api/v1/donation`

---

#### Donation 1. Commit to donate

`POST /api/v1/donation/:requestId`

**Access:** `DONOR`

**Query params:** None · **Request body:** None

**Cookies:** `accessToken`

**URL params**

| Param | Description |
|---|---|
| `requestId` | Blood request id |

```
POST /api/v1/donation/01b5d5fd-20f8-4af1-991b-cfecc03071d8
```

**Response:** `200` — the request with contact info and `_count.donors`.
**Errors (`400`):** request not open or expired · own request · blood group doesn't match · donor unavailable · not eligible yet (message shows the next eligible date) · already joined · request already has enough donors. `404` if the request doesn't exist.

---

#### Donation 2. Step back from a request

`DELETE /api/v1/donation/:requestId`

**Access:** `DONOR`, only while the request is `OPEN`

**Query params:** None · **Request body:** None

**Cookies:** `accessToken`

**URL params**

| Param | Description |
|---|---|
| `requestId` | Blood request id |

```
DELETE /api/v1/donation/01b5d5fd-20f8-4af1-991b-cfecc03071d8
```

**Response:** `200` — the request with the updated `_count.donors`.

---

#### Donation 3. Get my commitments

`GET /api/v1/donation/my-commitments`

**Access:** `DONOR`

**URL params:** None · **Request body:** None

**Cookies:** `accessToken`

**Query params** — all optional

| Param | Description |
|---|---|
| `page` | Default `1` |
| `limit` | Default `5`, max `50` |

```
GET /api/v1/donation/my-commitments?page=1&limit=5
```

**Response:** `200` — open requests the donor has committed to, nearest date first, with hospital, address, contact phone and donor count + `meta`.

---

#### Donation 4. Get my donations

`GET /api/v1/donation/my-donations`

**Access:** `DONOR`

**URL params:** None · **Request body:** None

**Cookies:** `accessToken`

**Query params** — all optional

| Param | Description |
|---|---|
| `page` | Default `1` |
| `limit` | Default `5`, max `50` |

```
GET /api/v1/donation/my-donations
```

**Response:** `200` — donation history, latest first + `meta`:

```json
{
  "id": "01M4T1A9MNPKBN4X0P8AKWQN0K",
  "bloodGroup": "O_NEGATIVE",
  "donatedAt": "2026-10-13T06:19:06.279Z",
  "request": {
    "id": "02fa5620-1d37-4dfd-98b9-53c34273bf5c",
    "patientName": "Rahim Uddin",
    "hospitalName": "Dhaka Medical College Hospital",
    "address": "Bakshibazar, Dhaka",
    "needAt": "2026-10-15T00:00:00.000Z"
  }
}
```

---

#### Donation 5. Get public donations

`GET /api/v1/donation/public`

**Access:** Public (no login)

**URL params:** None · **Request body:** None · **Cookies:** None

**Query params** — all optional

| Param | Description |
|---|---|
| `page` | Default `1` |
| `limit` | Default `10`, max `50` |

```
GET /api/v1/donation/public?limit=10
```

**Response:** `200` — one row per fulfilled request, latest first + `meta`. No names, ids, phones or hospitals:

```json
{
  "bloodGroup": "B_POSITIVE",
  "donatedAt": "2026-10-08T10:00:00.000Z",
  "bags": 3
}
```

---

#### Donation 6. Get all donations (admin)

`GET /api/v1/donation`

**Access:** `ADMIN`, `SUPER_ADMIN`

**URL params:** None · **Request body:** None

**Cookies:** `accessToken`

**Query params** — all optional

| Param | Description |
|---|---|
| `bloodGroup` | Exact blood group, case-insensitive |
| `from` | Start date, `YYYY-MM-DD` |
| `to` | End date, `YYYY-MM-DD` (whole day included) |
| `page` | Default `1` |
| `limit` | Default `10`, max `50` |

```
GET /api/v1/donation?bloodGroup=O_NEGATIVE&from=2026-10-01&to=2026-10-31
```

**Response:** `200` — every donation with donor (name, email, phone, blood group), request (patient, hospital, address, date, contact phone), requester (name, email, phone) and donation date + `meta`.

---

## Security

- Passwords hashed with bcrypt; never returned in any response.
- JWTs only in httpOnly cookies (`secure` + `sameSite=none` in production).
- Every request body is validated with Zod; unknown fields (role, status, requester…) are stripped.
- Ownership checks on every edit / status change.
- Phone numbers and emails of donors are hidden everywhere except from the requester they committed to, and from admins.
- Rate limits on auth routes and donor registration; 1-minute cooldown for OTP resend.
- Helmet security headers, CORS limited to the frontend origin.

---

## Roadmap (v2)

Features planned for the next version:

- [ ] **Admin panel** — create admins, block / unblock users, manage blood requests, dashboard with platform statistics.
- [ ] **Notifications** — alert matching donors about new requests, alert requesters when a donor commits, thank donors when a request is fulfilled (in-app and email).
- [ ] **Log out from all devices** — end every active session after a password change or reset.
- [ ] **Request history** — see all of your own requests (open, fulfilled, cancelled) with a status filter.
- [ ] **Image-only avatar upload** — accept only JPG / PNG / WebP with a size limit.
- [ ] **Transactional email service** — dedicated email provider for reliable delivery.
- [ ] **Interactive API docs** — Swagger / OpenAPI and a Postman collection.
- [ ] **Automated tests and CI** — test suite running on every push.
- [ ] **Live deployment** — hosted API connected to the frontend.

---

## Author

**Majharul Islam Shanto** — [GitHub](https://github.com/codexmish)
