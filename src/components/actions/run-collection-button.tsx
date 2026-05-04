"use client";

import { useTransition } from "react";
import { Play, PlugZap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type ActionResult = Promise<{ ok: boolean; message: string }>;

export function RunCollectionButton({
  label,
  action,
  variant = "default"
}: {
  label: string;
  action: () => ActionResult;
  variant?: "default" | "outline" | "secondary";
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        });
      }}
    >
      <Play className="h-4 w-4" />
      {pending ? "Executando..." : label}
    </Button>
  );
}

export function TestConnectionButton({
  action
}: {
  action: () => ActionResult;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await action();
          if (result.ok) {
            toast.success(result.message);
          } else {
            toast.error(result.message);
          }
        });
      }}
    >
      <PlugZap className="h-4 w-4" />
      {pending ? "Testando..." : "Testar conexao"}
    </Button>
  );
}
