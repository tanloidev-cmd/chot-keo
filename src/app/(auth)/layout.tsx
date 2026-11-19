import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-b from-orange-50 via-background to-background">
      <header className="mx-auto flex h-16 w-full max-w-md items-center px-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            CK
          </span>
          <span className="text-lg font-semibold tracking-tight">Chốt Kèo</span>
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-10">
        {children}
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-muted-foreground">
        Bằng việc tiếp tục, bạn đồng ý với{" "}
        <Link href="/terms" className="underline underline-offset-4">
          điều khoản
        </Link>{" "}
        và{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          chính sách riêng tư
        </Link>
        .
      </footer>
    </div>
  );
}
