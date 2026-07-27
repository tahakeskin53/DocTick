/** Etiketli açılır seçim (bölüm, doktor seçimi). */
export interface SelectProps {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
  value?: string;
  onChange?: (e: Event) => void;
}
export declare function Select(props: SelectProps): JSX.Element;
