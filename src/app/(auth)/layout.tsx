export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-2xl font-bold">推されーと</h1>
      {children}
    </main>
  );
}
