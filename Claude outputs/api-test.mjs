#!/usr/bin/env node
/**
 * Blood For Life - auth API behaviour test, v2 (zero dependencies, Node >= 18).
 * Covers: signup, otp-verify, signin, /me, refresh-token, logout, forget-password,
 * reset-password, cookie flags, JWT forgery, double-submit race, rate limiter.
 *
 * HOW TO RUN
 *   1. Start your backend (npm run dev).  RESTART it first if you ran this recently:
 *      the rate limiter is in-memory (5 tries / 10 min per route per IP) and this test
 *      deliberately trips it at the very end.
 *   2. Open a terminal IN THE PROJECT FOLDER (so .env can be read, read-only) and run:
 *        node <path-to>/api-test.mjs
 *
 * WHAT IT NEEDS
 *   - Server on http://localhost:<PORT><BASE_URL>/auth (from .env; default 8000 + /api/v1).
 *     Override:  API=http://localhost:8000/api/v1/auth node api-test.mjs
 *   - OTPs are read from the same Redis your server uses (REDIS_* from .env).
 *     If Redis is unreachable it asks you to type the OTP.  OTP_MODE=prompt forces typing.
 *
 * SIDE EFFECTS
 *   - Creates 2 users  bfl-test-*@example.com  in whatever DB your server uses (DEV only!).
 *     Cleanup SQL is printed at the end.
 *   - Your server will try to send a few real emails via SMTP (to example.com).
 *   - It never writes any file.
 */
import fs from "node:fs";
import net from "node:net";
import tls from "node:tls";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline/promises";

/* ----------------------------- config ----------------------------- */
function loadEnv(file) {
	const out = {};
	try {
		for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
			const line = raw.trim();
			if (!line || line.startsWith("#")) continue;
			const i = line.indexOf("=");
			if (i < 0) continue;
			let v = line.slice(i + 1).trim();
			if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
				v = v.slice(1, -1);
			out[line.slice(0, i).trim()] = v;
		}
	} catch {
		/* no .env - fine */
	}
	return out;
}
const dotenv = loadEnv(path.join(process.cwd(), ".env"));
const cfg = (k, d) => process.env[k] ?? dotenv[k] ?? d;

const ROOT = process.env.ROOT || `http://localhost:${cfg("PORT", "8000")}`;
const API = process.env.API || `${ROOT}${cfg("BASE_URL", "/api/v1")}/auth`;
const OTP_MODE = (process.env.OTP_MODE || "auto").toLowerCase(); // auto | redis | prompt

const redisCfg = cfg("REDIS_HOST")
	? {
			host: cfg("REDIS_HOST"),
			port: Number(cfg("REDIS_PORT", "6379")),
			username: cfg("REDIS_USER", ""),
			password: cfg("REDIS_PASS", ""),
			tls: String(cfg("REDIS_TLS", "false")) === "true",
		}
	: null;

/* ------------------------ tiny Redis GET client ------------------------ */
const enc = (...a) => `*${a.length}\r\n` + a.map((x) => `$${Buffer.byteLength(x)}\r\n${x}\r\n`).join("");
function parseReply(s) {
	const nl = s.indexOf("\r\n");
	if (nl < 0) return null;
	const type = s[0];
	const head = s.slice(1, nl);
	const after = s.slice(nl + 2);
	if (type === "+") return { value: head, rest: after };
	if (type === "-") return { error: head, rest: after };
	if (type === ":") return { value: Number(head), rest: after };
	if (type === "$") {
		const len = Number(head);
		if (len < 0) return { value: null, rest: after };
		if (after.length < len + 2) return null;
		return { value: after.slice(0, len), rest: after.slice(len + 2) };
	}
	return { error: `unsupported reply type ${type}`, rest: "" };
}
function redisGet(c, key) {
	return new Promise((resolve, reject) => {
		const sock = c.tls
			? tls.connect({ host: c.host, port: c.port, servername: c.host })
			: net.connect({ host: c.host, port: c.port });
		const expected = c.password ? 2 : 1;
		const got = [];
		let buf = "";
		const timer = setTimeout(() => finish(new Error("redis timeout")), 6000);
		function finish(err, val) {
			clearTimeout(timer);
			sock.destroy();
			err ? reject(err) : resolve(val);
		}
		sock.on("error", (e) => finish(e));
		sock.once(c.tls ? "secureConnect" : "connect", () => {
			let out = "";
			if (c.password) out += c.username ? enc("AUTH", c.username, c.password) : enc("AUTH", c.password);
			out += enc("GET", key);
			sock.write(out);
		});
		sock.on("data", (d) => {
			buf += d.toString("utf8");
			for (;;) {
				const r = parseReply(buf);
				if (!r) break;
				buf = r.rest;
				got.push(r);
			}
			if (got.length >= expected) {
				const bad = got.find((g) => g.error);
				if (bad) return finish(new Error(`redis: ${bad.error}`));
				finish(null, got[expected - 1].value);
			}
		});
	});
}
async function ask(q) {
	const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
	try {
		return (await rl.question(q)).trim();
	} finally {
		rl.close();
	}
}
async function getOtp(kind, email) {
	// key formats exactly as in auth.services.ts (note the space in the forget-password key)
	const key = kind === "signup" ? `user-registration-otp:${email}` : `forget-password-otp: ${email}`;
	if (OTP_MODE !== "prompt" && redisCfg) {
		try {
			const v = await redisGet(redisCfg, key);
			if (v) return v;
			console.log(`    (no value at redis key "${key}")`);
		} catch (e) {
			console.log(`    (redis read failed: ${e.message})`);
		}
		if (OTP_MODE === "redis") throw new Error("OTP_MODE=redis but OTP not found");
	}
	return ask(`    Type the OTP sent to ${email}: `);
}

/* ------------------------------ http ------------------------------ */
function parseSetCookie(line) {
	const [pair, ...attrs] = line.split(";").map((s) => s.trim());
	const eq = pair.indexOf("=");
	const c = { name: pair.slice(0, eq), value: pair.slice(eq + 1), httpOnly: false, secure: false, sameSite: undefined, maxAge: undefined, path: undefined, expires: undefined };
	for (const a of attrs) {
		const i = a.indexOf("=");
		const k = (i < 0 ? a : a.slice(0, i)).toLowerCase();
		const v = i < 0 ? "" : a.slice(i + 1);
		if (k === "httponly") c.httpOnly = true;
		else if (k === "secure") c.secure = true;
		else if (k === "samesite") c.sameSite = v.toLowerCase();
		else if (k === "max-age") c.maxAge = Number(v);
		else if (k === "path") c.path = v;
		else if (k === "expires") c.expires = Date.parse(v);
	}
	return c;
}
const isCleared = (c) => c.value === "" || c.maxAge === 0 || (c.expires !== undefined && c.expires < Date.now());
function getSetCookies(res) {
	if (typeof res.headers.getSetCookie === "function") return res.headers.getSetCookie();
	const raw = res.headers.get("set-cookie");
	return raw ? raw.split(/,(?=\s*[^;,\s]+=)/) : [];
}
class Client {
	constructor() {
		this.jar = new Map();
	}
	async req(method, p, { body, useJar = true, headers = {} } = {}) {
		const h = { ...headers };
		if (body !== undefined) h["content-type"] = "application/json";
		if (useJar && this.jar.size && !h.cookie) h.cookie = [...this.jar].map(([k, v]) => `${k}=${v}`).join("; ");
		const res = await fetch(p.startsWith("http") ? p : API + p, {
			method,
			headers: h,
			body: body === undefined ? undefined : JSON.stringify(body),
			redirect: "manual",
		});
		const cookies = getSetCookies(res).map(parseSetCookie);
		if (useJar)
			for (const c of cookies) {
				if (isCleared(c)) this.jar.delete(c.name);
				else this.jar.set(c.name, c.value);
			}
		const text = await res.text();
		let json = null;
		try {
			json = JSON.parse(text);
		} catch {
			/* not json */
		}
		return { status: res.status, json, text, cookies };
	}
}

/* ------------------------------ jwt ------------------------------ */
const b64u = (x) => Buffer.from(x).toString("base64url");
const decodeJwt = (t) => {
	const [h, p] = t.split(".");
	return { header: JSON.parse(Buffer.from(h, "base64url").toString()), payload: JSON.parse(Buffer.from(p, "base64url").toString()) };
};
const signHS256 = (payload, secret) => {
	const h = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
	const p = b64u(JSON.stringify(payload));
	return `${h}.${p}.${crypto.createHmac("sha256", secret).update(`${h}.${p}`).digest("base64url")}`;
};

/* ---------------------------- reporting ---------------------------- */
const R = { pass: 0, fail: [], warn: [], info: [] };
const section = (t) => console.log(`\n== ${t}`);
const ok = (n) => (console.log(`  [PASS] ${n}`), R.pass++);
const fail = (n, d) => (console.log(`  [FAIL] ${n}${d ? `\n         -> ${d}` : ""}`), R.fail.push(n));
const warn = (n, d) => (console.log(`  [WARN] ${n}${d ? `\n         -> ${d}` : ""}`), R.warn.push(n));
const info = (n, d) => (console.log(`  [INFO] ${n}${d ? `\n         -> ${d}` : ""}`), R.info.push(n));
const expect = (n, cond, d) => (cond ? ok(n) : fail(n, d));
const brief = (r) => `HTTP ${r.status} ${r.json?.message ?? r.json?.error ?? r.text.slice(0, 120)}`;
let throttledHintShown = false;
const hint429 = (r) => {
	if (r.status === 429 && !throttledHintShown) {
		throttledHintShown = true;
		console.log("         (429 = rate limiter. It is in-memory: restart the server, or wait 10 minutes, then re-run.)");
	}
};
function checkCookies(label, cookies, names) {
	for (const n of names) {
		const c = cookies.find((x) => x.name === n);
		if (!c) {
			fail(`${label}: Set-Cookie ${n} present`, "cookie missing in response");
			continue;
		}
		expect(`${label}: ${n} is HttpOnly`, c.httpOnly, "HttpOnly flag missing");
		expect(`${label}: ${n} has Path=/`, c.path === "/", `Path=${c.path} (a different path creates a second, duplicate cookie)`);
		expect(`${label}: ${n} SameSite=None only together with Secure`, c.sameSite !== "none" || c.secure, "SameSite=None without Secure: Chrome silently rejects this cookie");
	}
}

/* ------------------------------ tests ------------------------------ */
const stamp = Date.now().toString(36);
const emailA = `bfl-test-${stamp}-a@example.com`;
const emailB = `bfl-test-${stamp}-b@example.com`;
const passA = "Test@12345";
const newPassA = "NewPass@12345";
const wrongOtpFor = (real) => (real === "000000" ? "111111" : "000000");

async function main() {
	console.log(`API under test: ${API}`);
	console.log(`OTP source: ${OTP_MODE === "prompt" || !redisCfg ? "typed by you" : `redis ${redisCfg.host}:${redisCfg.port}`}`);
	const anon = new Client();
	const A = new Client();

	section("0. Server reachable");
	try {
		const r = await anon.req("GET", `${ROOT}/`);
		expect("GET / returns 200", r.status === 200, brief(r));
	} catch (e) {
		console.log(`  [FAIL] cannot reach ${ROOT} -> ${e.message}\n         Is the server running? (npm run dev)`);
		process.exit(2);
	}

	section("1. Routing");
	{
		const r = await anon.req("GET", "/does-not-exist");
		expect("unknown route -> 404 JSON", r.status === 404 && r.json?.success === false, brief(r));
		const t = await anon.req("POST", "/reset-password", { body: {} });
		hint429(t);
		expect("POST /reset-password exists (400 validation)", t.status === 400, `got ${brief(t)}`);
		const t2 = await anon.req("POST", "/refresh-token", { body: {} });
		info("route /refresh-token reachable", `HTTP ${t2.status}`);
	}

	section("2. Input validation");
	{
		const cases = [
			["signup {}", "/signup", {}],
			["otp-verify 3-digit otp", "/otp-verify", { email: emailA, otp: "123" }],
			["signin missing password", "/signin", { email: emailA }],
			["forget-password invalid email", "/forget-password", { email: "x" }],
		];
		for (const [name, url, body] of cases) {
			const r = await anon.req("POST", url, { body });
			hint429(r);
			expect(`${name} -> 400`, r.status === 400, brief(r));
		}
	}

	section("3. Signup + OTP verify (user A)");
	let accessA = "";
	let refreshA = "";
	{
		const s = await A.req("POST", "/signup", {
			// role/status must NOT be accepted from the client
			body: { name: "Test User A", email: emailA, bloodGroup: "O_POSITIVE", password: passA, role: "ADMIN", status: "ACTIVE", emailVerified: true },
		});
		hint429(s);
		expect("signup -> 200", s.status === 200, brief(s));

		const real = await getOtp("signup", emailA);
		expect("OTP is 6 digits", /^\d{6}$/.test(real), `got "${real}"`);

		const bad = await A.req("POST", "/otp-verify", { body: { email: emailA, otp: wrongOtpFor(real) } });
		expect("wrong OTP -> 400", bad.status === 400, brief(bad));
		if (typeof bad.json?.error === "string" && bad.json.error.includes("\n    at "))
			info("error responses include stack traces", "fine in development; make sure NODE_ENV=production on deploy");

		const v = await A.req("POST", "/otp-verify", { body: { email: emailA, otp: real } });
		expect("correct OTP -> 201", v.status === 201, brief(v));
		accessA = A.jar.get("accessToken") || "";
		refreshA = A.jar.get("refreshToken") || "";
		checkCookies("otp-verify", v.cookies, ["accessToken", "refreshToken"]);
		expect("response has no password field", v.json?.data && !("password" in v.json.data), JSON.stringify(v.json?.data));
		expect("role cannot be injected from signup body (role == USER)", v.json?.data?.role === "USER", `role=${v.json?.data?.role}`);
		expect("emailVerified == true", v.json?.data?.emailVerified === true, `got ${v.json?.data?.emailVerified}`);

		if (accessA) {
			const { payload } = decodeJwt(accessA);
			console.log(`    JWT payload keys: ${Object.keys(payload).join(", ")}`);
			expect('JWT carries lowercase "role" claim (authCheck reads `role`)', "role" in payload, 'token has no "role" claim -> role-protected routes would always 403');
			expect("JWT has exp", typeof payload.exp === "number", "no exp claim");
		}

		const again = await anon.req("POST", "/otp-verify", { body: { email: emailA, otp: real } });
		expect("verifying again -> 400", again.status === 400, brief(again));
		const dup = await anon.req("POST", "/signup", { body: { name: "Test User A", email: emailA, bloodGroup: "O_POSITIVE", password: passA } });
		expect("signup with existing email -> 400", dup.status === 400, brief(dup));
	}

	section("4. Signin");
	const S = new Client();
	{
		const wrong = await anon.req("POST", "/signin", { body: { email: emailA, password: "Wrong@12345" } });
		hint429(wrong);
		expect("wrong password -> 401", wrong.status === 401, brief(wrong));
		const ghost = await anon.req("POST", "/signin", { body: { email: `bfl-test-${stamp}-ghost@example.com`, password: passA } });
		expect("unknown email -> 4xx", ghost.status >= 400 && ghost.status < 500, brief(ghost));

		const good = await S.req("POST", "/signin", { body: { email: emailA.toUpperCase(), password: passA } });
		expect("signin works (email is case-insensitive) -> 200", good.status === 200, brief(good));
		checkCookies("signin", good.cookies, ["accessToken", "refreshToken"]);
		if (/eyJ[\w-]+\.[\w-]+\.[\w-]+/.test(JSON.stringify(good.json?.data ?? {})))
			warn("signin response BODY contains the JWTs", "they are already in httpOnly cookies; returning them in JSON defeats httpOnly");
		else ok("signin body does not leak JWTs");
	}

	section("5. Protected route GET /me");
	{
		const me = await A.req("GET", "/me");
		expect("with valid cookie -> 200", me.status === 200, brief(me));
		expect("returns own email, no password", me.json?.data?.email === emailA && !("password" in (me.json?.data ?? {})), JSON.stringify(me.json?.data));

		const noCookie = await anon.req("GET", "/me", { useJar: false });
		expect("no cookie -> 401", noCookie.status === 401, brief(noCookie));
		const junk = await anon.req("GET", "/me", { useJar: false, headers: { cookie: "accessToken=garbage" } });
		expect("garbage token -> 401", junk.status === 401, brief(junk));

		if (accessA) {
			const parts = accessA.split(".");
			const i = Math.floor(parts[2].length / 2);
			parts[2] = parts[2].slice(0, i) + (parts[2][i] === "A" ? "B" : "A") + parts[2].slice(i + 1);
			const t = await anon.req("GET", "/me", { useJar: false, headers: { cookie: `accessToken=${parts.join(".")}` } });
			expect("tampered signature -> 401", t.status === 401, brief(t));

			const { payload } = decodeJwt(accessA);
			const f = await anon.req("GET", "/me", { useJar: false, headers: { cookie: `accessToken=${signHS256(payload, "not-the-real-secret")}` } });
			expect("token signed with another secret -> 401", f.status === 401, brief(f));

			const none = `${b64u(JSON.stringify({ alg: "none", typ: "JWT" }))}.${b64u(JSON.stringify(payload))}.`;
			const n = await anon.req("GET", "/me", { useJar: false, headers: { cookie: `accessToken=${none}` } });
			expect('alg "none" token -> 401', n.status === 401, brief(n));

			const asAccess = await anon.req("GET", "/me", { useJar: false, headers: { cookie: `accessToken=${refreshA}` } });
			expect("refresh token cannot be used as access token -> 401", asAccess.status === 401, brief(asAccess));

			const bearer = await anon.req("GET", "/me", { useJar: false, headers: { authorization: `Bearer ${accessA}` } });
			if (bearer.status === 401) info("Authorization: Bearer header is not supported", "only the accessToken cookie is read (fine for a browser client)");
			else ok("Authorization: Bearer accepted");
		}
	}

	section("6. Refresh token");
	{
		const none = await anon.req("POST", "/refresh-token", { useJar: false });
		hint429(none);
		expect("no refresh cookie -> 401", none.status === 401, brief(none));
		const junk = await anon.req("POST", "/refresh-token", { useJar: false, headers: { cookie: "refreshToken=garbage" } });
		expect("garbage refresh token -> 401", junk.status === 401, brief(junk));
		const asRefresh = await anon.req("POST", "/refresh-token", { useJar: false, headers: { cookie: `refreshToken=${accessA}` } });
		expect("access token cannot be used as refresh token -> 401", asRefresh.status === 401, brief(asRefresh));

		const r = await A.req("POST", "/refresh-token");
		expect("valid refresh token -> 200", r.status === 200, brief(r));
		checkCookies("refresh-token", r.cookies, ["accessToken", "refreshToken"]);
		const newAccess = A.jar.get("accessToken") || "";
		if (newAccess) {
			expect('refreshed JWT carries "role" claim', "role" in decodeJwt(newAccess).payload, "no role claim");
			const me = await A.req("GET", "/me");
			expect("new access token works on /me -> 200", me.status === 200, brief(me));
		}
	}

	section("7. Logout");
	{
		const out = await A.req("POST", "/logout");
		expect("logout -> 200", out.status === 200, brief(out));
		for (const n of ["accessToken", "refreshToken"]) {
			const c = out.cookies.find((x) => x.name === n);
			expect(`logout clears ${n}`, !!c && isCleared(c), c ? `cookie not expired: ${JSON.stringify(c)}` : "no Set-Cookie for it");
			if (c) expect(`logout clears ${n} on Path=/`, c.path === "/", `Path=${c.path} (must match the path used when set)`);
		}
		const me = await A.req("GET", "/me");
		expect("after logout /me -> 401", me.status === 401, brief(me));
		const rf = await A.req("POST", "/refresh-token");
		expect("after logout refresh-token -> 401", rf.status === 401, brief(rf));
	}

	section("8. Forget / reset password (user A)");
	{
		const f = await anon.req("POST", "/forget-password", { body: { email: emailA } });
		hint429(f);
		expect("forget-password (valid) -> 200", f.status === 200, brief(f));
		const real = await getOtp("forget", emailA);
		expect("reset OTP is 6 digits", /^\d{6}$/.test(real), `got "${real}"`);

		const wrong = await anon.req("POST", "/reset-password", { body: { email: emailA, otp: wrongOtpFor(real), newPassword: newPassA } });
		expect("wrong OTP -> 400", wrong.status === 400, brief(wrong));
		const okr = await anon.req("POST", "/reset-password", { body: { email: emailA, otp: real, newPassword: newPassA } });
		expect("correct OTP resets password -> 200", okr.status === 200, brief(okr));
		const reuse = await anon.req("POST", "/reset-password", { body: { email: emailA, otp: real, newPassword: "Another@12345" } });
		expect("OTP cannot be reused -> 400", reuse.status === 400, brief(reuse));

		const old = await anon.req("POST", "/signin", { body: { email: emailA, password: passA } });
		expect("old password no longer works -> 401", old.status === 401, brief(old));
		const fresh = await anon.req("POST", "/signin", { body: { email: emailA, password: newPassA } });
		expect("new password works -> 200", fresh.status === 200, brief(fresh));

		const still = await S.req("GET", "/me");
		if (still.status === 200) info("sessions survive a password reset", "token issued before the reset still works until it expires (stateless JWT)");
	}

	section("9. Double-submit of OTP verify (user B, concurrent)");
	{
		const s = await new Client().req("POST", "/signup", { body: { name: "Test User B", email: emailB, bloodGroup: "A_POSITIVE", password: passA } });
		hint429(s);
		expect("signup B -> 200", s.status === 200, brief(s));
		const otp = await getOtp("signup", emailB);
		const [x, y] = await Promise.all([
			new Client().req("POST", "/otp-verify", { body: { email: emailB, otp } }),
			new Client().req("POST", "/otp-verify", { body: { email: emailB, otp } }),
		]);
		const codes = [x.status, y.status].sort();
		console.log(`    statuses: ${codes.join(", ")}`);
		expect("exactly one 201, the other a clean 4xx (no 500)", codes.filter((c) => c === 201).length === 1 && codes[1] < 500, `got ${codes.join(", ")}. A 500 means the loser hit an unhandled DB error - check the server console`);
	}

	section("10. Rate limiter / brute force (runs last, trips the limiter on purpose)");
	{
		const f = await anon.req("POST", "/forget-password", { body: { email: emailA } });
		if (f.status !== 200) {
			info("skipped: could not request a fresh OTP", brief(f));
		} else {
			const real = await getOtp("forget", emailA);
			let blockedAt = 0;
			let last = 0;
			for (let n = 1; n <= 12; n++) {
				const g = String(100000 + n * 7919).padStart(6, "0").slice(0, 6);
				const guess = g === real ? "123456" : g;
				const r = await anon.req("POST", "/reset-password", { body: { email: emailA, otp: guess, newPassword: newPassA } });
				last = r.status;
				if (r.status === 429) {
					blockedAt = n;
					break;
				}
			}
			if (blockedAt) {
				ok(`wrong-OTP guessing is rate limited (429 on attempt #${blockedAt})`);
				const after = await anon.req("POST", "/reset-password", { body: { email: emailA, otp: real, newPassword: newPassA } });
				info("after the block even the correct OTP gets", `HTTP ${after.status} (per-IP block, expected)`);
			} else {
				warn("NO rate limit on /reset-password", `12 wrong guesses in a row all returned ${last}; limiter missing or too loose`);
			}
		}
	}

	/* ---------------------------- summary ---------------------------- */
	console.log("\n==================== SUMMARY ====================");
	console.log(`PASS: ${R.pass}   FAIL: ${R.fail.length}   WARN: ${R.warn.length}   INFO: ${R.info.length}`);
	if (R.fail.length) {
		console.log("\nFAIL (bugs):");
		for (const f of R.fail) console.log(`  - ${f}`);
	}
	if (R.warn.length) {
		console.log("\nWARN:");
		for (const w of R.warn) console.log(`  - ${w}`);
	}
	console.log("\nNot covered (needs a DB edit): BLOCKED / DELETED / isDeleted users on signin, /me, refresh-token, forget-password.");
	console.log("The rate limiter is now tripped for ~10 minutes: restart the server before running this again.");
	console.log("\nCleanup test users (dev DB):\n  DELETE FROM users WHERE email LIKE 'bfl-test-%@example.com';");
	process.exit(R.fail.length ? 1 : 0);
}

main().catch((e) => {
	console.error("\nTest runner crashed:", e);
	process.exit(3);
});
