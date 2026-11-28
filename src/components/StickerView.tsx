import { STICKER_BUCKET } from "@/config/app";

export function stickerImageUrl(path: string | null): string | null {
  if (!path) return null;
  // "/" で始まるものはアプリ同梱の公式シール（public/stickers）
  if (path.startsWith("/")) return path;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STICKER_BUCKET}/${path}`;
}

type Props = {
  name: string;
  imagePath: string | null;
  /** 固有サイズ（論理座標）。fixed を指定すると無視して正方形のタイルで表示 */
  w: number;
  h: number;
  scale?: number;
  fixed?: number;
  sealed?: boolean;
  gray?: boolean;
};

/** シール1枚の表示。画像がなければ名前入りの丸いシールで代用 */
export function StickerView({ name, imagePath, w, h, scale = 1, fixed, sealed, gray }: Props) {
  const width = fixed ?? w * scale;
  const height = fixed ?? h * scale;
  const url = stickerImageUrl(imagePath);
  const tile = fixed !== undefined;

  return (
    <div
      title={name}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden ${
        tile ? `rounded-tile ${sealed ? "border-[1.5px] border-dashed border-line bg-muted" : "bg-paper"}` : ""
      } ${gray ? "opacity-35 grayscale" : ""}`}
      style={{ width, height }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={name}
          className={`h-full w-full object-contain ${tile ? "p-1.5" : ""} drop-shadow-[0_2px_2px_rgba(0,0,0,0.12)]`}
        />
      ) : (
        <span
          className={`flex items-center justify-center rounded-full border-2 border-surface bg-accent-soft text-center font-round font-bold leading-tight text-accent-ink shadow-lift ${
            tile ? "h-[78%] w-[78%] text-[10px]" : "h-full w-full text-[9px]"
          }`}
        >
          {name}
        </span>
      )}
      {sealed && (
        <span className="absolute right-1 top-1 rounded-full bg-ink px-1.5 py-px text-[8px] font-bold text-surface">未開封</span>
      )}
    </div>
  );
}
