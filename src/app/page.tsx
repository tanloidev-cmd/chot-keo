import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  MailX,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Vote,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

const features = [
  {
    icon: CalendarCheck2,
    title: "Lịch rảnh rõ ràng",
    body: "Mỗi người đánh dấu rảnh, bận hoặc có thể. Cả nhóm thấy ngay cuối tuần nào phù hợp.",
  },
  {
    icon: Vote,
    title: "Bình chọn ngày & địa điểm",
    body: "Tạo nhiều phương án, bình chọn, rồi chốt một phương án minh bạch.",
  },
  {
    icon: UsersRound,
    title: "RSVP & chủ xị",
    body: "Biết ai sẽ đi, ai còn chờ và giao người phụ trách kèo.",
  },
  {
    icon: ShieldCheck,
    title: "Riêng tư theo nhóm",
    body: "Dữ liệu được tách theo nhóm, phân quyền Owner / Admin / Member.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/home");

  return (
    <div className="min-h-dvh bg-gradient-to-b from-orange-50 via-background to-background">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            CK
          </span>
          <span className="text-lg font-semibold tracking-tight">Chốt Kèo</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 pb-16">
        <section className="grid gap-8 py-10 md:grid-cols-[1.1fr_0.9fr] md:items-center md:py-16">
          <div>
            <Badge className="bg-emerald-100 text-emerald-800">
              <MailX className="size-3.5" />
              Không cần email, không chờ SMS
            </Badge>
            <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Chốt lịch gặp nhóm bạn trong vài lần chạm.
            </h1>
            <p className="mt-4 max-w-xl text-balance text-base text-muted-foreground md:text-lg">
              Khai báo lịch rảnh, bình chọn ngày giờ và địa điểm, RSVP và giao
              chủ xị — tất cả trong một đường link dễ chia sẻ qua Zalo.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-11">
                <Link href="/register">
                  Tạo tài khoản bằng SĐT
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11">
                <Link href="/login">Tôi đã có tài khoản</Link>
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                0 đồng vận hành
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Cài như ứng dụng (PWA)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Mobile-first
              </span>
            </div>
          </div>

          <Card className="overflow-hidden border-orange-200 bg-white/80 shadow-lg">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Kèo cuối tuần</p>
                  <p className="text-xs text-muted-foreground">Nhóm Bạn Thân</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800">Đã chốt</Badge>
              </div>
              <div className="rounded-2xl bg-orange-50 p-4">
                <p className="text-lg font-semibold">Cà phê sáng thứ Bảy</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  09:00 • Thứ Bảy, 21/11
                </p>
                <p className="mt-1 text-sm">The Coffee House — Quận 1</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ["5", "Sẽ đi"],
                  ["2", "Có thể"],
                  ["1", "Chưa trả lời"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-xl border p-3">
                    <p className="text-xl font-semibold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-sm">
                <Sparkles className="size-4 text-primary" />
                <span>Minh là chủ xị. Nhắc trước 24h và 2h.</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <CardContent className="flex gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {feature.body}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-12">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Ba bước để chốt kèo
          </h2>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              ["1", "Tạo nhóm", "Tạo nhóm và gửi link mời qua Zalo."],
              ["2", "Khai báo lịch", "Đánh dấu rảnh/bận cho các ngày cuối tuần."],
              ["3", "Chốt kèo", "Bình chọn, chốt phương án, RSVP và giao chủ xị."],
            ].map(([step, title, body]) => (
              <Card key={step}>
                <CardContent className="p-4">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {step}
                  </span>
                  <p className="mt-3 font-medium">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t bg-background/80">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>Chốt Kèo — sản phẩm MVP cho nhóm bạn.</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-foreground">
              Riêng tư
            </Link>
            <Link href="/terms" className="hover:text-foreground">
              Điều khoản
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
