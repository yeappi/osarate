import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 font-round text-2xl font-bold">推されーと</h1>
      {children}
      <p className="mt-10 text-center text-xs text-sub">
        <Link href="/terms" className="link">利用規約</Link>・<Link href="/privacy" className="link">プライバシーポリシー</Link>
      </p>
    </main>
  );
}
