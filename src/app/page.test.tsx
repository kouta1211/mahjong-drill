import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Home from './page';

describe('Home', () => {
  it('アプリ名の見出しを表示する', () => {
    render(<Home />);
    expect(
      screen.getByRole('heading', { level: 1, name: '麻雀点数計算ドリル' })
    ).toBeInTheDocument();
  });
});
