import { ActionForm } from "@/components/ActionForm";
import { updatePasswordAction } from "@/server/services/auth";

export default function UpdatePasswordPage() {
  return (
    <div className="space-y-4">
      <h2 className="h2">新しいパスワード</h2>
      <ActionForm action={updatePasswordAction} submitLabel="変更する" className="flex flex-col gap-2">
        <input name="password" type="password" required minLength={8} placeholder="新しいパスワード（8文字以上）" className="input" autoComplete="new-password" />
      </ActionForm>
    </div>
  );
}
