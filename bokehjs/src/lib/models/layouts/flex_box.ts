import {LayoutDOM, LayoutDOMView} from "./layout_dom"
import {StyleSheet, StyleSheetLike, px} from "core/dom"
import * as p from "core/properties"
import {assert, unreachable} from "core/util/assert"

type Direction = "row" | "column"

export abstract class FlexBoxView extends LayoutDOMView {
  override model: FlexBox
  protected abstract _direction: Direction

  override connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.children.change, () => this.rebuild())
  }

  get child_models(): LayoutDOM[] {
    return this.model.children
  }

  private readonly _flex = new StyleSheet()

  override styles(): StyleSheetLike[] {
    return [...super.styles(), this._flex]
  }

  override _update_layout(): void {
    super._update_layout()

    this._flex.replace(`
      :host {
        display: flex;
        flex-direction: ${this._direction};
        gap: ${px(this.model.spacing)};
      }
    `)

    const layoutable = []

    for (const view of this.child_views) {
      const sizing = view.box_sizing()
      const flex = (() => {
        const policy = this._direction == "row" ? sizing.width_policy : sizing.height_policy
        switch (policy) {
          case "fixed": return "0 0 auto"
          case "fit": return "1 1 auto"
          case "min": return "0 1 auto"
          case "max": return "1 0 auto"
          default: unreachable()
        }
      })()

      const align = (() => {
        const policy = this._direction == "row" ? sizing.height_policy : sizing.width_policy
        switch (policy) {
          case "fixed":
          case "fit":
          case "min": return (this._direction == "row" ? sizing.valign : sizing.halign) ?? "unset"
          case "max": return "stretch"
          default: unreachable()
        }
      })()

      view.stylesheet_for_parent.replace(`
        :host {
          flex: ${flex};
          align-self: ${align};
        }
      `)

      if (view.layout != null) {
        layoutable.push(view)
      }
    }

    if (layoutable.length != 0) {
      this.layout = new CSSAlignmentLayout(this._direction, layoutable)
    } else {
      delete this.layout
    }
  }
}

import {Layoutable} from "core/layout/layoutable"
import {Sizeable, SizeHint, Size} from "core/layout"
import {Extents} from "core/types"
import {BBox} from "core/util/bbox"

class CSSAlignmentLayout extends Layoutable {
  constructor(readonly direction: Direction, readonly children: LayoutDOMView[]) {
    super()
  }

  protected _measure(_viewport: Sizeable): SizeHint {
    return {width: 0, height: 0}
  }

  override compute(viewport: Partial<Size> = {}): void {
    const {width, height} = viewport
    assert(width != null && height != null)

    const size_hint: SizeHint = {width, height}
    const outer = new BBox({left: 0, top: 0, width, height})

    let inner: BBox | undefined = undefined

    if (size_hint.inner != null) {
      const {left, top, right, bottom} = size_hint.inner
      inner = new BBox({left, top, right: width - right, bottom: height - bottom})
    }

    this.set_geometry(outer, inner)
  }

  override _set_geometry(outer: BBox, inner: BBox): void {
    super._set_geometry(outer, inner)

    const sizing = []
    for (const child of this.children) {
      const {layout} = child
      if (layout != null) {
        const {bbox} = child
        const size_hint = layout.measure(bbox)
        sizing.push({layout, bbox, size_hint})
      }
    }

    const extents: Extents = {left: 0, right: 0, top: 0, bottom: 0}

    for (const {size_hint} of sizing) {
      const {inner} = size_hint
      if (inner != null) {
        extents.left = Math.max(extents.left, inner.left)
        extents.right = Math.max(extents.right, inner.right)
        extents.top = Math.max(extents.top, inner.top)
        extents.bottom = Math.max(extents.bottom, inner.bottom)
      }
    }

    for (const {layout, bbox, size_hint} of sizing) {
      const outer_bbox = bbox
      const inner_bbox = (() => {
        const {inner} = size_hint
        if (inner != null) {
          const {left, right, top, bottom} = (() => {
            if (this.direction == "row")
              return {left: inner.left, right: inner.right, top: extents.top, bottom: extents.bottom}
            else
              return {left: extents.left, right: extents.right, top: inner.top, bottom: inner.bottom}
          })()

          const {width, height} = outer_bbox
          return BBox.from_rect({left, top, right: width - right, bottom: height - bottom})
        } else
          return undefined
      })()

      layout.set_geometry(outer_bbox, inner_bbox)
    }
  }
}

export namespace FlexBox {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    children: p.Property<LayoutDOM[]>
    spacing: p.Property<number>
  }
}

export interface FlexBox extends FlexBox.Attrs {}

export abstract class FlexBox extends LayoutDOM {
  override properties: FlexBox.Props
  override __view_type__: FlexBoxView

  constructor(attrs?: Partial<FlexBox.Attrs>) {
    super(attrs)
  }

  static {
    this.define<FlexBox.Props>(({Number, Array, Ref}) => ({
      children: [ Array(Ref(LayoutDOM)), [] ],
      spacing:  [ Number, 0 ],
    }))
  }
}
