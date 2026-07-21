/** Onay kutusu; etiket sağda. */
export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: Event) => void;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
