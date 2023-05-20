import type {Anchor, TextAnchor, BorderRadius, Padding} from "./kinds"
import type {TextAlign, TextBaseline} from "core/enums"
import {isString, isNumber, isPlainObject} from "core/util/types"
import type {XY, LRTB, Corners} from "core/util/bbox"
import {unreachable} from "core/util/assert"

export function anchor(anchor: Anchor): XY<number> {
  if (isString(anchor)) {
    switch (anchor) {
      case "top_left":      return {x: 0.0, y: 0.0}
      case "top":
      case "top_center":    return {x: 0.5, y: 0.0}
      case "top_right":     return {x: 1.0, y: 0.0}
      case "right":
      case "center_right":  return {x: 1.0, y: 0.5}
      case "bottom_right":  return {x: 1.0, y: 1.0}
      case "bottom":
      case "bottom_center": return {x: 0.5, y: 1.0}
      case "bottom_left":   return {x: 0.0, y: 1.0}
      case "left":
      case "center_left":   return {x: 0.0, y: 0.5}
      case "center":
      case "center_center": return {x: 0.5, y: 0.5}
    }
  } else {
    const x_anchor = (() => {
      const [x_anchor] = anchor
      switch (x_anchor) {
        case "start":
        case "left":   return 0.0
        case "center": return 0.5
        case "end":
        case "right":  return 1.0
        default:
          return x_anchor
      }
    })()
    const y_anchor = (() => {
      const [, y_anchor] = anchor
      switch (y_anchor) {
        case "start":
        case "top":    return 0.0
        case "center": return 0.5
        case "end":
        case "bottom": return 1.0
        default:
          return y_anchor
      }
    })()
    return {x: x_anchor, y: y_anchor}
  }
}

export function text_anchor(text_anchor: TextAnchor, align: TextAlign, baseline: TextBaseline): XY<number> {
  if (text_anchor != "auto") {
    return anchor(text_anchor)
  } else {
    const x_anchor = (() => {
      switch (align) {
        case "left":   return "start"
        case "center": return "center"
        case "right":  return "end"
      }
    })()
    const y_anchor = (() => {
      switch (baseline) {
        case "alphabetic":
        case "ideographic":
        case "hanging":
          return "center"
        case "top":    return "start"
        case "middle": return "center"
        case "bottom": return "end"
      }
    })()
    return anchor([x_anchor, y_anchor])
  }
}

export function padding(padding: Padding): LRTB<number> {
  if (isNumber(padding)) {
    return {left: padding, right: padding, top: padding, bottom: padding}
  } else if (isPlainObject(padding)) {
    if ("x" in padding || "y" in padding) {
      const {x=0, y=0} = padding
      return {left: x, right: x, top: y, bottom: y}
    } else if ("left" in padding || "right" in padding || "top" in padding || "bottom" in padding) {
      const {left=0, right=0, top=0, bottom=0} = padding
      return {left, right, top, bottom}
    } else {
      unreachable() // TODO: TypeScript 4.9
    }
  } else {
    if (padding.length == 2) {
      const [x=0, y=0] = padding
      return {left: x, right: x, top: y, bottom: y}
    } else {
      const [left=0, right=0, top=0, bottom=0] = padding
      return {left, right, top, bottom}
    }
  }
}

export function border_radius(border_radius: BorderRadius): Corners<number> {
  if (isNumber(border_radius)) {
    return {
      top_left: border_radius,
      top_right: border_radius,
      bottom_right: border_radius,
      bottom_left: border_radius,
    }
  } else if (isPlainObject(border_radius)) {
    return {
      top_left: border_radius.top_left ?? 0,
      top_right: border_radius.top_right ?? 0,
      bottom_right: border_radius.bottom_right ?? 0,
      bottom_left: border_radius.bottom_left ?? 0,
    }
  } else {
    const [top_left=0, top_right=0, bottom_right=0, bottom_left=0] = border_radius
    return {top_left, top_right, bottom_right, bottom_left}
  }
}
