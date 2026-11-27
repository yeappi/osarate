"use client";

import { useSetting } from "@/client/queries";
import { useQuery } from "@/client/store";
import { must, sb } from "@/client/supabase";

export type MachineBoard = { id: number; name: string; spins: number; hits: number; big_hits: number; max_payout: number };

/** 本日の台の公開統計（見極め材料） */
export function useMachineBoard() {
  const tz = useSetting<string>("timezone");
  const zone = tz.data ?? "Asia/Tokyo";
  return useQuery(tz.data === undefined ? null : `pachi:board:${zone}`, async (): Promise<MachineBoard[]> => {
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: zone }); // YYYY-MM-DD
    const [machines, daily] = await Promise.all([
      sb().from("oshi_pachi_machines").select("id, name").order("sort"),
      sb().from("oshi_pachi_daily").select("machine_id, spins, hits, big_hits, max_payout").eq("day", today),
    ]);
    type D = { machine_id: number; spins: number; hits: number; big_hits: number; max_payout: number };
    const ds = (must(daily) as D[] | null) ?? [];
    return ((must(machines) as { id: number; name: string }[] | null) ?? []).map((m) => {
      const d = ds.find((x) => x.machine_id === m.id);
      return { id: m.id, name: m.name, spins: d?.spins ?? 0, hits: d?.hits ?? 0, big_hits: d?.big_hits ?? 0, max_payout: d?.max_payout ?? 0 };
    });
  });
}

export function useSpinConfig() {
  const cost = useSetting<number>("pachi_spin_cost");
  const max = useSetting<number>("pachi_max_spins_per_request");
  const rateIn = useSetting<number>("pachi_ball_rate_in");
  const rateOut = useSetting<number>("pachi_ball_rate_out");
  return { cost: cost.data ?? 10, max: max.data ?? 10, rateIn: rateIn.data ?? 1, rateOut: rateOut.data ?? 1 };
}
