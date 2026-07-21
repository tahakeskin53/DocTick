/** 5 yıldızlı değerlendirme; randevu sonrası hizmet puanlama. */
export interface RatingProps {
  /** 0–5 */
  value?: number;
  onChange?: (n: number) => void;
  readOnly?: boolean;
  /** Yıldız boyutu px (varsayılan 22) */
  size?: number;
}
export declare function Rating(props: RatingProps): JSX.Element;
