"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ActionForm } from "@/components/ActionForm";
import { bookTone } from "@/components/BookTile";
import { Loading } from "@/components/Loading";
import { StickerView } from "@/components/StickerView";
import { chooseStarter } from "@/client/mutations";
import { useMe, useStarterOptions } from "@/client/queries";

// 初期アイテムの選択（シール1種・シール帳1種）。選んだものは図鑑で買えず、プレゼントでしか手に入らない
export default function StarterPage() {
  const router = useRouter();
  const me = useMe();
  const hasProfile = !!me.data?.profile;
  const opts = useStarterOptions(hasProfile);
  const [sticker, setSticker] = useState<number | null>(null);
  const [book, setBook] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!me.data || !me.fresh) return;
    if (!me.data.userId) router.replace("/login");
    else if (!me.data.profile) router.replace("/welcome");
    else if (opts.data?.chosen && opts.fresh && !done) router.replace("/me");
  }, [me.data, me.fresh, opts.data, opts.fresh, router, done]);

  const BOOK_NOTE: Record<string, string> = {
    kraft: "あたたかい紙の色。どんなシールにも合う",
    midnight: "深い夜の色。キラキラしたシールが映える",
    rose: "やわらかいバラ色。やさしい雰囲気に",
  };

  // 受け取った直後の見せ場
  if (done && opts.data) {
    const st = opts.data.stickers.find((x) => x.id === sticker);
    const bk = opts.data.books.find((x) => x.id === book);
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
        <p className="font-round text-sm font-bold text-accent-ink">受け取りました！</p>
        <div className="paper flex w-full items-end justify-center gap-6 rounded-[26px] px-4 py-8">
          {st && (
            <div className="animate-pop">
              <StickerView name={st.name} imagePath={st.image_path} w={st.width * 1.6} h={st.height * 1.6} />
            </div>
          )}
          {bk && (
            <div className={`animate-pop flex h-32 w-24 flex-col justify-end rounded-[10px_18px_18px_10px] p-2 text-left shadow-lg ${bookTone(bk.theme, 0)}`}>
              <span className="text-[11px] font-bold leading-tight">{bk.name}</span>
            </div>
          )}
        </div>
        <div className="space-y-1 text-sm">
          <p>
            <b>{st?.name}</b> は未開封でバッグに入っています。
          </p>
          <p className="text-sub">開封してシール帳に貼るか、だれかに贈れます。プロフィールの「はじめてのクエスト」で、合計3,000ptもらえます。</p>
        </div>
        <button className="btn-primary min-h-12 w-full text-base" onClick={() => router.replace("/me")}>
          はじめる
        </button>
      </main>
    );
  }

  if (!opts.data || opts.data.chosen) return <Loading error={me.error ?? opts.error} />;
  const { stickers, books } = opts.data;

  return (
    <main className="mx-auto max-w-md space-y-5 p-5">
      <div>
        <h1 className="font-round text-2xl font-bold">はじまりのアイテム</h1>
        <p className="mt-1 text-sm text-sub">
          シールとシール帳を1つずつ選んでください。ここで選べるアイテムはショップや図鑑では買えず、持っている人からのプレゼントでしか手に入りません。
        </p>
      </div>

      <section>
        <h2 className="h2">シール</h2>
        <ul className="grid grid-cols-3 gap-2">
          {stickers.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSticker(s.id)}
                className={`flex w-full flex-col items-center gap-1 rounded-tile border bg-surface p-2 ${sticker === s.id ? "border-accent ring-2 ring-accent" : "border-line"}`}
              >
                <StickerView name={s.name} imagePath={s.image_path} w={s.width} h={s.height} fixed={76} />
                <span className="text-xs font-bold">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="h2">シール帳</h2>
        <ul className="grid grid-cols-3 gap-2">
          {books.map((b, i) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setBook(b.id)}
                className={`flex h-28 w-full flex-col justify-end rounded-tile p-2.5 text-left ${bookTone(b.theme, i)} ${book === b.id ? "ring-2 ring-accent ring-offset-2" : ""}`}
              >
                <span className="text-xs font-bold leading-tight">{b.name}</span>
                <span className="text-[10px] opacity-70">{b.page_count}ページ</span>
              </button>
            </li>
          ))}
        </ul>
        {book && <p className="mt-2 text-xs text-sub">{BOOK_NOTE[books.find((b) => b.id === book)?.theme ?? ""] ?? ""}</p>}
      </section>

      {sticker && book ? (
        <ActionForm action={chooseStarter} submitLabel="この2つにする" variant="primary" className="flex flex-col gap-2" onDone={(r) => r?.ok && setDone(true)}>
          <input type="hidden" name="stickerType" value={sticker} />
          <input type="hidden" name="bookType" value={book} />
        </ActionForm>
      ) : (
        <p className="text-center text-sm text-sub">シールとシール帳を選んでください</p>
      )}
    </main>
  );
}
