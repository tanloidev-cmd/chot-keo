import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

config({ path: ".env.local" });

const [phoneArg, newPassword] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const domain = process.env.AUTH_PHONE_EMAIL_DOMAIN ?? "phone.chotkeo.invalid";

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}
if (!phoneArg || !newPassword) {
  console.error("Usage: npm run admin:reset -- 0901234567 NewPassword123");
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error("Password must be at least 8 characters");
  process.exit(1);
}

const digits = phoneArg.replace(/\D/g, "");
const e164 = digits.startsWith("84")
  ? `+${digits}`
  : digits.startsWith("0")
    ? `+84${digits.slice(1)}`
    : `+84${digits}`;
const identityDigits = e164.replace(/\D/g, "");
const email = `${identityDigits}@${domain}`;
const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: list, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});
if (listError) throw listError;

const user = list.users.find((candidate) => candidate.email === email);
if (!user) {
  console.error(`No user found for ${phoneArg} (${email})`);
  process.exit(1);
}

const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
  password: newPassword,
});
if (updateError) throw updateError;

const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const bytes = randomBytes(16);
let raw = "";
for (const byte of bytes) raw += alphabet[byte % alphabet.length];
const code = raw.match(/.{1,4}/g).join("-");
const hash = createHash("sha256").update(raw).digest("hex");

const { error: recoveryError } = await admin.rpc("create_account_recovery", {
  p_user_id: user.id,
  p_phone: e164,
  p_hash: hash,
});
if (recoveryError) throw recoveryError;

console.log(`Password reset for ${phoneArg}`);
console.log(`New recovery code: ${code}`);
console.log("Store it safely; it is shown only once.");
