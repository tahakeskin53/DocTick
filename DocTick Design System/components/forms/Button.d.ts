/** Birincil eylem butonu. Etiketler cümle düzeninde: "Randevuyu onayla". */
export interface ButtonProps {
  /** Görsel varyant */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: (e: MouseEvent) => void;
}
export declare function Button(props: ButtonProps): JSX.Element;
