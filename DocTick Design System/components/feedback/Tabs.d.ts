/** Alt-çizgili sekme çubuğu. */
export interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange?: (id: string) => void;
}
export declare function Tabs(props: TabsProps): JSX.Element;
