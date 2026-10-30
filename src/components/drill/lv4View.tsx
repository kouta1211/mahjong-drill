import { explain } from '@/features/drill/explain';
import type { Lv4Question } from '@/features/drill/levels';
import { formatPayment, isSamePayment } from '@/features/drill/payment';
import { createSessionReducer } from '@/features/drill/session';
import type { Payment } from '@/features/score/calcScore';
import { DoraView } from '@/components/tiles/DoraView';
import { FuBreakdown, YakuBreakdown } from './Breakdown';
import type { LevelView } from './DrillSession';
import { describeHand, HandQuestionCard } from './HandQuestionCard';
import { PaymentAnswer } from './PaymentAnswer';

function ScoreExplanation({ question }: { question: Lv4Question }) {
  const { analysis, dora, han, scoreQuestion } = question;
  const doraRows = [
    { label: 'ドラ', count: dora.dora },
    { label: '裏ドラ', count: dora.ura },
    { label: '赤ドラ', count: dora.red },
  ]
    .filter((row) => row.count > 0)
    .map((row) => ({ label: row.label, value: `${row.count}翻` }));

  return (
    <div className="flex flex-col gap-4">
      <YakuBreakdown yaku={analysis.yaku} extraRows={doraRows} totalHan={han} />
      {/* 5翻以上は符に関係なく決まる */}
      {han < 5 && <FuBreakdown fu={analysis.fu} />}
      <ol className="list-decimal pl-5">
        {explain(scoreQuestion).map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}

/** Lv4（総合）: 手牌・ドラ表示牌から支払う点数を答える */
export const lv4View: LevelView<Lv4Question, Payment> = {
  reducer: createSessionReducer<Lv4Question, Payment>(isSamePayment),
  format: formatPayment,
  isSame: isSamePayment,
  choiceLayout: 'grid',
  renderQuestion: (question, number, total) => (
    <HandQuestionCard
      hand={question.hand}
      prompt="何点？"
      number={number}
      total={total}
      isDealer={question.isDealer}
    >
      <DoraView
        indicators={question.indicators}
        uraIndicators={question.uraIndicators}
      />
    </HandQuestionCard>
  ),
  renderFreeAnswer: (round, props) => (
    <PaymentAnswer kind={round.answer.kind} {...props} />
  ),
  renderExplanation: (round) => <ScoreExplanation question={round.question} />,
  describe: (q) => `${q.isDealer ? '親' : '子'}・${describeHand(q.hand)}`,
};
