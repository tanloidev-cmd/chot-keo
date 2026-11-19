import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const domain = process.env.AUTH_PHONE_EMAIL_DOMAIN ?? "phone.chotkeo.invalid";

if (!url || !publishable || !secret) {
  console.error("Missing Supabase env. Start local Supabase or use cloud env.");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const password = "Chotkeo123";
const stamp = Date.now();

async function makeUser(name) {
  const digits = `8499${String(stamp).slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
  const email = `${digits}@${domain}`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });
  if (error) throw error;
  return { id: data.user.id, email };
}

async function signIn(user) {
  const client = createClient(url, publishable, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: user.email,
    password,
  });
  if (error) throw error;
  return client;
}

const owner = await makeUser("Race Owner");
const member = await makeUser("Race Admin");
const ownerClient = await signIn(owner);
const memberClient = await signIn(member);

const groupId = crypto.randomUUID();
const { error: groupError } = await admin.from("groups").insert({
  id: groupId,
  owner_id: owner.id,
  name: `Race test ${stamp}`,
});
if (groupError) throw groupError;

await admin.from("group_members").insert({
  group_id: groupId,
  user_id: member.id,
  role: "admin",
  status: "active",
});

// --- Invite max_uses = 1, two users redeem at the same time -----------------
const invitee1 = await makeUser("Race Invitee 1");
const invitee2 = await makeUser("Race Invitee 2");
const inviteeClient1 = await signIn(invitee1);
const inviteeClient2 = await signIn(invitee2);
const rawToken = randomBytes(32).toString("base64url");
const tokenHash = createHash("sha256").update(rawToken).digest("hex");

await admin.from("group_invites").insert({
  id: crypto.randomUUID(),
  group_id: groupId,
  created_by: owner.id,
  token_hash: tokenHash,
  max_uses: 1,
});

const inviteResults = await Promise.allSettled([
  inviteeClient1.rpc("redeem_group_invite", { p_token_hash: tokenHash }),
  inviteeClient2.rpc("redeem_group_invite", { p_token_hash: tokenHash }),
]);
const inviteSuccesses = inviteResults.filter(
  (result) => result.status === "fulfilled" && !result.value.error,
).length;
const { data: inviteRow } = await admin
  .from("group_invites")
  .select("uses_count")
  .eq("token_hash", tokenHash)
  .single();

console.log("Invite concurrency:");
console.log(`  successes=${inviteSuccesses} (expected 1)`);
console.log(`  uses_count=${inviteRow?.uses_count} (expected 1)`);

// --- Confirm race with two options ------------------------------------------
const meetupId = crypto.randomUUID();
const optionA = crypto.randomUUID();
const optionB = crypto.randomUUID();
const start = new Date(Date.now() + 86_400_000);

await admin.from("meetups").insert({
  id: meetupId,
  group_id: groupId,
  created_by: owner.id,
  title: `Race meetup ${stamp}`,
  activity_type: "hangout",
});
await admin.from("meetup_time_options").insert([
  {
    id: optionA,
    meetup_id: meetupId,
    starts_at: start.toISOString(),
    ends_at: new Date(start.getTime() + 3 * 3600_000).toISOString(),
  },
  {
    id: optionB,
    meetup_id: meetupId,
    starts_at: new Date(start.getTime() + 86_400_000).toISOString(),
    ends_at: new Date(start.getTime() + 86_400_000 + 3 * 3600_000).toISOString(),
  },
]);
await ownerClient.rpc("publish_meetup", { p_meetup_id: meetupId });

const confirmResults = await Promise.allSettled([
  ownerClient.rpc("confirm_meetup", {
    p_meetup_id: meetupId,
    p_time_option_id: optionA,
    p_venue_option_id: null,
  }),
  memberClient.rpc("confirm_meetup", {
    p_meetup_id: meetupId,
    p_time_option_id: optionB,
    p_venue_option_id: null,
  }),
]);
const confirmSuccesses = confirmResults.filter(
  (result) => result.status === "fulfilled" && !result.value.error,
).length;
const { data: meetupRow } = await admin
  .from("meetups")
  .select("status, confirmed_time_option_id")
  .eq("id", meetupId)
  .single();

console.log("Confirm concurrency:");
console.log(`  successes=${confirmSuccesses} (expected 1)`);
console.log(`  status=${meetupRow?.status} (expected confirmed)`);

// Cleanup
await admin.from("groups").delete().eq("id", groupId);
for (const user of [owner, member, invitee1, invitee2]) {
  await admin.auth.admin.deleteUser(user.id).catch(() => null);
}

const ok = inviteSuccesses === 1 && inviteRow?.uses_count === 1 && confirmSuccesses === 1 && meetupRow?.status === "confirmed";
if (!ok) {
  console.error("Concurrency checks failed");
  process.exitCode = 1;
} else {
  console.log("Concurrency checks passed");
}
