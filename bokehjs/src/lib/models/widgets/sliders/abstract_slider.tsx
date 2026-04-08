import {OrientedControl, OrientedControlView} from "../oriented_control"
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

import * as sliders_css from "styles/widgets/sliders.css"

type TargetedPointerEvent = TargetedEvent<HTMLElement, PointerEvent>
type TargetedWheelEvent = TargetedEvent<HTMLElement, WheelEvent>

const {abs, max: max_of} = Math

export type SliderSpec<T> = {
  start: number
  end: number
  step: number | null
  values: T[]
  compute(value: T): number
  invert(synthetic: number): T
}

type SliderMeta<T> = SliderSpec<T> & {
  min: number
  max: number
  span: number
  reversed: boolean
  ticks: number[] | null
  step_multiplier: number
}

type HitType = "handle" | "track" | "span"
type HitTarget = {type: HitType, el: HTMLElement}

type PointerId = number
type DragState = {bbox: BBox, xy: XY, target: HitTarget, pointer: PointerId}

export abstract class AbstractSliderView<T extends number | string> extends OrientedControlView {
  declare readonly model: AbstractSlider<T>
  declare readonly signals: p.SignalsOf<AbstractSlider.Props>

  protected span_el: HTMLElement
  protected track_el: HTMLElement
  protected handles: HTMLElement[] = []

  protected override readonly _auto_width = "auto"
  protected override readonly _auto_height = "auto"

  // TODO remove this
  public *controls() {}

  abstract pretty(value: number | string): string

  protected _meta: SliderMeta<T>
  get meta(): Readonly<SliderMeta<T>> {
    return this._meta
  }

  override initialize(): void {
    super.initialize()
    this._update_state()
  }

  protected _update_state(): void {
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

    this._meta = {...spec, min, max, span, reversed, ticks, step_multiplier}
  }

  /*
  protected _update_value(): void {
    this._meta.values = this._calc_to(this.model.value as T | T[])
    for (const [value, handle_el] of zip(this._meta.values, this.handles)) {
      this.move_to(handle_el, this._compute(value))
    }
  }
  */

  protected _update_slider(): void {
    //this._update_state()
    //this._update_value()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), sliders_css.default]
  }

  get horizontal(): boolean {
    return this.model.orientation == "horizontal"
  }

  protected hit_target(event: Event): HitTarget | null {
    for (const el of event.composedPath()) {
      for (const handle_el of this.handles) {
        if (el == handle_el) {
          return {type: "handle", el: handle_el}
        }
      }
      if (el == this.span_el) {
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

  protected get_new_values(handle_el: HTMLElement, new_value: T): T[] {
    const i = this.handles.indexOf(handle_el)
    const new_values = copy(this._meta.values)
    new_values[i] = new_value
    return new_values
  }

  protected drag(event: PointerEvent, state: DragState, throttle: boolean = false): void {
    const v = (() => {
      if (this.horizontal) {
        const dx = event.x - state.xy.x
        return state.bbox.x + dx
      } else {
        const dy = event.y - state.xy.y
        return state.bbox.y + dy
      }
    })()

    const handle_el = state.target.el
    const new_value = this._move_to(handle_el, v)

    const new_values = this.get_new_values(handle_el, new_value)
    if (throttle) {
      this._throttled_change(new_values)
    } else {
      this._change(new_values)
    }
  }

  protected move(event: PointerEvent, handle_el: HTMLElement): void {
    const {x, y} = bounding_box(this.track_el).relativize(event)
    const new_value = this._move_to(handle_el, this.horizontal ? x : y)
    const new_values = this.get_new_values(handle_el, new_value)
    this._change(new_values)
  }

  protected move_to(handle_el: HTMLElement, pos: number): T {
    const size = box_size(this.track_el)
    const px = this.horizontal ? pos*size.width : pos*size.height
    return this._move_to(handle_el, px)
  }

  protected _move_to(_handle_el: HTMLElement, v: number): T {
    const {width, height} = box_size(this.track_el)
    const size = this.horizontal ? width : height
    const sv = clamp(v, 0, size)
    return this._invert(sv/size)
  }

  protected shift_by(handle_el: HTMLElement, factor: number): void {
    const {min, max, values, step, compute, invert} = this._meta
    if (step == null) {
      return
    }

    const offset = factor*step
    const i = this.handles.indexOf(handle_el)
    const value = values[i]
    const new_value = invert(clamp(compute(value) + offset, min, max))
    this.move_to(handle_el, this._compute(new_value))

    const new_values = this.get_new_values(handle_el, new_value)
    this._change(new_values)
  }

  override component(): VNode {
    this._update_state()

    // TODO tooltips, start, end, step
    const {orientation, disabled, appearance, value} = this.signals

    console.log(`${this}.component()`, value.value)

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
            const {values} = this._meta
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

    const handles = this._meta.values.map((value, i) => {
      const at = (() => {
        let sv = this._compute(value)
        const {reversed} = this._meta
        if (reversed) {
          sv = 1 - sv
        }
        return sv
      })()
      return (
        <div class={sliders_css.handle} tabIndex={0} style={{"--at": `${at}`}} aria-valuetext={this.pretty(value)}
          onKeyDown={this._keydown.bind(this)} ref={(el) => { this.handles[i] = el! }}></div>
      )
    })

    const {reversed} = this._meta
    const svs = this._meta.values.map((v) => this._compute(v))

    const [start, end] = (() => {
      switch (svs.length) {
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

    return (
      <UIComponent parent={this.resolved_props} class={cls(orientation_cls, disabled_cls, stealth_cls)}>
        {title_el}
        <div
          class={sliders_css.slider}
          onPointerDown={this._pointer_down.bind(this)}
          onPointerMove={this._pointer_move.bind(this)}
          onPointerCancel={this._pointer_cancel.bind(this)}
          onPointerUp={this._pointer_up.bind(this)}
          onWheel={this._wheel.bind(this)}
        >
          <div class={sliders_css.track} ref={(el) => { this.track_el = el! }}>
            <div class={sliders_css.span} style={{"--start": start, "--end": end}} ref={(el) => { this.span_el = el! }}></div>
            {...handles}
          </div>
        </div>
      </UIComponent>
    )
  }

  private _state: DragState | null = null

  // TODO redesign this using UIGestures
  protected _pointer_down(event: TargetedPointerEvent): void {
    assert(this._state == null)
    if (!event.isPrimary) {
      return
    }
    const target = this.hit_target(event)
    if (target == null) {
      return
    }
    target.el.setPointerCapture(event.pointerId)
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

  protected _pointer_move(event: TargetedPointerEvent): void {
    if (this._state != null && this._state.pointer == event.pointerId && this._state.target.type == "handle") {
      this.drag(event, this._state, true)
    }
  }

  protected _pointer_cancel(event: TargetedPointerEvent): void {
    if (this._state != null && this._state.pointer == event.pointerId) {
      this._state = null
    }
  }

  protected _pointer_up(event: TargetedPointerEvent): void {
    if (this._state != null && this._state.pointer == event.pointerId) {
      if (this._state.target.type == "handle") {
        this._state.target.el.focus()
        this.drag(event, this._state)
      } else if (this.handles.length == 1) {
        const [handle_el] = this.handles
        handle_el.focus()
        this.move(event, handle_el)
      }
      this._state = null
    }
  }

  protected _wheel(event: TargetedWheelEvent): void {
    event.preventDefault()
    event.stopPropagation()

    const dy = sign(-event.deltaY)
    const handle_el = this.nearest_handle(event).el
    this.shift_by(handle_el, dy)
  }

  protected _keydown(event: KeyboardEvent): void {
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
        this.shift_by(handle_el, -1)
        break
      }
      case this.horizontal ? "ArrowRight" : "ArrowDown": {
        this.shift_by(handle_el, +1)
        break
      }
      case "PageDown": {
        const {step_multiplier} = this._meta
        this.shift_by(handle_el, -step_multiplier)
        break
      }
      case "PageUp": {
        const {step_multiplier} = this._meta
        this.shift_by(handle_el, +step_multiplier)
        break
      }
      default:
    }
  }

  protected _throttled_change(values: T[]): void {
    this.model.value = this._calc_from(values)
  }

  protected _change(values: T[]): void {
    const value = this._calc_from(values)
    this.model.setv({value, value_throttled: value})
  }

  protected abstract _calc_spec(): SliderSpec<T>

  protected abstract _calc_to(values: T | T[]): T[]
  protected abstract _calc_from(values: T[]): T | T[]

  /**
   * Convert value space to screen space [0, 1].
   */
  protected _compute(value: T): number {
    const {min, span, compute} = this._meta
    return (compute(value) - min)/span
  }

  /**
   * Convert from screen space [0, 1] to value space.
   */
  protected _invert(synthetic: number): T {
    const {min, span, ticks, invert} = this._meta
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
