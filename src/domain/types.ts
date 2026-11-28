// 画面で扱うデータの型（DB のテーブル・RPC の戻り値に対応）

export type StickerType = {
  id: number;
  dex_id: string;
  name: string;
  image_path: string | null;
  width: number;
  height: number;
  charm: number;
  price_override: number | null;
  kind: "basic" | "special";
  rarity: string;
};

export type BookType = {
  id: number;
  name: string;
  page_count: number;
  page_w: number;
  page_h: number;
  theme: string;
  charm: number;
  price_override: number | null;
};

export type Sticker = {
  id: string;
  type_id: number;
  owner_id: string;
  serial_no: number;
  state: "sealed" | "opened";
  gifted: boolean;
  acquired_at: string;
  type: StickerType;
};

export type Book = {
  id: string;
  type_id: number;
  owner_id: string;
  serial_no: number;
  type: BookType;
};

export type Placement = {
  sticker_id: string;
  book_id: string;
  page: number;
  x: number;
  y: number;
};

export type PublicProfile = {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  charm_total: number;
  support_total: number;
};

export type Wallet = {
  points: number;
  balls: number;
  login_streak: number;
  last_login_date: string | null;
  login_bonus_available: boolean;
  is_admin: boolean;
};

export type DexEntry = {
  type_id: number;
  name: string;
  image_path: string | null;
  width: number;
  height: number;
  charm: number;
  price: number;
  kind: string;
  rarity: string;
  dex_purchasable: boolean;
  owned: boolean;
  /** theme / base / legend / starter / other */
  category: string;
  /** テーマ名・画風名 */
  series: string;
};

export type RankingRow = {
  rnk: number;
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  value: number;
};

export type Listing = {
  id: number;
  venue: "shop" | "prize";
  price: number;
  stock: number | null;
  sold_count: number;
  per_user_limit: number | null;
  starts_at: string | null;
  ends_at: string | null;
  sticker_type: StickerType | null;
  book_type: BookType | null;
};

/** キャンバスに置かれたシール（シール帳・背景で共通） */
export type CanvasItem = {
  sticker_id: string;
  name: string;
  image_path: string | null;
  w: number;
  h: number;
  x: number;
  y: number;
};
