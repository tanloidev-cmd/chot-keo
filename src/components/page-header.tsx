import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PageHeader({
  title,
  description,
  backHref,
  action,
}: {
  title: string;
  description?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      {backHref ? (
        <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
          <Link href={backHref} aria-label="Quay lại">
            <ArrowLeft />
          </Link>
        </Button>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="text-balance break-words text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
