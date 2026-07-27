/** Modal onay penceresi; iptal onayı gibi kritik adımlar. */
export interface DialogProps {
  open: boolean;
  title: React.ReactNode;
  onClose?: () => void;
  /** Sağ-alta hizalanan eylem butonları */
  footer?: React.ReactNode;
  children: React.ReactNode;
}
export declare function Dialog(props: DialogProps): JSX.Element | null;
