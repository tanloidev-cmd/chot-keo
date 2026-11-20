"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function extractToken(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.includes("/join/")) {
    return trimmed.split("/join/")[1]?.split(/[?#]/)[0] ?? "";
  }
  return trimmed;
}

export function JoinByLinkForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const token = extractToken(value);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Dán đường dẫn mời hoặc mã mời"
          className="h-11 pl-9"
        />
      </div>
      <Button
        type="button"
        className="h-11 w-full"
        disabled={!token}
        onClick={() => router.push(`/join/${encodeURIComponent(token)}`)}
      >
        Mở đường dẫn mời
        <ArrowRight />
      </Button>
    </div>
  );
}
