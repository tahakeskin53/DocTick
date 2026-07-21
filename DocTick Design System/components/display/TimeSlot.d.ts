/** Randevu saati çipi; mono font, pill biçim. (Intentional addition — ürünün çekirdek etkileşimi.) */
export interface TimeSlotProps {
  /** "09:30" biçiminde */
  time: string;
  state?: 'available' | 'selected' | 'full';
  onClick?: () => void;
}
export declare function TimeSlot(props: TimeSlotProps): JSX.Element;
