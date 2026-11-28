import Link from "next/link";

/** 規約などの読み物ページの枠 */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-md space-y-4 p-6 text-sm leading-relaxed">
      <p className="rounded-xl bg-gold-soft px-3 py-2 text-xs">
        この文書は公開前の下書きです。内容は専門家の確認を経て確定します。
      </p>
      <h1 className="font-round text-2xl font-bold">{title}</h1>
      <p className="text-xs text-sub">最終更新：{updated}</p>
      <div className="space-y-4 [&_h2]:mt-6 [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc">{children}</div>
      <p className="pt-4 text-xs">
        <Link href="/terms" className="link">利用規約</Link>・<Link href="/privacy" className="link">プライバシーポリシー</Link>・<Link href="/" className="link">トップへ</Link>
      </p>
    </main>
  );
}
