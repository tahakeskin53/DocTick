/** Yalnız-ikon buton; `label` (aria-label) zorunlu. İkon child olarak verilir (Lucide SVG, 16–20px). */
export interface IconButtonProps {
  variant?: 'ghost' | 'outline';
  size?: 'sm' | 'md';
  /** Erişilebilirlik etiketi (zorunlu) */
  label: string;
  children: React.ReactNode;
  onClick?: (e: MouseEvent) => void;
}
export declare function IconButton(props: IconButtonProps): JSX.Element;
