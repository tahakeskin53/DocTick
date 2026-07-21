/** Radyo düğmesi; aynı `name` ile gruplanır. */
export interface RadioProps {
  label?: React.ReactNode;
  name?: string;
  value?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: Event) => void;
}
export declare function Radio(props: RadioProps): JSX.Element;
