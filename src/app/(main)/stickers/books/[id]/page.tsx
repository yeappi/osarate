import Link from "next/link";
import { notFound } from "next/navigation";
import { BookEditor } from "@/features/book-editor/BookEditor";
import { getBook, listStorage } from "@/server/queries/items";
import { getMe } from "@/server/queries/me";

export default async function BookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getBook(id);
  if (!data) notFound();
  const me = await getMe();
  const editable = me.user?.id === data.book.owner_id;
  const storage = editable ? await listStorage(data.book.owner_id) : [];

  return (
    <div>
      <p className="text-sm">
        <Link href={editable ? "/stickers" : "/search"} className="link">← 戻る</Link>
      </p>
      <h1 className="h2">
        {data.book.type.name} <span className="text-xs font-normal">No.{data.book.serial_no}</span>
      </h1>
      <BookEditor
        bookId={data.book.id}
        pageCount={data.book.type.page_count}
        canvas={{ w: data.book.type.page_w, h: data.book.type.page_h }}
        items={data.items}
        editable={editable}
        storage={storage.map((s) => ({
          sticker_id: s.id,
          name: s.type.name,
          image_path: s.type.image_path,
          w: s.type.width,
          h: s.type.height,
        }))}
      />
    </div>
  );
}
