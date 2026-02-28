import styled, { createGlobalStyle, css } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root {
    color: #14213d;
    background:
      radial-gradient(circle at top left, rgba(255, 214, 153, 0.55), transparent 28%),
      radial-gradient(circle at top right, rgba(153, 217, 234, 0.45), transparent 32%),
      linear-gradient(180deg, #fffaf2 0%, #f4f8fb 100%);
    font-family: "Hiragino Sans", "Noto Sans JP", sans-serif;
    font-weight: 400;
    line-height: 1.5;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    min-width: 320px;
  }

  button,
  input,
  select {
    font: inherit;
  }

  button {
    cursor: pointer;
  }
`;

const glassPanel = css`
  border: 1px solid rgba(20, 33, 61, 0.08);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.84);
  backdrop-filter: blur(18px);
  box-shadow: 0 18px 60px rgba(20, 33, 61, 0.08);
`;

export const AppShell = styled.main`
  min-height: 100vh;
  padding: 32px;

  @media (max-width: 960px) {
    padding: 18px;
  }
`;

export const Hero = styled.section`
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 24px;
  align-items: end;
  margin-bottom: 24px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const HeroText = styled.div``;

export const Eyebrow = styled.p`
  margin: 0 0 8px;
  color: #ca6702;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
`;

export const Title = styled.h1`
  margin: 0 0 12px;
  font-size: clamp(2.4rem, 5vw, 4.6rem);
  line-height: 0.95;
`;

export const HeroCopy = styled.p`
  max-width: 48rem;
  margin-top: 0;
  color: #36516f;
`;

export const SyncBadge = styled.p`
  display: inline-flex;
  margin: 0;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 0.92rem;
  background: rgba(206, 242, 221, 0.9);
  color: #166534;
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const SummaryCard = styled.article<{ $tone: 'warm' | 'cool' | 'neutral' }>`
  ${glassPanel};
  padding: 20px;
  background: ${({ $tone }) =>
    $tone === 'warm'
      ? 'linear-gradient(180deg, rgba(255, 242, 224, 0.95), rgba(255, 255, 255, 0.9))'
      : $tone === 'cool'
        ? 'linear-gradient(180deg, rgba(227, 246, 252, 0.95), rgba(255, 255, 255, 0.9))'
        : 'linear-gradient(180deg, rgba(243, 244, 246, 0.95), rgba(255, 255, 255, 0.9))'};

  span,
  small {
    display: block;
  }

  strong {
    display: block;
    margin: 8px 0;
    font-size: 2rem;
  }
`;

export const LayoutPanel = styled.section`
  ${glassPanel};
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 24px;
  padding: 24px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const ContentStack = styled.div`
  display: grid;
  gap: 24px;
`;

export const Panel = styled.div`
  ${glassPanel};
  padding: 24px;
`;

export const PanelHeading = styled.div`
  h2 {
    margin: 0;
  }

  p {
    margin: 0;
    color: #5b718b;
  }
`;

export const FormGrid = styled.form`
  display: grid;
  gap: 16px;
`;

export const FieldLabel = styled.label`
  display: grid;
  gap: 8px;
  color: #2b3f57;
  font-size: 0.95rem;
`;

export const FieldInput = styled.input`
  width: 100%;
  border: 1px solid rgba(20, 33, 61, 0.14);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.95);
`;

export const FieldTextarea = styled.textarea`
  width: 100%;
  min-height: 96px;
  resize: vertical;
  border: 1px solid rgba(20, 33, 61, 0.14);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.95);
`;

export const FieldSelect = styled.select`
  width: 100%;
  border: 1px solid rgba(20, 33, 61, 0.14);
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.95);
`;

export const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const ThreeColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const PrimaryButton = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 14px 18px;
  background: #14213d;
  color: #fff;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
`;

export const SecondaryButton = styled.button`
  border: 1px solid rgba(20, 33, 61, 0.14);
  border-radius: 999px;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.95);
  color: #14213d;
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

export const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 14px;
  align-items: end;
  margin-bottom: 16px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const ToolbarActions = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 140px;
  gap: 12px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const ItemList = styled.div`
  display: grid;
  gap: 14px;
`;

export const ItemCard = styled.article<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  padding: 18px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(202, 103, 2, 0.35)' : 'rgba(20, 33, 61, 0.08)')};
  border-radius: 18px;
  background: ${({ $active }) => ($active ? 'rgba(255, 247, 237, 0.96)' : 'rgba(252, 252, 252, 0.92)')};

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const ItemTitleRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
`;

export const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const Tag = styled.span<{ $tone?: 'default' | 'alert' | 'caution' }>`
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  background: ${({ $tone }) =>
    $tone === 'alert' ? '#ffe3d8' : $tone === 'caution' ? '#fff0b8' : '#edf2f7'};
  color: ${({ $tone }) =>
    $tone === 'alert' ? '#b44b25' : $tone === 'caution' ? '#8d6b00' : '#36516f'};
`;

export const QuantityText = styled.p`
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 700;

  span {
    color: #5b718b;
  }
`;

export const MutedText = styled.p`
  margin-top: 0;
  color: #5b718b;
`;

export const NoteText = styled.p`
  margin-top: 0;
  color: #5b718b;
`;

export const ItemActions = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 960px) {
    justify-content: flex-start;
  }
`;

export const ActionButton = styled.button<{ $danger?: boolean }>`
  border: 1px solid rgba(20, 33, 61, 0.12);
  border-radius: 12px;
  min-width: 52px;
  padding: 12px 14px;
  background: #fff;
  color: ${({ $danger }) => ($danger ? '#b42318' : '#14213d')};
`;

export const ShoppingList = styled.div`
  display: grid;
  gap: 16px;
`;

export const ShoppingItemRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px dashed rgba(20, 33, 61, 0.12);

  &:last-child {
    border-bottom: 0;
    padding-bottom: 0;
  }
`;
