import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

const admin = createClient(url, secret, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = "Chotkeo123";
const suffix = process.env.AUTH_PHONE_EMAIL_DOMAIN ?? "phone.chotkeo.invalid";
const demoUsers = [
  { phone: "+84900000001", name: "An" },
  { phone: "+84900000002", name: "Bình" },
  { phone: "+84900000003", name: "Chi" },
];

async function ensureUser({ phone, name }) {
  const email = `${phone.replace(/\D/g, "")}@${suffix}`;
  const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = existing?.users?.find((user) => user.email === email);
  if (found) {
    console.log(`User ${name} already exists`);
    return found.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: name },
  });

  if (error || !data.user) throw error;
  console.log(`Created ${name}: ${phone} / ${password}`);
  return data.user.id;
}

const ids = {};
const recoveryCodes = {};
for (const user of demoUsers) {
  ids[user.name] = await ensureUser(user);
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const bytes = randomBytes(16);
  let raw = "";
  for (const byte of bytes) raw += alphabet[byte % alphabet.length];
  recoveryCodes[user.name] = raw.match(/.{1,4}/g).join("-");
  await admin.rpc("create_account_recovery", {
    p_user_id: ids[user.name],
    p_phone: user.phone,
    p_hash: createHash("sha256").update(raw).digest("hex"),
  });
}

const ownerId = ids.An;
const groupId = crypto.randomUUID();
const meetupId = crypto.randomUUID();

const { data: existingGroup } = await admin
  .from("groups")
  .select("id")
  .eq("name", "Hội bạn demo")
  .maybeSingle();

let finalGroupId = existingGroup?.id ?? groupId;

if (!existingGroup) {
  const { error: groupError } = await admin.from("groups").insert({
    id: groupId,
    owner_id: ownerId,
    name: "Hội bạn demo",
    description: "Nhóm mẫu để thử Chốt Kèo",
  });
  if (groupError) throw groupError;
  console.log("Created group Hội bạn demo");
}

for (const name of ["Bình", "Chi"]) {
  const { error } = await admin.from("group_members").upsert(
    {
      group_id: finalGroupId,
      user_id: ids[name],
      role: "member",
      status: "active",
    },
    { onConflict: "group_id,user_id" },
  );
  if (error) throw error;
}

const today = new Date();
const nextSaturday = new Date(today);
nextSaturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));

const dates = [];
for (let week = 0; week < 2; week += 1) {
  const saturday = new Date(nextSaturday);
  saturday.setDate(nextSaturday.getDate() + week * 7);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  dates.push(saturday, sunday);
}

const statuses = ["available", "maybe", "unavailable"];
for (const [index, userId] of Object.values(ids).entries()) {
  for (const [dateIndex, date] of dates.entries()) {
    const key = date.toISOString().slice(0, 10);
    await admin.from("availability_entries").upsert(
      {
        group_id: finalGroupId,
        user_id: userId,
        local_date: key,
        status: statuses[(index + dateIndex) % statuses.length],
      },
      { onConflict: "group_id,user_id,local_date" },
    );
  }
}

const { data: existingMeetup } = await admin
  .from("meetups")
  .select("id")
  .eq("group_id", finalGroupId)
  .eq("title", "Cà phê sáng thứ Bảy")
  .maybeSingle();

if (!existingMeetup) {
  const saturday = nextSaturday;
  saturday.setHours(9, 0, 0, 0);
  const end = new Date(saturday);
  end.setHours(12, 0, 0, 0);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  const { error: meetupError } = await admin.from("meetups").insert({
    id: meetupId,
    group_id: finalGroupId,
    created_by: ownerId,
    title: "Cà phê sáng thứ Bảy",
    description: "Kèo demo để thử bình chọn, chốt kèo và RSVP.",
    activity_type: "coffee",
    status: "proposed",
  });
  if (meetupError) throw meetupError;

  await admin.from("meetup_time_options").insert([
    {
      meetup_id: meetupId,
      starts_at: saturday.toISOString(),
      ends_at: end.toISOString(),
      label: "Sáng thứ Bảy",
      position: 0,
    },
    {
      meetup_id: meetupId,
      starts_at: sunday.toISOString(),
      ends_at: new Date(sunday.getTime() + 3 * 3600_000).toISOString(),
      label: "Sáng Chủ nhật",
      position: 1,
    },
  ]);

  await admin.from("meetup_venue_options").insert([
    {
      meetup_id: meetupId,
      name: "The Coffee House",
      address: "Quận 1, TP.HCM",
      note: "Có bàn lớn",
      position: 0,
    },
  ]);

  console.log("Created demo meetup Cà phê sáng thứ Bảy");
}

console.log("\nDemo accounts (phone / password / recovery code):");
for (const user of demoUsers) {
  console.log(`${user.phone} / ${password} / ${recoveryCodes[user.name]}`);
}
console.log("Login uses the phone number; no SMS is sent.");
