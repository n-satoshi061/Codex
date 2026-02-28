import { Hero, HeroCopy, HeroText, Eyebrow, SummaryCard, SummaryGrid, SyncBadge, Title } from '../styles/appStyles';

type Summary = {
  lowStock: number;
  expiringSoon: number;
  totalQuantity: number;
};

type HeroSectionProps = {
  statusMessage: string;
  summary: Summary;
};

export const HeroSection = ({ statusMessage, summary }: HeroSectionProps) => (
  <Hero>
    <HeroText>
      <Eyebrow>Home Inventory</Eyebrow>
      <Title>うちの在庫ノート</Title>
      <HeroCopy>
        家庭の食品と日用品をひとつの画面で見やすく管理。カテゴリや保管場所もまとめて選べます。
      </HeroCopy>
      <SyncBadge>{statusMessage}</SyncBadge>
    </HeroText>
    <SummaryGrid>
      <SummaryCard $tone="warm">
        <span>不足気味</span>
        <strong>{summary.lowStock}</strong>
        <small>買い足し候補</small>
      </SummaryCard>
      <SummaryCard $tone="cool">
        <span>7日以内</span>
        <strong>{summary.expiringSoon}</strong>
        <small>期限が近い在庫</small>
      </SummaryCard>
      <SummaryCard $tone="neutral">
        <span>総数量</span>
        <strong>{summary.totalQuantity}</strong>
        <small>家にある全在庫</small>
      </SummaryCard>
    </SummaryGrid>
  </Hero>
);
