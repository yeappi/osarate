"use client";

import { Loading } from "@/components/Loading";
import { useMe } from "@/client/queries";
import { ProfileView } from "@/features/profile/ProfileView";
import { QuestPanel } from "@/features/quest/QuestPanel";
import { TodayCard } from "@/features/profile/TodayCard";

export default function MePage() {
  const me = useMe();
  if (!me.data?.profile) return <Loading error={me.error} />;
  return (
    <>
      <TodayCard />
      <QuestPanel />
      <ProfileView profile={me.data.profile} />
    </>
  );
}
