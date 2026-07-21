/** Kısa geri bildirim bildirimi; koyu zemin, renkli kenar çubuğu. */
export interface ToastProps {
  kind?: 'success' | 'error' | 'info';
  onClose?: () => void;
  children: React.ReactNode;
}
export declare function Toast(props: ToastProps): JSX.Element;
