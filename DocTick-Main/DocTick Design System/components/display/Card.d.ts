/** İçerik kartı: beyaz, 14px köşe, hafif teal gölge. */
export interface CardProps {
  title?: React.ReactNode;
  /** Başlık satırının sağındaki eylemler */
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  /** Gövde padding'i (varsayılan true) */
  padded?: boolean;
  children: React.ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;
