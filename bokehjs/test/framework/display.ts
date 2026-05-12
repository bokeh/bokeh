import type {UIElement} from "@bokehjs/models/ui/ui_element"
import type {DOMNode} from "@bokehjs/models/dom"
import {LayoutDOM} from "@bokehjs/models/layouts/layout_dom"
import {show} from "@bokehjs/api/plotting"
import {Document} from "@bokehjs/document"
import type {HasProps} from "@bokehjs/core/has_props"
import {div} from "@bokehjs/core/dom"
import type {ViewOf} from "@bokehjs/core/view"
import {assert} from "@bokehjs/core/util/assert"
import {sum} from "@bokehjs/core/util/array"
import type {Size} from "@bokehjs/core/layout"
import {Row, Column, GridBox} from "@bokehjs/models/layouts"
import {Toolbar} from "@bokehjs/models/tools/toolbar"
import {GridPlot} from "@bokehjs/models/plots"
import {Button, Div} from "@bokehjs/models/widgets"

import {current_test, container} from "./framework"

type DisplayMultiple = {views: ViewOf<HasProps>[], doc: Document, el: HTMLElement}
type DisplaySingle<T extends UIElement | DOMNode> = {view: ViewOf<T>, doc: Document, el: HTMLElement}

export async function display(obj: Document, viewport?: [number, number] | "auto" | null, el?: HTMLElement | null): Promise<DisplayMultiple>
export async function display<T extends UIElement | DOMNode>(obj: T, viewport?: [number, number] | "auto" | null, el?: HTMLElement | null): Promise<DisplaySingle<T>>

export async function display(obj: Document | UIElement | DOMNode, viewport: [number, number] | "auto" | null = "auto",
    el?: HTMLElement | null): Promise<DisplaySingle<UIElement | DOMNode> | DisplayMultiple> {
  const test = current_test
  assert(test != null, "display() must be called in it(...) or before*() blocks")

  const margin = 50
  const size: [number, number] | null = (() => {
    if (viewport == null) {
      return null
    } else if (viewport == "auto") {
      const model = obj instanceof Document ? obj.roots()[0] : obj
      if (model instanceof LayoutDOM) {
        const {width, height} = _infer_viewport(model)
        if (isFinite(width) && isFinite(height)) {
          return [width + margin, height + margin]
        }
      }
    } else {
      return viewport
    }

    throw new Error("unable to infer viewport size")
  })()

  const viewport_el = (() => {
    if (size == null) {
      return div({class: "viewport", style: {width: "max-content", height: "max-content", overflow: "visible"}}, el)
    } else {
      const [width, height] = size
      return div({class: "viewport", style: {width: `${width}px`, height: `${height}px`, overflow: "hidden"}}, el)
    }
  })()

  const doc = (() => {
    if (obj instanceof Document) {
      return obj
    } else {
      const doc = new Document()
      doc.add_root(obj)
      return doc
    }
  })()

  if (el !== null) {
    container.appendChild(viewport_el)
  }

  const views = await show(doc, el ?? viewport_el)
  test.views = views
  test.el = viewport_el
  test.viewport = size ?? undefined
  if (obj instanceof Document) {
    return {views: test.views, doc, el: viewport_el}
  } else {
    return {view: test.views[0] as ViewOf<UIElement | DOMNode>, doc, el: viewport_el}
  }
}

function _infer_viewport(obj: UIElement): Size {
  if (obj instanceof LayoutDOM) {
    return _infer_layoutdom_viewport(obj)
  } else {
    return {width: Infinity, height: Infinity}
  }
}

function _infer_layoutdom_viewport(obj: LayoutDOM): Size {
  const {sizing_mode, width_policy, height_policy} = obj

  let width = 0
  let height = 0
  if (sizing_mode == "fixed" || (width_policy == "fixed" && height_policy == "fixed")) {
    width = obj.width ?? Infinity
    height = obj.height ?? Infinity
  } else if (width_policy == "max" || height_policy == "max") {
    width = Infinity
    height = Infinity
  } else {
    if (obj instanceof Row) {
      for (const child of obj.children) {
        const size = _infer_viewport(child)
        width += size.width
        height = Math.max(height, size.height)
      }

      width += obj.spacing*(obj.children.length - 1)
    } else if (obj instanceof Column) {
      for (const child of obj.children) {
        const size = _infer_viewport(child)
        width = Math.max(width, size.width)
        height += size.height
      }

      height += obj.spacing*(obj.children.length - 1)
    } else if (obj instanceof GridBox || obj instanceof GridPlot) {
      let nrow = 0
      let ncol = 0
      for (const [, row, col] of obj.children) {
        nrow = Math.max(nrow, row)
        ncol = Math.max(ncol, col)
      }
      nrow += 1
      ncol += 1
      const widths = new Array(ncol).fill(0)
      const heights = new Array(nrow).fill(0)
      for (const [child, row, col] of obj.children) {
        const size = _infer_viewport(child)
        widths[col] = Math.max(widths[col], size.width)
        heights[row] = Math.max(heights[row], size.height)
      }
      width = sum(widths)
      height = sum(heights)

      if (obj instanceof GridPlot) {
        switch (obj.toolbar_location) {
          case "above":
          case "below":
            height += 30
            break
          case "left":
          case "right":
            width += 30
            break
          case null:
            break
        }
      }
    } else if (obj instanceof Toolbar) {
      switch (obj.location) {
        case "above":
        case "below":
          width = 0
          height = 30
          break
        case "left":
        case "right":
          width = 30
          height = 0
          break
      }
    } else if (obj instanceof Button) {
      width = 300
      height = 50
    } else if (obj instanceof Div) {
      width = 300
      height = 100
    } else {
      width = obj.width ?? Infinity
      height = obj.height ?? Infinity
    }
  }

  return {width, height}
}
