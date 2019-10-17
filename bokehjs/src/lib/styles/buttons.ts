import "./root"
import "buttons.css"

export const bk_btn = "bk-btn"
export const bk_btn_group = "bk-btn-group"

export const bk_btn_default = "bk-btn-default"
export const bk_btn_primary = "bk-btn-primary"
export const bk_btn_success = "bk-btn-success"
export const bk_btn_warning = "bk-btn-warning"
export const bk_btn_danger = "bk-btn-danger"

import {ButtonType} from "core/enums"
export function bk_btn_type(button_type: ButtonType): string {
  switch (button_type) {
    case "default": return bk_btn_default
    case "primary": return bk_btn_primary
    case "success": return bk_btn_success
    case "warning": return bk_btn_warning
    case "danger":  return bk_btn_danger
  }
}

export const bk_dropdown_toggle = "bk-dropdown-toggle"
