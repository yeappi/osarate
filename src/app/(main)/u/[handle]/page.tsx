"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/Loading";
import { useProfileByHandle } from "@/client/queries";
import { ProfileView } from "@/features/profile/ProfileView";

export default function UserPage() {
  const { handle } = useParams<{ handle: string }>();
  const profile = useProfileByHandle(decodeURIComponent(handle));
  const [preview, setPreview] = useState(false);
  useEffect(() => setPreview(new URLSearchParams(window.location.search).get("preview") === "1"), []);
  if (profile.data === undefined) return <Loading error={profile.error} />;
  if (profile.data === null) return <p className="text-sm">ユーザーが見つかりません</p>;
  return <ProfileView profile={profile.data} preview={preview} />;
}
