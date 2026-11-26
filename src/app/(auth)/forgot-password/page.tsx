import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard, AuthShell } from "@/components/auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <AuthCard>
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  );
}
