import { redirect } from "next/navigation";
import { requireMe } from "@/server/queries/me";

export default async function MePage() {
  const me = await requireMe();
  if (!me) redirect("/welcome");
  redirect(`/u/${me.profile.handle}`);
}
