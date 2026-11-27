import { STICKER_BUCKET } from "@/config/app";

export function stickerImageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${STICKER_BUCKET}/${path}`;
}

type Props = {
  name: string;
  imagePath: string | null;
  /** 固有サイズ（論理座標）。fixed を指定すると無視して正方形で表示 */
  w: number;
  h: number;
  scale?: number;
  fixed?: number;
  sealed?: boolean;
  gray?: boolean;
};

/** シール1枚の表示。画像がなければ名前入りの枠で代用（デザイン工程で差し替え） */
export function StickerView({ name, imagePath, w, h, scale = 1, fixed, sealed, gray }: Props) {
  const width = fixed ?? w * scale;
  const height = fixed ?? h * scale;
  const url = stickerImageUrl(imagePath);
  return (
    <div
      title={name}
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border text-[10px] leading-tight ${
        sealed ? "border-dashed bg-gray-100" : "bg-yellow-50"
      } ${gray ? "opacity-30 grayscale" : ""}`}
      style={{ width, height }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-contain" />
      ) : (
        <span className="p-0.5 text-center">{name}</span>
      )}
      {sealed && <span className="absolute right-0 top-0 bg-gray-700 px-0.5 text-[8px] text-white">未開封</span>}
    </div>
  );
}
