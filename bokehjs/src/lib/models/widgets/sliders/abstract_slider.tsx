import * as p from "core/properties"
import type {StyleSheetLike, Keys} from "core/dom"
import {div, span, empty, bounding_box, box_size} from "core/dom"
import {assert} from "core/util/assert"
import {clamp, sign} from "core/util/math"
import {range, min_by, copy} from "core/util/array"
import {zip} from "core/util/iterator"
import {bisect_right} from "core/util/arrayable"
import type {BBox, XY} from "core/util/bbox"

import {OrientedControl, OrientedControlView} from "../oriented_control"

import * as sliders_css from "styles/widgets/sliders.css"
import * as inputs_css from "styles/widgets/inputs.css"

const {abs, max} = Math

export type SliderSpec<T> = {
  min: number
  max: number
  step: number | null
  values: T[]
  compute(value: T): number
  invert(synthetic: number): T
}

type SliderMeta<T> = SliderSpec<T> & {
  span: number
  ticks: number[] | null
  step_multiplier: number
}

type HitType = "handle" | "track" // TODO | "span"
type HitTarget = {type: HitType, el: HTMLElement}

type PointerId = number
type DragState = {bbox: BBox, xy: XY, target: HitTarget, pointer: PointerId}

export abstract class AbstractSliderView<T extends number | string> extends OrientedControlView {
  declare model: AbstractSlider<T>

  protected group_el: HTMLElement
  protected slider_el: HTMLElement
  protected title_el: HTMLElement
  protected span_el: HTMLElement
  protected track_el: HTMLElement

  protected handles: HTMLElement[]

  protected override readonly _auto_width = "auto"
  protected override readonly _auto_height = "auto"

  public *controls() {
    yield this.slider_el as HTMLInputElement
  }

  abstract pretty(value: number | string): string

  protected _meta: SliderMeta<T>
  get meta(): Readonly<SliderMeta<T>> {
    return this._meta
  }

  protected _update_state(): void {
    const spec = this._calc_spec()
    const {min, max, step} = spec

    const ticks = (() => {
      if (step != null) {
        const ticks = range(min, max, step)
        ticks.push(max)
        return ticks
      } else {
        return null
      }
    })()
    const span = max - min
    const step_multiplier = ticks != null ? 0.2*ticks.length : 1

    this._meta = {...spec, span, ticks, step_multiplier}
  }

  protected _update_value(): void {
    this._meta.values = this._calc_to(this.model.value as T | T[])
    for (const [value, handle_el] of zip(this._meta.values, this.handles)) {
      this.move_to(handle_el, this._compute(value))
    }
  }

  protected _update_slider(): void {
    this._update_state()
    this._update_value()
  }

  override _after_layout(): void {
    super._after_layout()
    this._update_value()
  }

  override connect_signals(): void {
    super.connect_signals()

    const {orientation, tooltips} = this.model.properties
    this.on_change([orientation, tooltips], () => this.rerender())

    const {value, title, show_value} = this.model.properties
    this.on_change(value, () => this._update_value())
    this.on_change([value, title, show_value], () => this._update_title())
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), sliders_css.default]
  }

  _update_title(): void {
    empty(this.title_el)

    const hide_header = this.model.title == null || (this.model.title.length == 0 && !this.model.show_value)
    this.title_el.style.display = hide_header ? "none" : ""

    if (!hide_header) {
      const {title} = this.model
      if (title != null && title.length > 0) {
        if (this.contains_tex_string(title)) {
          this.title_el.innerHTML = `${this.process_tex(title)}: `
        } else {
          this.title_el.textContent = `${title}: `
        }
      }

      if (this.model.show_value) {
        const {values} = this._meta
        const pretty = values.map((v) => this.pretty(v)).join(" .. ")
        this.title_el.appendChild(span({class: sliders_css.slider_value}, pretty))
      }
    }
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

  protected _move_to(handle_el: HTMLElement, v: number): T {
    const value = (() => {
      const {width, height} = box_size(this.track_el)
      const size = this.horizontal ? width : height
      const sv = clamp(v, 0, size)
      return this._invert(sv/size)
    })()

    const dv = this._compute(value)

    handle_el.style.setProperty("--at", `${dv}`)
    handle_el.ariaValueText = this.pretty(value)

    switch (this.handles.length) {
      case 1: {
        this.span_el.style.setProperty("--start", "0")
        this.span_el.style.setProperty("--end", `${dv}`)
        break
      }
      case 2: {
        const [dv0, dv1] = this.get_new_values(handle_el, value).map((v) => this._compute(v))
        this.span_el.style.setProperty("--start", `${dv0}`)
        this.span_el.style.setProperty("--end", `${dv1}`)
        break
      }
    }

    return value
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

  override render(): void {
    super.render()
    this._update_state()

    this.handles = []
    for (const _ of this._meta.values) {
      const handle_el = div({class: sliders_css.handle, tabIndex: 0})
      this.handles.push(handle_el)
    }

    this.span_el = div({class: sliders_css.span})
    this.track_el = div({class: sliders_css.track}, this.span_el, ...this.handles)
    this.slider_el = div({class: sliders_css.slider}, this.track_el)

    this.class_list.toggle(sliders_css.stealth, this.model.appearance == "stealth")
    this.class_list.add(sliders_css[this.model.orientation])

    let state: DragState | null = null

    // TODO redesign this using UIGestures
    this.track_el.addEventListener("pointerdown", (event) => {
      assert(state == null)
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
      state = {
        bbox: bbox.translate(bbox.width/2, bbox.height/2),
        xy: {x, y},
        target,
        pointer: event.pointerId,
      }
    })
    this.track_el.addEventListener("pointermove", (event) => {
      if (state != null && state.pointer == event.pointerId && state.target.type == "handle") {
        this.drag(event, state, true)
      }
    })
    this.track_el.addEventListener("pointercancel", (event) => {
      if (state != null && state.pointer == event.pointerId) {
        state = null
      }
    })
    this.track_el.addEventListener("pointerup", (event) => {
      if (state != null && state.pointer == event.pointerId) {
        if (state.target.type == "handle") {
          state.target.el.focus()
          this.drag(event, state)
        } else if (this.handles.length == 1) {
          const [handle_el] = this.handles
          handle_el.focus()
          this.move(event, handle_el)
        }
        state = null
      }
    })

    this.track_el.addEventListener("wheel", (event) => {
      event.preventDefault()
      event.stopPropagation()

      const dy = sign(-event.deltaY)
      const handle_el = this.nearest_handle(event).el
      this.shift_by(handle_el, dy)
    })

    const keydown = (event: KeyboardEvent): void => {
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

    for (const handle_el of this.handles) {
      handle_el.addEventListener("keydown", keydown)
    }

    this.title_el = div({class: sliders_css.slider_title})
    this._update_title()

    this.group_el = div({class: inputs_css.input_group}, this.title_el, this.slider_el)
    this.shadow_el.appendChild(this.group_el)
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

  protected _compute(value: T): number {
    const {min, span, compute} = this._meta
    return (compute(value) - min)/span
  }

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
      const i = max(bisect_right(ticks, value) - 1, 0)
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

    this.override<AbstractSlider.Props>({
      width: 300, // sliders don't have any intrinsic width
    })
  }
}
