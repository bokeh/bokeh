import {Annotation, AnnotationView} from "./annotation"
import {SpatialUnits, TooltipAttachment} from "core/enums"
import {div, display, undisplay, empty, remove} from "core/dom"
import * as p from "core/properties"
import {Scale} from "models/scales/scale"
import {CoordinateMapper} from "core/util/bbox"

import {bk_tooltip, bk_tooltip_arrow} from "styles/tooltips"
import {bk_left, bk_right, bk_above, bk_below} from "styles/mixins"

import tooltips_css from "styles/tooltips.css"

export class InfoPaneView extends AnnotationView {
  model: InfoPane

  protected el: HTMLElement
  private x: number
  private y: number

  initialize(): void {
    super.initialize()
    this.el = div({class: bk_tooltip})
    undisplay(this.el)
    this.plot_view.canvas_view.add_overlay(this.el)
  }

  remove(): void {
    remove(this.el)
    super.remove()
  }

  connect_signals(): void {
    super.connect_signals()
    this.connect(this.model.properties.content.change, () => this.render())
    this.connect(this.model.properties.x.change, () => this.render())
    this.connect(this.model.properties.y.change, () => this.render())
  }

  styles(): string[] {
    return [...super.styles(), tooltips_css]
  }

  render(): void {
    if (!this.model.visible)
      undisplay(this.el)

    super.render()
  }

  protected _map_data(): [number, number] {

    const {frame} = this.plot_view
    const xscale = this.scope.x_scale
    const yscale = this.scope.y_scale

    const _calc_dim = (dim: number | null, dim_units: SpatialUnits, scale: Scale, view: CoordinateMapper, frame_extrema: number): number => {
      let sdim
      if (dim != null) {
        if (dim_units == 'data')
          sdim = scale.compute(dim)
        else
          sdim = view.compute(dim)
      } else
        sdim = frame_extrema
      return sdim
    }

    this.x = _calc_dim(this.model.x, this.model.position_units, xscale, frame.xview, frame.bbox.left)
    this.y = _calc_dim(this.model.y, this.model.position_units, yscale, frame.yview, frame.bbox.top)

    return([this.x, this.y])
  }

  protected _render(): void {
    empty(this.el)
    undisplay(this.el)

    const {content} = this.model
    if (content.length == 0)
      return

    const {frame} = this.plot_view
    const [x, y] = this._map_data()

    if (this.model.inner_only && !frame.bbox.contains(x, y)){
    } else {
      for (const part of content) {
        const pane = div({}, part)
        this.el.appendChild(pane)
      }
    }

    const {anchor} = this.model
    this.el.classList.remove(bk_right)
    this.el.classList.remove(bk_left)
    this.el.classList.remove(bk_above)
    this.el.classList.remove(bk_below)

    let arrow_size: number = 10 // XXX: keep in sync with less
    if(this.model.show_arrow == false)
      arrow_size = 0

    display(this.el)

    // slightly confusing: side "left" (for example) is relative to point that
    // is being annotated but CS class ".bk-left" is relative to the tooltip itself

    let top: number = 0
    let left = 0
    let right = 0

    switch (anchor) {
      case "left":
        this.el.classList.add(bk_left)
        left = x + arrow_size
        top = y - this.el.offsetHeight/2
        break
      case "right":
        this.el.classList.add(bk_right)
        right = (this.plot_view.layout.bbox.width - x) + arrow_size
        top = y - this.el.offsetHeight/2
        break
      case "above":
        this.el.classList.add(bk_above)
        top = y + arrow_size
        left = Math.round(x - this.el.offsetWidth/2)
        break
      case "below":
        this.el.classList.add(bk_below)
        top = y - this.el.offsetHeight - arrow_size
        left = Math.round(x - this.el.offsetWidth/2)
        break
    }

    if (this.model.show_arrow)
      this.el.classList.add(bk_tooltip_arrow)

    if (this.el.childNodes.length > 0) {
      this.el.style.top = `${top}px`
      this.el.style.left = left ? `${left}px` : 'auto'
      this.el.style.right = right ? `${right}px` : 'auto'
    } else
      undisplay(this.el)
  }
}

export namespace InfoPane {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Annotation.Props & {
    anchor: p.Property<TooltipAttachment>
    inner_only: p.Property<boolean>
    show_arrow: p.Property<boolean>
    x: p.Property<number>
    y: p.Property<number>
    position_units: p.Property<SpatialUnits>
    content: p.Property<[HTMLElement][]>
  }
}

export interface InfoPane extends InfoPane.Attrs {}

export class InfoPane extends Annotation {
  properties: InfoPane.Props
  __view_type__: InfoPaneView

  constructor(attrs?: Partial<InfoPane.Attrs>) {
    super(attrs)
  }

  static init_InfoPane(): void {
    this.prototype.default_view = InfoPaneView

    this.define<InfoPane.Props>({
      //is kept as is if the horizontal\vertical functionality shall come in use
      anchor:         [ p.TooltipAttachment, 'horizontal'],
      inner_only:     [ p.Boolean,           true        ],
      show_arrow:     [ p.Boolean,           true        ],
      x:              [ p.Number,             0          ],
      y:              [ p.Number,             0          ],
      position_units: [ p.SpatialUnits,      'data'      ],
      content:        [ p.Array,             []          ],
    })

    this.override({
      level: 'overlay',
    })
  }

  clear(): void {
    this.content = []
  }
}
