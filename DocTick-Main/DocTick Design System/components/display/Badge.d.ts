/** Durum rozeti; randevu durumları için semantik renkler. */
export interface BadgeProps {
  status?: 'confirmed' | 'pending' | 'cancelled' | 'done' | 'brand' | 'neutral';
  /** Soldaki nokta (varsayılan true) */
  dot?: boolean;
  children: React.ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
