import { getSetting } from "@/server/queries/catalog";
import { createSupabaseServer } from "@/server/supabase/server";

export type MachineBoard = {
  id: number;
  name: string;
  spins: number;
  hits: number;
  big_hits: number;
  max_payout: number;
};

/** 本日の台の公開統計（見極め材料） */
export async function getMachineBoard(): Promise<MachineBoard[]> {
  const supabase = await createSupabaseServer();
  const tz = (await getSetting<string>("timezone")) ?? "Asia/Tokyo";
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: tz }); // YYYY-MM-DD
  const [{ data: machines }, { data: daily }] = await Promise.all([
    supabase.from("oshi_pachi_machines").select("id, name").order("sort"),
    supabase.from("oshi_pachi_daily").select("machine_id, spins, hits, big_hits, max_payout").eq("day", today),
  ]);
  return (machines ?? []).map((m) => {
    const d = (daily ?? []).find((x) => x.machine_id === m.id);
    return {
      id: m.id as number,
      name: m.name as string,
      spins: (d?.spins as number) ?? 0,
      hits: (d?.hits as number) ?? 0,
      big_hits: (d?.big_hits as number) ?? 0,
      max_payout: (d?.max_payout as number) ?? 0,
    };
  });
}

export async function getSpinConfig() {
  const [cost, max, rateIn, rateOut] = await Promise.all([
    getSetting<number>("pachi_spin_cost"),
    getSetting<number>("pachi_max_spins_per_request"),
    getSetting<number>("pachi_ball_rate_in"),
    getSetting<number>("pachi_ball_rate_out"),
  ]);
  return { cost: cost ?? 10, max: max ?? 10, rateIn: rateIn ?? 1, rateOut: rateOut ?? 1 };
}
