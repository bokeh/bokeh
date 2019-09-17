import "mixins.css"

export const bk_active = "bk-active"

export const bk_inline = "bk-inline"

export const bk_left = "bk-left"
export const bk_right = "bk-right"
export const bk_above = "bk-above"
export const bk_below = "bk-below"

export const bk_up = "bk-up"
export const bk_down = "bk-down"

import {Side} from "core/enums"
export function bk_side(side: Side): string {
  switch (side) {
    case "above": return bk_above
    case "below": return bk_below
    case "left":  return bk_left
    case "right": return bk_right
  }
}
