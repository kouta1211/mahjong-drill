import {
  tileImagePath,
  tileName,
  type Tile as TileData,
} from '@/features/tiles/tile';

const FRONT = '/tiles/Front.svg';
const BACK = '/tiles/Back.svg';

type Props = {
  tile: TileData;
  /** 鳴いた牌のように横向きに置く */
  sideways?: boolean;
  /** 暗槓の両端のように裏向きに置く */
  faceDown?: boolean;
  highlight?: boolean;
};

/**
 * 牌1枚。幅は親が CSS 変数 --tw で決める（HandView）。
 * 画像は FluffyStuff/riichi-mahjong-tiles（CC0）の面と土台を重ねて描く。
 */
export function Tile({
  tile,
  sideways = false,
  faceDown = false,
  highlight = false,
}: Props) {
  const label = faceDown ? '裏向きの牌' : tileName(tile);
  const face = (
    <span
      role="img"
      aria-label={label}
      className={`block aspect-[3/4] w-(--tw) rounded-[8%] bg-[length:100%_100%] bg-center bg-no-repeat shadow-sm ${
        highlight ? 'ring-2 ring-gold' : ''
      }`}
      style={{
        backgroundImage: faceDown
          ? `url(${BACK})`
          : `url(${tileImagePath(tile)}), url(${FRONT})`,
      }}
    />
  );
  if (!sideways) return face;
  // 横向き: 外枠を「高さ = 牌の幅、幅 = 牌の高さ」にして、中の牌を回す
  return (
    <span className="relative inline-block h-(--tw) w-[calc(var(--tw)*4/3)] self-end">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90">
        {face}
      </span>
    </span>
  );
}
