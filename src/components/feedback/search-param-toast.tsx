"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

const messages: Record<string, string> = {
  "client-created": "Cliente criado com sucesso.",
  "client-updated": "Cliente atualizado com sucesso.",
  "instance-created": "Instancia criada com sucesso.",
  "instance-updated": "Instancia atualizada com sucesso.",
  "user-created": "Usuario criado com sucesso.",
  "user-updated": "Usuario atualizado com sucesso."
};

export function SearchParamToast() {
  const searchParams = useSearchParams();
  const toastKey = searchParams.get("toast");
  const error = searchParams.get("error");

  useEffect(() => {
    if (toastKey && messages[toastKey]) {
      toast.success(messages[toastKey]);
    }

    if (error) {
      toast.error(error);
    }
  }, [toastKey, error]);

  return null;
}
