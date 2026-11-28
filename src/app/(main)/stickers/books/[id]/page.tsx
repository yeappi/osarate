"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { presentBook, toggleBookLike } from "@/client/mutations";
import { ShareButton } from "@/components/ShareButton";
import { RecipientFields } from "@/features/gift/RecipientFields";
import { useBook, useBookLikes, useMe, useStorage } from "@/client/queries";
import { BookEditor } from "@/features/book-editor/BookEditor";

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const book = useBook(id);
  const me = useMe();
  const editable = !!book.data && me.data?.userId === book.data.book.owner_id;
  const storage = useStorage(editable ? me.data!.userId : null);
  const likes = useBookLikes(id, me.data?.userId ?? null);

  if (book.data === undefined) return <Loading error={book.error} />;
  if (book.data === null) return <p className="text-sm">シール帳が見つかりません</p>;
  const { book: b, items } = book.data;

  return (
    <div>
      <p className="text-sm">
        <Link href={editable ? "/stickers" : "/search"} className="link">← 戻る</Link>
      </p>
      <h1 className="h2">
        {b.type.name}
      </h1>
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          className={`chip ${likes.data?.liked ? "text-accent-ink" : "text-sub"}`}
          disabled={editable || !me.data?.userId}
          onClick={() => void toggleBookLike(b.id)}
          aria-label="いいね"
        >
          {likes.data?.liked ? "♥" : "♡"} <span className="num">{likes.data?.count ?? 0}</span>
        </button>
        <ShareButton path={`/stickers/books/${b.id}`} title={`${b.type.name}｜推されーと`} className="chip text-sub" />
      </div>
      <BookEditor
        bookId={b.id}
        pageCount={b.type.page_count}
        canvas={{ w: b.type.page_w, h: b.type.page_h }}
        items={items}
        editable={editable}
        storage={(storage.data ?? []).map((s) => ({
          sticker_id: s.id,
          name: s.type.name,
          image_path: s.type.image_path,
          w: s.type.width,
          h: s.type.height,
        }))}
      />
      {editable && (
        <details className="mt-6 text-sm">
          <summary className="link cursor-pointer text-xs">このシール帳をプレゼントする</summary>
          <p className="my-2 text-xs text-sub">貼ってあるシールは先に剥がしてください。プレゼントすると手元からなくなります。</p>
          <ActionForm action={presentBook} submitLabel="プレゼント" variant="accent" confirm="このシール帳をプレゼントしますか？手元からなくなります。" className="flex flex-col gap-1">
            <input type="hidden" name="bookId" value={b.id} />
            <RecipientFields />
          </ActionForm>
        </details>
      )}
    </div>
  );
}
