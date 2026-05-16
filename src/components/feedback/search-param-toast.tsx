"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const messages: Record<string, string> = {
  "client-created": "Cliente criado com sucesso.",
  "client-updated": "Cliente atualizado com sucesso.",
  "client-deleted": "Cliente excluido com sucesso.",
  "instance-created": "Instancia criada com sucesso.",
  "instance-updated": "Instancia atualizada com sucesso.",
  "instance-deleted": "Instancia excluida com sucesso.",
  "user-created": "Usuario criado com sucesso.",
  "user-updated": "Usuario atualizado com sucesso.",
  "user-activated": "Usuario ativado com sucesso.",
  "user-deactivated": "Usuario desativado com sucesso.",
  "user-deleted": "Usuario excluido com sucesso."
};

export function SearchParamToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");
  const error = searchParams.get("error");
  const handledKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const notificationKey = `${toastKey ?? ""}:${error ?? ""}`;

    if ((!toastKey && !error) || handledKeyRef.current === notificationKey) {
      return;
    }

    handledKeyRef.current = notificationKey;

    if (toastKey && messages[toastKey]) {
      toast.success(messages[toastKey], {
        id: `search-param-toast:${toastKey}`
      });
    }

    if (error) {
      toast.error(error, {
        id: `search-param-error:${error}`
      });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("toast");
    nextParams.delete("error");

    const nextQuery = nextParams.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false
    });
  }, [error, pathname, router, searchParams, toastKey]);

  return null;
}
