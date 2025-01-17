import type {Anchor, AutoAnchor, TextAnchor, HAnchor, VAnchor, BorderRadius, Padding, IconLike} from "./kinds"
import type {TextAlign, TextBaseline, HAlign, VAlign} from "core/enums"
import {ToolIcon} from "core/enums"
import {isString, isNumber, isPlainObject} from "core/util/types"
import type {XY, LRTB, Corners} from "core/util/bbox"
import {unreachable} from "core/util/assert"

export function normalized_anchor(anchor: AutoAnchor): {x: HAnchor | "auto", y: VAnchor | "auto"} {
  if (anchor == "auto") {
    return {x: "auto", y: "auto"}
  }
  const normalized = (() => {
    switch (anchor) {
      case "top":    return "top_center"
      case "bottom": return "bottom_center"
      case "left":   return "center_left"
      case "center": return "center_center"
      case "right":  return "center_right"
      default:       return anchor
    }
  })()
  if (isString(normalized)) {
    const [y, x] = normalized.split("_") as [VAlign, HAlign]
    return {x, y}
  } else {
    const [x, y] = normalized
    return {x, y}
  }
}

export function anchor(anchor: Anchor): XY<number>
export function anchor(anchor: AutoAnchor): XY<number | "auto">

export function anchor(anchor: AutoAnchor): XY<number | "auto"> {
  const {x, y} = normalized_anchor(anchor)
  const x_anchor = (() => {
    switch (x) {
      case "start":
      case "left":   return 0.0
      case "center": return 0.5
      case "end":
      case "right":  return 1.0
      default:       return x
    }
  })()
  const y_anchor = (() => {
    switch (y) {
      case "start":
      case "top":    return 0.0
      case "center": return 0.5
      case "end":
      case "bottom": return 1.0
      default:       return y
    }
  })()
  return {x: x_anchor, y: y_anchor}
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

export function apply_icon(el: HTMLElement, icon: IconLike): void {
  if (icon.startsWith("data:image")) {
    const url = `url("${encodeURI(icon)}")`
    el.style.backgroundImage = url
  } else if (icon.startsWith("--")) {
    el.style.backgroundImage = `var(${icon})`
  } else if (icon.startsWith(".")) {
    const cls = icon.substring(1)
    el.classList.add(cls)
  } else if (ToolIcon.valid(icon)) {
    const cls = `bk-tool-icon-${icon.replace(/_/g, "-")}`
    el.classList.add(cls)
  }
}
