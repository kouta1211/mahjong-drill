import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { formatPayment } from '@/features/drill/payment';
import { createStartAction } from '@/features/drill/startDrill';
import { seededRng } from '@/features/drill/testRng';
import { DEFAULT_SETTINGS, type DrillSettings } from '@/features/drill/types';
import { Drill } from './Drill';

/** 同じ seed で、画面が出す問題と選択肢を先に知っておく */
function expectedRounds(settings: DrillSettings, seed: number) {
  const { questions, choices } = createStartAction(settings, seededRng(seed));
  return questions.map((question, i) => ({
    question,
    choices: choices[i] ?? [],
  }));
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
