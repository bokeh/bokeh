import * as DOM from "core/dom";

export interface DropdownProps {
  button_type: "default" | "primary" | "success" | "warning" | "danger" | "link";
  label: string;
}

export default (props: DropdownProps): HTMLElement => {
  const classes = ["bk-bs-btn", `bk-bs-btn-${props.button_type}`, "bk-bs-dropdown-toggle", "bk-bs-dropdown-btn"]
  return (
    <fragment>
      <button type="button" class={classes} data-bk-bs-toggle="dropdown">
        {props.label} <span class="bk-bs-caret"></span>
      </button>
      <ul class="bk-bs-dropdown-menu"></ul>
    </fragment>
  )
}
