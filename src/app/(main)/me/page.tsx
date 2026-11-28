"use client";

import { Loading } from "@/components/Loading";
import { useMe } from "@/client/queries";
import { ProfileView } from "@/features/profile/ProfileView";
import { QuestPanel } from "@/features/quest/QuestPanel";

export default function MePage() {
  const me = useMe();
  if (!me.data?.profile) return <Loading error={me.error} />;
  return (
    <>
      <QuestPanel />
      <ProfileView profile={me.data.profile} />
    </>
  );
}
