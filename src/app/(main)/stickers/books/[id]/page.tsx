"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ActionForm } from "@/components/ActionForm";
import { Loading } from "@/components/Loading";
import { presentBook } from "@/client/mutations";
import { RecipientFields } from "@/features/gift/RecipientFields";
import { useBook, useMe, useStorage } from "@/client/queries";
import { BookEditor } from "@/features/book-editor/BookEditor";

export default function BookPage() {
  const { id } = useParams<{ id: string }>();
  const book = useBook(id);
  const me = useMe();
  const editable = !!book.data && me.data?.userId === book.data.book.owner_id;
  const storage = useStorage(editable ? me.data!.userId : null);

  if (book.data === undefined) return <Loading error={book.error} />;
  if (book.data === null) return <p className="text-sm">シール帳が見つかりません</p>;
  const { book: b, items } = book.data;

  return (
    <div>
      <p className="text-sm">
        <Link href={editable ? "/stickers" : "/search"} className="link">← 戻る</Link>
      </p>
      <h1 className="h2">
        {b.type.name} <span className="text-xs font-normal">No.{b.serial_no}</span>
      </h1>
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
          <ActionForm action={presentBook} submitLabel="プレゼント" confirm="このシール帳をプレゼントしますか？">
            <input type="hidden" name="bookId" value={b.id} />
            <RecipientFields />
          </ActionForm>
        </details>
      )}
    </div>
  );
}
