/** Aç/kapa anahtarı; anlık etki eden ayarlar için (admin: bölüm açık/kapalı). */
export interface SwitchProps {
  label?: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: Event) => void;
}
export declare function Switch(props: SwitchProps): JSX.Element;
