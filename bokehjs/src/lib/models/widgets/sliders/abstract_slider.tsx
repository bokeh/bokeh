import {OrientedControl, OrientedControlView} from "../oriented_control"
import {bind} from "core/class"
import * as p from "core/properties"
import type {Keys} from "core/dom"
import {bounding_box, box_size} from "core/dom"
import type {VNode, TargetedEvent} from "core/vdom"
import {UIComponent, cls} from "core/vdom"
import type {StyleSheetLike} from "core/stylesheets"
import {assert} from "core/util/assert"
import {clamp, sign, minmax} from "core/util/math"
import {range, min_by, copy} from "core/util/array"
import {bisect_right} from "core/util/arrayable"
import type {BBox, XY} from "core/util/bbox"
import {isNumber} from "core/util/types"

import * as sliders_css from "styles/widgets/sliders.css"

import {computed} from "@preact/signals"

type TargetedPointerEvent = TargetedEvent<HTMLElement, PointerEvent>
type TargetedWheelEvent = TargetedEvent<HTMLElement, WheelEvent>

const {abs, max: max_of} = Math

export type SliderSpec<T> = {
  readonly start: number
  readonly end: number
  readonly step: number | null
  readonly values: T[]
  compute(value: T): number
  invert(synthetic: number): T
}

type SliderMeta<T> = SliderSpec<T> & {
  readonly min: number
  readonly max: number
  readonly span: number
  readonly reversed: boolean
  readonly ticks: number[] | null
  readonly step_multiplier: number
  readonly N: number
}

type HitType = "handle" | "track" | "span"
type HitTarget = {type: HitType, el: HTMLElement}

type PointerId = number
type DragState = {bbox: BBox, xy: XY, target: HitTarget, pointer: PointerId}

export abstract class AbstractSliderView<T extends number | string> extends OrientedControlView {
  declare readonly model: AbstractSlider<T>
  declare readonly signals: p.SignalsOf<AbstractSlider.Props>
  declare readonly values: AbstractSlider.Attrs

  protected span_el: HTMLElement
  protected track_el: HTMLElement
  protected handles: HTMLElement[] = []

  protected override readonly _auto_width = "auto"
  protected override readonly _auto_height = "auto"

  // TODO remove this
  public *controls() {}

  abstract pretty(value: T): string

  get meta(): SliderMeta<T> {
    return this._meta.value
  }
  protected readonly _meta = computed<SliderMeta<T>>(() => {
    const spec = this._calc_spec()
    const {start, end, step} = spec

    const reversed = start > end
    const [min, max] = minmax(start, end)
    const span = max - min

    const ticks = (() => {
      if (step != null) {
        const ticks = range(min, max, step)
        ticks.push(max)
        return ticks
      } else {
        return null
      }
    })()
    const step_multiplier = ticks != null ? 0.2*ticks.length : 1 // 20% of span
    const N = spec.values.length

    return {...spec, min, max, span, reversed, ticks, step_multiplier, N}
  })

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), sliders_css.default]
  }

  get horizontal(): boolean {
    return this.values.orientation == "horizontal"
  }

  protected hit_target(event: Event): HitTarget | null {
    const {N} = this.meta
    for (const el of event.composedPath()) {
      for (const handle_el of this.handles) {
        if (el == handle_el) {
          return {type: "handle", el: handle_el}
        }
      }
      if (N == 2 && el == this.span_el) {
        return {type: "span", el: this.span_el}
      }
      if (el == this.track_el) {
        return {type: "track", el: this.track_el}
      }
    }
    return null
  }

  protected nearest_handle(event: MouseEvent): HitTarget {
    const ex = event.clientX
    const ey = event.clientY

    const dist2 = (center: XY) => (center.x - ex)**2 + (center.y - ey)**2

    const handle_el = min_by(this.handles, (handle_el) => dist2(bounding_box(handle_el).center))
    return {type: "handle", el: handle_el}
  }

  protected get_new_values(i_or_handle_el: number | HTMLElement, new_value: T): T[] {
    const i = isNumber(i_or_handle_el) ? i_or_handle_el : this.handles.indexOf(i_or_handle_el)
    const new_values = copy(this.meta.values)
    new_values[i] = new_value
    return new_values
  }

  protected drag_to(xy: XY, state: DragState, throttle: boolean = false): void {
    const v = (() => {
      if (this.horizontal) {
        const dx = xy.x - state.xy.x
        return state.bbox.x + dx
      } else {
        const dy = xy.y - state.xy.y
        return state.bbox.y + dy
      }
    })()

    /*
    const {values} = this.meta
    const new_values = copy(values)
    switch (state.target.type) {
      case "handle": {
        values.map((v) => this._move_to(v))
        break
      }
      case "span":
      case "track":
    }
    */

    const handle_el = state.target.el
    const new_value = this._move_to(v)

    const new_values = this.get_new_values(handle_el, new_value)
    this._change(new_values, throttle)
  }

  protected move_to(xy: XY, handle_el: HTMLElement): void {
    const {x, y} = bounding_box(this.track_el).relativize(xy)
    const new_value = this._move_to(this.horizontal ? x : y)
    const new_values = this.get_new_values(handle_el, new_value)
    this._change(new_values)
  }

  protected _move_to(pixel_v: number): T {
    const {width, height} = box_size(this.track_el)
    const size = this.horizontal ? width : height
    let sv = clamp(pixel_v, 0, size)/size
    if (this.meta.reversed) {
      sv = 1 - sv
    }
    return this._invert(sv)
  }

  protected shift_by(handles: HTMLElement[], factor: number): void {
    const {min, max, values, step, reversed, compute, invert} = this.meta
    if (step == null) {
      return // TODO use some fixed percentage
    }

    const sign = reversed ? -1 : 1
    const offset = sign*factor*step

    const new_values = copy(values)

    for (const handle_el of handles) {
      const i = this.handles.indexOf(handle_el)
      const value = values[i]
      const new_synthetic = this._compute(invert(clamp(compute(value) + offset, min, max)))
      const new_value = this._invert(new_synthetic)
      new_values[i] = new_value
    }

    this._change(new_values)
  }

  override component(): VNode {
    const {orientation, disabled, appearance, tooltips} = this.signals
    const {meta} = this

    const orientation_cls = sliders_css[orientation.value]
    const disabled_cls = disabled.value ? sliders_css.disabled : null
    const stealth_cls = appearance.value == "stealth" ? sliders_css.stealth : null

    const TeXComponent = ({text}: {text: string}) => {
      const set_content = (el: HTMLElement | null): void => {
        if (el != null) {
          if (this.contains_tex_string(text)) {
            el.innerHTML = this.process_tex(text)
          } else {
            el.textContent = text
          }
        }
      }
      return <span ref={set_content}></span>
    }

    const title_el = (() => {
      const title = this.signals.title.value
      const show_value = this.signals.show_value.value

      const hide_header = title == null || (title.length == 0 && !show_value)
      if (!hide_header) {
        const title_el = (() => {
          if (title.length > 0) {
            return <><TeXComponent text={title}></TeXComponent>: </>
          } else {
            return null
          }
        })()
        const value_el = (() => {
          if (show_value) {
            const {values} = meta
            const pretty = values.map((v) => this.pretty(v)).join(" .. ")
            return <span class={sliders_css.value}>{pretty}</span>
          } else {
            return null
          }
        })()
        return <div class={sliders_css.title}>{title_el}{value_el}</div>
      } else {
        return null
      }
    })()

    const {reversed, values, N} = meta

    const handles = values.map((value, i) => {
      const at = (() => {
        let sv = this._compute(value)
        const {reversed} = meta
        if (reversed) {
          sv = 1 - sv
        }
        return sv
      })()
      return (
        <div
          class={sliders_css.handle}
          tabIndex={disabled.value ? -1 : 0}
          style={{"--at": `${at}`}}
          aria-valuetext={this.pretty(value)}
          onKeyDown={this._on_keydown}
          ref={(el) => { this.handles[i] = el! }}
        >
          {tooltips.value ? <div class={sliders_css.tooltip}>{this.pretty(value)}</div> : null}
        </div>
      )
    })

    const [start, end] = (() => {
      const svs = values.map((v) => this._compute(v))
      switch (N) {
        case 1: {
          const [sv0, sv1] = [0, ...svs]
          return !reversed ? [sv0, sv1] : [1 - sv1, 1 - sv0]
        }
        case 2: {
          const [sv0, sv1] = svs
          return !reversed ? [sv0, sv1] : [1 - sv1, 1 - sv0]
        }
        default: {
          return [0, 0]
        }
      }
    })()

    const draggable_cls = N == 2 ? sliders_css.draggable : null

    return (
      <UIComponent parent={this.resolved_props} class={cls(orientation_cls, disabled_cls, stealth_cls)} aria-disabled={disabled}>
        {title_el}
        <div
          class={sliders_css.slider}
          onPointerDown={this._on_pointer_down}
          onPointerMove={this._on_pointer_move}
          onPointerCancel={this._on_pointer_cancel}
          onPointerUp={this._on_pointer_up}
          onWheel={this._on_wheel}
        >
          <div class={sliders_css.track} ref={(el) => { this.track_el = el! }}>
            <div class={cls(sliders_css.span, draggable_cls)} style={{"--start": start, "--end": end}} ref={(el) => { this.span_el = el! }}></div>
            {...handles}
          </div>
        </div>
      </UIComponent>
    )
  }

  private _state: DragState | null = null

  // TODO redesign this using UIGestures
  @bind protected _on_pointer_down(event: TargetedPointerEvent): void {
    if (this.values.disabled) {
      return
    }
    assert(this._state == null)
    if (!event.isPrimary) {
      return
    }
    const target = this.hit_target(event)
    if (target == null) {
      return
    }
    target.el.setPointerCapture(event.pointerId)
    target.el.focus()
    event.preventDefault()
    const {x, y} = event
    const bbox = bounding_box(target.el, this.track_el) // ???
    this._state = {
      bbox: bbox.translate(bbox.width/2, bbox.height/2),
      xy: {x, y},
      target,
      pointer: event.pointerId,
    }
  }

  @bind protected _on_pointer_move(event: TargetedPointerEvent): void {
    if (this._state != null && this._state.pointer == event.pointerId) {
      this.drag_to(event, this._state, true)
    }
  }

  @bind protected _on_pointer_cancel(event: TargetedPointerEvent): void {
    if (this._state != null && this._state.pointer == event.pointerId) {
      this._state = null
    }
  }

  @bind protected _on_pointer_up(event: TargetedPointerEvent): void {
    if (this._state != null && this._state.pointer == event.pointerId) {
      if (this._state.target.type != "track") {
        this.drag_to(event, this._state)
      } else if (this.handles.length == 1) {
        const [handle_el] = this.handles
        this.move_to(event, handle_el)
      }
      this._state = null
    }
  }

  @bind protected _on_wheel(event: TargetedWheelEvent): void {
    if (this.values.disabled) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const {N} = this.meta
    const dy = sign(-event.deltaY)
    if (N == 2) {
      this.shift_by(this.handles, dy)
    } else {
      const handle_el = this.nearest_handle(event).el
      this.shift_by([handle_el], dy)
    }
  }

  @bind protected _on_keydown(event: KeyboardEvent): void {
    if (this.values.disabled) {
      return
    }
    const target = this.hit_target(event)
    if (target == null || target.type != "handle") {
      return
    }
    const handle_el = target.el
    switch (event.key as Keys) {
      case "Home": {
        const new_value = this._invert(0.0)
        const new_values = this.get_new_values(handle_el, new_value)
        this._change(new_values)
        break
      }
      case "End": {
        const new_value = this._invert(1.0)
        const new_values = this.get_new_values(handle_el, new_value)
        this._change(new_values)
        break
      }
      case this.horizontal ? "ArrowLeft" : "ArrowUp": {
        this.shift_by([handle_el], -1)
        break
      }
      case this.horizontal ? "ArrowRight" : "ArrowDown": {
        this.shift_by([handle_el], +1)
        break
      }
      case "PageDown": {
        const {step_multiplier} = this.meta
        this.shift_by([handle_el], -step_multiplier)
        break
      }
      case "PageUp": {
        const {step_multiplier} = this.meta
        this.shift_by([handle_el], +step_multiplier)
        break
      }
      default:
    }
  }

  protected _change(values: T[], throttle: boolean = false): void {
    const value = this._calc_from(values)
    if (throttle) {
      this.model.value = value
    } else {
      this.model.setv({value, value_throttled: value})
    }
  }

  protected abstract _calc_spec(): SliderSpec<T>

  protected abstract _calc_from(values: T[]): T | T[]

  /**
   * Convert value space to screen space [0, 1].
   */
  protected _compute(value: T): number {
    const {min, span, compute} = this.meta
    return (compute(value) - min)/span
  }

  /**
   * Convert from screen space [0, 1] to value space.
   */
  protected _invert(synthetic: number): T {
    const {min, span, ticks, invert} = this.meta
    if (isNaN(synthetic)) {
      synthetic = min
    }
    assert(0 <= synthetic && synthetic <= 1.0)
    const value = synthetic*span + min
    if (ticks == null) {
      return invert(value)
    } else {
      const i = max_of(bisect_right(ticks, value) - 1, 0)
      const v0 = ticks[i]
      const v1 = ticks[i + 1] ?? Infinity
      const v = abs(value - v0) <= abs(value - v1) ? v0 : v1
      return invert(v)
    }
  }
}

export namespace AbstractSlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = OrientedControl.Props & {
    title: p.Property<string | null>
    show_value: p.Property<boolean>
    value: p.Property<unknown>
    value_throttled: p.Property<unknown>
    tooltips: p.Property<boolean>
    appearance: p.Property<"normal" | "stealth">
  }
}

export interface AbstractSlider<T extends number | string> extends AbstractSlider.Attrs {}

export abstract class AbstractSlider<T extends number | string> extends OrientedControl {
  declare properties: AbstractSlider.Props
  declare __view_type__: AbstractSliderView<T>

  constructor(attrs?: Partial<AbstractSlider.Attrs>) {
    super(attrs)
  }

  static {
    this.define<AbstractSlider.Props>(({Unknown, Bool, Str, Enum, Nullable}) => ({
      title:           [ Nullable(Str), "" ],
      show_value:      [ Bool, true ],
      value:           [ Unknown ],
      value_throttled: [ Unknown, p.unset, {readonly: true} ],
      tooltips:        [ Bool, true ],
      appearance:      [ Enum("normal", "stealth"), "normal" ],
    }))
  }
}
