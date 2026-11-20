"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function ShareLinkButton({
  path,
  title,
  label = "Chia sẻ",
}: {
  path: string;
  title: string;
  label?: string;
}) {
  async function share() {
    const url = new URL(path, window.location.origin).toString();

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled; fall through to copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("Đã sao chép đường dẫn");
    } catch {
      toast.error("Không sao chép được đường dẫn");
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={share}
      aria-label={label}
      title={label}
    >
      <Share2 />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
