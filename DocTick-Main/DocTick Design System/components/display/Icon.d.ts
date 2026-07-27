/** Lucide glyph sarmalayıcısı; currentColor, stroke 2px. (Intentional addition.) */
export interface IconProps {
  name: 'calendar' | 'clock' | 'chevron-right' | 'chevron-left' | 'mail' | 'user' | 'plus' | 'trash' | 'pencil' | 'check' | 'x' | 'bell' | 'star' | 'grid' | 'logout';
  /** px, varsayılan 18 */
  size?: number;
}
export declare function Icon(props: IconProps): JSX.Element;
