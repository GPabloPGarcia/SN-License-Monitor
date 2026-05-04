import { Suspense } from "react";
import { LoginForm } from "@/app/login/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>SN-License Monitor</CardTitle>
          <CardDescription>Acesse sua sessao para monitorar licencas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm next={next} />
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
