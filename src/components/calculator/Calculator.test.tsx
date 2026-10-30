import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { parseTiles, tileName } from '@/features/tiles/tile';
import { Calculator } from './Calculator';

async function pickTiles(
  user: ReturnType<typeof userEvent.setup>,
  notation: string
) {
  for (const tile of parseTiles(notation)) {
    await user.click(
      screen.getByRole('button', { name: `${tileName(tile)}を入れる` })
    );
  }
}

describe('Calculator（点数計算機）', () => {
  it('牌を入れていくと、足りない枚数を案内し、そろうと点数を出す', async () => {
    const user = userEvent.setup();
    render(<Calculator onBack={() => {}} />);
    const result = () => screen.getByRole('region', { name: '計算結果' });

    await pickTiles(user, '234m567p234s');
    expect(result()).toHaveTextContent('あと 4 枚足りません');
    await pickTiles(user, '56s88m');

    // 和了牌の入れ先を選んでから 7s
    const winSlot = screen.getByRole('group', { name: '和了牌' });
    await user.click(within(winSlot).getAllByRole('button')[0] as HTMLElement);
    await pickTiles(user, '7s');
    // 立直なしでも平和・断么九がある → 子の 30符2翻 ロン 2000
    expect(result()).toHaveTextContent('2000');

    await user.click(screen.getByRole('radio', { name: 'している' }));
    // 立直・平和・断么九 → 子の 30符3翻 ロン 3900
    expect(result()).toHaveTextContent('3900');
    expect(
      within(result()).getByRole('table', { name: '役の内訳' })
    ).toHaveTextContent('平和');
  });

  it('入れた牌を押すと外せる', async () => {
    const user = userEvent.setup();
    render(<Calculator onBack={() => {}} />);
    await pickTiles(user, '1m');
    const hand = screen.getByRole('group', { name: '手牌' });
    await user.click(within(hand).getByRole('button', { name: '一萬を外す' }));
    expect(
      within(hand).queryByRole('button', { name: '一萬を外す' })
    ).not.toBeInTheDocument();
  });

  it('副露を足すと、その副露が入れ先になり、埋まったら手牌に戻る', async () => {
    const user = userEvent.setup();
    render(<Calculator onBack={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'ポン' }));
    await pickTiles(user, '111z');
    const meld = screen.getByRole('group', { name: '副露 1（ポン）' });
    expect(
      within(meld).getAllByRole('button', { name: '東を外す' })
    ).toHaveLength(3);
    await pickTiles(user, '2m');
    const hand = screen.getByRole('group', { name: '手牌' });
    expect(
      within(hand).getByRole('button', { name: '二萬を外す' })
    ).toBeInTheDocument();
  });
});
