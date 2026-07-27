/** Etiketli metin girişi; hint ve hata durumu. */
export interface InputProps {
  label?: string;
  hint?: string;
  /** Hata metni; varsa kenarlık kırmızıya döner */
  error?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: Event) => void;
}
export declare function Input(props: InputProps): JSX.Element;
