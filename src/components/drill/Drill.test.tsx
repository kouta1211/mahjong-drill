import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { formatPayment } from '@/features/drill/payment';
import {
  createLv1Rounds,
  createLv2Rounds,
  createLv3Rounds,
  createLv4Rounds,
} from '@/features/drill/levels';
import { formatYaku } from '@/features/drill/yakuAnswer';
import { YAKU } from '@/features/yaku/yakuList';
import { seededRng } from '@/lib/testRng';
import { DEFAULT_SETTINGS, type DrillSettings } from '@/features/drill/types';
import { Drill } from './Drill';

/** 同じ seed で、画面が出す問題と選択肢を先に知っておく */
function expectedRounds(settings: DrillSettings, seed: number) {
  return createLv1Rounds(settings, seededRng(seed));
}

describe('Drill（4択）', () => {
  it('設定 → 回答 → 正誤 → 結果 まで1周できる', async () => {
    const user = userEvent.setup();
    const settings: DrillSettings = { ...DEFAULT_SETTINGS, count: 5 };
    const rounds = expectedRounds(settings, 1);
    render(<Drill rng={seededRng(1)} />);

    await user.click(screen.getByRole('radio', { name: '5問' }));
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    for (const [i, { question, choices }] of rounds.entries()) {
      expect(screen.getByText(`第${i + 1}問 / 5問`)).toBeInTheDocument();
      const answer = formatPayment(question.answer);
      // 1問目だけ間違え、残りは正解する
      const pick =
        i === 0 ? choices.map(formatPayment).find((c) => c !== answer) : answer;
      await user.click(screen.getByRole('button', { name: pick }));
      expect(screen.getByRole('status')).toHaveTextContent(
        i === 0 ? '不正解' : '正解！'
      );
      await user.click(
        screen.getByRole('button', { name: i === 4 ? '結果を見る' : '次へ' })
      );
    }

    expect(screen.getByText('正答率 80%')).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: '間違えた問題' })
    ).toHaveTextContent(
      formatPayment(rounds[0]?.question.answer ?? { kind: 'ron', total: 0 })
    );

    await user.click(screen.getByRole('button', { name: 'もう一度' }));
    expect(screen.getByRole('radio', { name: '5問' })).toBeChecked();
  });

  it('解説なしにすると解説を出さない', async () => {
    const user = userEvent.setup();
    render(<Drill rng={seededRng(2)} />);
    await user.click(screen.getByRole('radio', { name: 'なし' }));
    await user.click(screen.getByRole('button', { name: 'はじめる' }));
    const [first] = screen
      .getAllByRole('button')
      .filter((b) => b.textContent !== '');
    if (!first) throw new Error('選択肢がありません');
    await user.click(first);
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('Drill（キーボード操作）', () => {
  it('数字キーで選び、Enter で次の問題へ進む', async () => {
    const user = userEvent.setup();
    const [round] = expectedRounds(DEFAULT_SETTINGS, 4);
    if (!round) throw new Error('問題が作れませんでした');
    render(<Drill rng={seededRng(4)} />);
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    const answer = formatPayment(round.question.answer);
    const index = round.choices.map(formatPayment).indexOf(answer);
    await user.keyboard(String(index + 1));
    expect(screen.getByRole('status')).toHaveTextContent('正解！');

    await user.keyboard('{Enter}');
    expect(screen.getByText('第2問 / 10問')).toBeInTheDocument();
  });

  it('修飾キー付きや範囲外の数字では選ばない', async () => {
    const user = userEvent.setup();
    render(<Drill rng={seededRng(5)} />);
    await user.click(screen.getByRole('button', { name: 'はじめる' }));
    await user.keyboard('{Control>}1{/Control}5');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Drill（数値入力）', () => {
  it('不正な入力はエラーを出して送らず、正しい入力で判定する', async () => {
    const user = userEvent.setup();
    const settings: DrillSettings = {
      ...DEFAULT_SETTINGS,
      win: 'ron',
      answerMode: 'number',
    };
    const [round] = expectedRounds(settings, 3);
    if (!round || round.question.answer.kind !== 'ron') {
      throw new Error('ロンの問題が作れませんでした');
    }
    render(<Drill rng={seededRng(3)} />);

    await user.click(screen.getByRole('radio', { name: 'ロン' }));
    await user.click(screen.getByRole('radio', { name: '数値入力' }));
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    const input = screen.getByLabelText('ロンの点数');
    await user.type(input, '3950');
    await user.click(screen.getByRole('button', { name: '答える' }));
    expect(screen.getByText('100点単位で入力してください')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await user.clear(input);
    await user.type(input, String(round.question.answer.total));
    await user.click(screen.getByRole('button', { name: '答える' }));
    expect(screen.getByRole('status')).toHaveTextContent('正解！');
  });
});

describe('Drill（Lv2 符計算）', () => {
  it('手牌を表示し、符を答えて解説（内訳）を見られる', async () => {
    const user = userEvent.setup();
    const settings: DrillSettings = { ...DEFAULT_SETTINGS, level: 2, count: 5 };
    const [round] = createLv2Rounds(settings, seededRng(6));
    if (!round) throw new Error('問題が作れませんでした');
    render(<Drill rng={seededRng(6)} />);

    await user.click(screen.getByRole('radio', { name: 'Lv2 符計算' }));
    await user.click(screen.getByRole('radio', { name: '5問' }));
    expect(
      screen.queryByRole('radio', { name: '満貫未満' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    expect(screen.getByRole('group', { name: '手牌' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: `${round.answer}符` }));
    expect(screen.getByRole('status')).toHaveTextContent('正解！');
    expect(screen.getByRole('table')).toHaveTextContent(`${round.answer}符`);
  });

  it('数値入力では 10符単位でない値を送れない', async () => {
    const user = userEvent.setup();
    render(<Drill rng={seededRng(7)} />);
    await user.click(screen.getByRole('radio', { name: 'Lv2 符計算' }));
    await user.click(screen.getByRole('radio', { name: '数値入力' }));
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    await user.type(screen.getByLabelText('符'), '32');
    await user.click(screen.getByRole('button', { name: '答える' }));
    expect(
      screen.getByText('10符単位で入力してください（七対子は25符）')
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('Drill（Lv3 役・翻）', () => {
  const settings: DrillSettings = { ...DEFAULT_SETTINGS, level: 3, count: 5 };

  it('4択で役の組み合わせを選び、役の内訳を見られる', async () => {
    const user = userEvent.setup();
    const [round] = createLv3Rounds(settings, seededRng(8));
    if (!round) throw new Error('問題が作れませんでした');
    render(<Drill rng={seededRng(8)} />);

    await user.click(screen.getByRole('radio', { name: 'Lv3 役・翻' }));
    await user.click(screen.getByRole('radio', { name: '5問' }));
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    await user.click(
      screen.getByRole('button', { name: formatYaku(round.answer) })
    );
    expect(screen.getByRole('status')).toHaveTextContent('正解！');
    expect(screen.getByRole('table')).toHaveTextContent(
      `${round.answer.han}翻`
    );
  });

  it('役を選ぶ: 何も選ばずには答えられず、正解の役を選べば正解', async () => {
    const user = userEvent.setup();
    const [round] = createLv3Rounds(
      { ...settings, answerMode: 'number' },
      seededRng(9)
    );
    if (!round) throw new Error('問題が作れませんでした');
    render(<Drill rng={seededRng(9)} />);

    await user.click(screen.getByRole('radio', { name: 'Lv3 役・翻' }));
    await user.click(screen.getByRole('radio', { name: '5問' }));
    await user.click(screen.getByRole('radio', { name: '役を選ぶ' }));
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    await user.click(screen.getByRole('button', { name: '答える' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      '役を1つ以上選んでください'
    );

    for (const id of round.answer.ids) {
      await user.click(screen.getByRole('checkbox', { name: YAKU[id].name }));
    }
    await user.click(screen.getByRole('button', { name: /^答える/ }));
    expect(screen.getByRole('status')).toHaveTextContent('正解！');
  });
});

describe('Drill（Lv4 総合）', () => {
  it('手牌とドラ表示牌を見て点数を答え、役・ドラ・点数の解説を見られる', async () => {
    const user = userEvent.setup();
    const settings: DrillSettings = { ...DEFAULT_SETTINGS, level: 4, count: 5 };
    const [round] = createLv4Rounds(settings, seededRng(10));
    if (!round) throw new Error('問題が作れませんでした');
    render(<Drill rng={seededRng(10)} />);

    await user.click(screen.getByRole('radio', { name: 'Lv4 総合' }));
    await user.click(screen.getByRole('radio', { name: '5問' }));
    expect(screen.getByRole('radio', { name: '親' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: '満貫未満' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'はじめる' }));

    expect(
      screen.getByRole('group', { name: 'ドラ表示牌' })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: formatPayment(round.answer) })
    );
    expect(screen.getByRole('status')).toHaveTextContent('正解！');
    expect(screen.getByRole('table', { name: '役の内訳' })).toHaveTextContent(
      `${round.question.han}翻`
    );
  });
});
