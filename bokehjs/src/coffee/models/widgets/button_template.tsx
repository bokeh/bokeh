import * as DOM from "../../core/util/dom";

interface ButtonProps {
  button_type: "default" | "primary" | "success" | "warning" | "danger" | "link";
  label: string;
}

export default (props: ButtonProps): HTMLElement => {
  return (
    <button type="button" class={`bk-bs-btn bk-bs-btn-${props.button_type}`}>
      {props.label}
    </button>
  )
}
