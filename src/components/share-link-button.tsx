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
      toast.success("Đã copy link");
    } catch {
      toast.error("Không copy được link");
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={share}>
      <Share2 />
      {label}
    </Button>
  );
}
