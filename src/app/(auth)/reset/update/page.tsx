"use client";

import { ActionForm } from "@/components/ActionForm";
import { PasswordInput } from "@/components/PasswordInput";
import { updatePasswordAction } from "@/server/services/auth";

export default function UpdatePasswordPage() {
  return (
    <div className="space-y-4">
      <h2 className="h2">新しいパスワード</h2>
      <ActionForm action={(fd) => updatePasswordAction(null, fd)} submitLabel="変更する" variant="primary" inline className="flex flex-col gap-2">
        <PasswordInput placeholder="新しいパスワード（8文字以上）" autoComplete="new-password" minLength={8} />
      </ActionForm>
    </div>
  );
}
