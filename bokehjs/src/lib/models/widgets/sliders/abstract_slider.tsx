import {OrientedControl, OrientedControlView} from "../oriented_control"
import {bind} from "core/class"
import * as p from "core/properties"
import type {Keys, ArrowKeys} from "core/dom"
import type {VNode, TargetedEvent} from "core/vdom"
import {UIComponent, cls} from "core/vdom"
import type {StyleSheetLike} from "core/stylesheets"
import {clamp, sign, minmax} from "core/util/math"
import {range} from "core/util/array"
import {bisect_right} from "core/util/arrayable"
import type {XY} from "core/util/bbox"

import * as sliders_css from "styles/widgets/sliders.css"

import {computed, signal} from "@preact/signals"

type TargetedPointerEvent = TargetedEvent<HTMLElement, PointerEvent>
type TargetedWheelEvent = TargetedEvent<HTMLElement, WheelEvent>

const {abs, round, min: min_of, max: max_of} = Math

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

/**
 * Describes how handles of a slider relate to each other and to the span.
 */
export type SliderKind = {
  /** Whether handles are kept in order, i.e. can't pass each other. */
  readonly ordered: boolean
  /** Whether the span can be dragged, moving all handles together. */
  readonly draggable: boolean
  /** Extent of the span in screen space [0, 1], or `null` if there's no span. */
  span(svs: number[]): [number, number] | null
  /** Accessible label distinguishing handle `i` of `n` handles (combined with the title). */
  label(i: number, n: number): string | null
}

/** One handle with a span filled from the start of the track. */
export const single_kind: SliderKind = {
  ordered: false,
  draggable: false,
  span: ([sv]) => [0, sv],
  label: () => null,
}

/** Two ordered handles connected by a draggable span. */
export const range_kind: SliderKind = {
  ordered: true,
  draggable: true,
  span: ([sv0, sv1]) => [sv0, sv1],
  label: (i) => i == 0 ? "minimum" : "maximum",
}

/** Any number of handles without a span, optionally kept in order. */
export function multi_kind({ordered}: {ordered: boolean}): SliderKind {
  return {
    ordered,
    draggable: false,
    span: () => null,
    label: (i, n) => `${i + 1} of ${n}`,
  }
}

type TeXProps = {
  text: string
  /** Converts TeX in the text to HTML, or returns `null` if there's nothing to process. */
  tex: (text: string) => string | null
  id?: string
}

/**
 * Renders text, possibly containing TeX. This is a top-level component, so
 * that its identity is stable across renders, and thus it isn't remounted.
 */
function TeXComponent({text, tex, id}: TeXProps): VNode {
  const html = tex(text)
  if (html == null) {
    return <span id={id}>{text}</span>
  } else {
    return <span id={id} dangerouslySetInnerHTML={{__html: html}}></span>
  }
}

type HitType = "handle" | "track" | "span"
type HitTarget = {type: HitType, el: HTMLElement}

type PointerId = number
type DragState = {
  pointer: PointerId
  /** Pointer position (in client coordinates) when the drag started. */
  xy: XY
  /** Synthetic values when the drag started. */
  values: number[]
  /** Indices of handles being dragged. */
  group: number[]
  /** Whether the dragged handle may still be swapped for an overlapping one. */
  unstack: boolean
  /** Element capturing the pointer, which also determines cursor and hover state. */
  capture_el: HTMLElement
}

export abstract class AbstractSliderView<T> extends OrientedControlView {
  declare readonly model: AbstractSlider<T>
  declare readonly signals: p.SignalsOf<AbstractSlider.Props>
  declare readonly values: AbstractSlider.Attrs

  protected span_el: HTMLElement | null = null
  protected track_el: HTMLElement
  protected handles: HTMLElement[] = []

  protected override readonly _auto_width = "auto"
  protected override readonly _auto_height = "auto"

  abstract pretty(value: T): string

  protected abstract get kind(): SliderKind

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
    const step_multiplier = ticks != null ? Math.round(0.2*ticks.length) : 4 // 20% of span (4*0.05*span); make configurable
    const N = spec.values.length

    return {...spec, min, max, span, reversed, ticks, step_multiplier, N}
  })

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), sliders_css.default]
  }

  get horizontal(): boolean {
    return this.values.orientation == "horizontal"
  }

  /**
   * Whether values increase against screen coordinates, i.e. from right to
   * left or from bottom to top. Vertical sliders have minimum at the bottom
   * (like native sliders), unless reversed.
   */
  get flipped(): boolean {
    return this.meta.reversed != !this.horizontal
  }

  protected hit_target(event: Event): HitTarget | null {
    for (const el of event.composedPath()) {
      for (const handle_el of this.handles) {
        if (el == handle_el) {
          return {type: "handle", el: handle_el}
        }
      }
      if (this.kind.draggable && el == this.span_el) {
        return {type: "span", el: this.span_el}
      }
      if (el == this.track_el) {
        return {type: "track", el: this.track_el}
      }
    }
    return null
  }

  /**
   * Synthetic values of all handles.
   */
  protected get synthetic_values(): number[] {
    const {values, compute} = this.meta
    return values.map((value) => compute(value))
  }

  /**
   * Index of the handle nearest to the given synthetic value. Ties
   * between overlapping handles are resolved towards the value.
   */
  protected nearest_handle(values: number[], value: number): number {
    let nearest = 0
    for (let i = 1; i < values.length; i++) {
      const d = abs(values[i] - value)
      const d_nearest = abs(values[nearest] - value)
      if (d < d_nearest || (d == d_nearest && value > values[i])) {
        nearest = i
      }
    }
    return nearest
  }

  /**
   * With ordered handles, picks which of the handles overlapping handle `i`
   * can move in the given direction (e.g. when both handles of a range are
   * at the end of the track, only the first one can move). This is needed
   * when dragging, because only the topmost of overlapping handles can be
   * picked with a pointer.
   */
  protected unstack(values: number[], i: number, direction: number): number {
    if (!this.kind.ordered || direction == 0) {
      return i
    }
    const delta = direction < 0 ? -1 : 1
    let j = i
    while (values[j + delta] == values[i]) {
      j += delta
    }
    return j
  }

  /**
   * Snap a synthetic value to the nearest tick (if any) and clamp it to the slider's range.
   */
  protected snap(value: number): number {
    const {min, max, ticks} = this.meta
    value = clamp(value, min, max)
    if (ticks == null) {
      return value
    } else {
      const i = max_of(bisect_right(ticks, value) - 1, 0)
      const v0 = ticks[i]
      const v1 = ticks[i + 1] ?? Infinity
      return abs(value - v0) <= abs(value - v1) ? v0 : v1
    }
  }

  /**
   * Range within which handle `i` can move, given positions of handles outside `group`.
   */
  protected bounds(values: number[], i: number, group: number[]): [number, number] {
    let {min: lo, max: hi} = this.meta
    if (this.kind.ordered) {
      const prev = i - 1
      const next = i + 1
      if (prev >= 0 && !group.includes(prev)) {
        lo = max_of(lo, values[prev])
      }
      if (next < values.length && !group.includes(next)) {
        hi = min_of(hi, values[next])
      }
    }
    return [lo, hi]
  }

  protected place(values: number[], i: number, group: number[], value: number): number {
    const [lo, hi] = this.bounds(values, i, group)
    return clamp(this.snap(value), lo, hi)
  }

  /**
   * Move handle `i` to the given synthetic value.
   */
  protected move(values: number[], i: number, value: number): number[] {
    const new_values = [...values]
    new_values[i] = this.place(values, i, [i], value)
    return new_values
  }

  /**
   * Move a group of handles together by a synthetic offset. The offset
   * is limited, so that the distances between handles are preserved.
   */
  protected shift(values: number[], group: number[], offset: number): number[] {
    const {step} = this.meta
    if (step != null) {
      offset = round(offset/step)*step
    }

    let lo = -Infinity
    let hi = +Infinity
    for (const i of group) {
      const [lo_i, hi_i] = this.bounds(values, i, group)
      lo = max_of(lo, lo_i - values[i])
      hi = min_of(hi, hi_i - values[i])
    }
    offset = clamp(offset, lo, hi)

    const new_values = [...values]
    for (const i of group) {
      new_values[i] = this.place(values, i, group, values[i] + offset)
    }
    return new_values
  }

  /**
   * Synthetic offset corresponding to `factor` steps, in the direction of increasing values.
   */
  protected step_offset(factor: number): number {
    const {span, step} = this.meta
    const computed_step = step == null ? 0.05*span : step
    return factor*computed_step
  }

  /**
   * Direction (in value space) of an arrow key. Arrows along the slider's axis
   * move handles in their visual direction (which matters for reversed sliders),
   * and arrows across the axis follow value semantics (up and right increase).
   */
  protected arrow_direction(key: ArrowKeys): number {
    const along = this.horizontal ? key == "ArrowLeft" || key == "ArrowRight" : key == "ArrowUp" || key == "ArrowDown"
    if (along) {
      // to the right or down in screen space
      const forward = key == "ArrowRight" || key == "ArrowDown"
      return forward != this.flipped ? +1 : -1
    } else {
      return key == "ArrowRight" || key == "ArrowUp" ? +1 : -1
    }
  }

  protected get track_size(): number {
    const {clientWidth, clientHeight} = this.track_el
    return this.horizontal ? clientWidth : clientHeight
  }

  /**
   * Convert a position in client coordinates to a synthetic value.
   */
  protected to_synthetic(xy: XY): number {
    const {min, span} = this.meta
    const {track_el, track_size} = this
    const {left, top} = track_el.getBoundingClientRect()
    const v = this.horizontal ? xy.x - left - track_el.clientLeft : xy.y - top - track_el.clientTop
    const sv = track_size == 0 ? 0 : clamp(v/track_size, 0, 1)
    return (this.flipped ? 1 - sv : sv)*span + min
  }

  /**
   * Handle (by index) or span that has keyboard focus, i.e. should show focus
   * indicators (e.g. tooltips or stealth handles). This is tracked manually,
   * instead of relying on `:focus-visible`, because the browser can't tell
   * pointer interaction (the default action of pointerdown is prevented), so
   * it would apply keyboard heuristics, and `focus({focusVisible: false})`
   * isn't universally supported.
   */
  protected readonly _keyboard_focus = signal<number | "span" | null>(null)

  /** Whether the last interaction with the slider was using a pointer. */
  private _pointer_interaction: boolean = false

  protected focus_target(el: EventTarget | null): number | "span" | null {
    if (el != null && el == this.span_el) {
      return "span"
    }
    const i = this.handles.indexOf(el as HTMLElement)
    return i != -1 ? i : null
  }

  /**
   * Focus an element as a result of pointer interaction, i.e. without focus indicators.
   */
  protected pointer_focus(el: HTMLElement): void {
    this._pointer_interaction = true
    this._keyboard_focus.value = null
    // in browsers that support it, this also prevents native focus rings
    el.focus({focusVisible: false})
  }

  @bind protected _on_focus_in(event: FocusEvent): void {
    if (!this._pointer_interaction && !this.values.disabled) {
      this._keyboard_focus.value = this.focus_target(event.target)
    }
  }

  @bind protected _on_focus_out(event: FocusEvent): void {
    const target = this.focus_target(event.relatedTarget)
    if (target == null) {
      // focus left the slider, so the next focus may come from keyboard
      this._pointer_interaction = false
    }
    this._keyboard_focus.value = null
  }

  private _title_html: {text: string, html: string | null} | null = null

  /**
   * Title with processed TeX, or `null` if it doesn't contain TeX. The result
   * is cached, because processing TeX is expensive and the title is rendered
   * on every change of the value.
   */
  @bind protected title_html(text: string): string | null {
    if (this.provider.MathJax == null) {
      // don't cache, so that TeX is processed once MathJax is available
      return null
    }
    if (this._title_html?.text != text) {
      const html = this.contains_tex_string(text) ? this.process_tex(text) : null
      this._title_html = {text, html}
    }
    return this._title_html.html
  }

  override component(): VNode {
    const {orientation, disabled, appearance, tooltips} = this.signals
    const {meta, kind} = this

    const orientation_cls = sliders_css[orientation.value]
    const disabled_cls = disabled.value ? sliders_css.disabled : null
    const stealth_cls = appearance.value == "stealth" ? sliders_css.stealth : null

    // IDs are scoped to the shadow root, so they don't need to be globally unique
    const title_id = "title"
    const handle_id = (i: number) => `handle-${i}`
    const span_id = "span"

    const title_el = (() => {
      const title = this.signals.title.value
      const show_value = this.signals.show_value.value

      const hide_header = title == null || (title.length == 0 && !show_value)
      if (!hide_header) {
        const title_el = (() => {
          if (title.length > 0) {
            return <><TeXComponent text={title} tex={this.title_html} id={title_id}></TeXComponent>: </>
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

    const {values, N, min, max} = meta
    const {flipped} = this
    const dragged = this._dragged.value
    const keyboard_focus = this._keyboard_focus.value
    const svs = values.map((value) => this._compute(value))
    const synthetic = this.synthetic_values

    // name a handle (or span) after the title combined with its own label (if any)
    const has_title = (this.signals.title.value ?? "").length != 0
    const labelled_by = (id: string, label: string | null): string | undefined => {
      const ids = [has_title ? title_id : null, label != null ? id : null].filter((id) => id != null)
      return ids.length != 0 ? ids.join(" ") : undefined
    }

    this.handles.length = N
    const handles = values.map((value, i) => {
      const at = flipped ? 1 - svs[i] : svs[i]
      const label = kind.label(i, N)
      // the range the handle can actually move within (e.g. up to its neighbors)
      const [lo, hi] = this.bounds(synthetic, i, [i])
      return (
        <div
          role="slider"
          id={handle_id(i)}
          class={cls(
            sliders_css.handle,
            dragged.includes(i) ? sliders_css.dragging : null,
            keyboard_focus == i ? sliders_css.focus_visible : null,
          )}
          tabIndex={disabled.value ? -1 : 0}
          style={{"--at": `${at}`}}
          aria-disabled={disabled}
          aria-orientation={orientation}
          aria-valuenow={synthetic[i]}
          aria-valuemin={lo}
          aria-valuemax={hi}
          aria-valuetext={this.pretty(value)}
          aria-label={label ?? undefined}
          aria-labelledby={labelled_by(handle_id(i), label)}
          onKeyDown={this._on_keydown}
          ref={(el) => { this.handles[i] = el! }}
        >
          {tooltips.value ? <div class={sliders_css.tooltip}>{this.pretty(value)}</div> : null}
        </div>
      )
    })

    const span_el = (() => {
      const span = kind.span(svs)
      if (span == null) {
        return null
      }
      const [sv0, sv1] = minmax(...span)
      const [start, end] = !flipped ? [sv0, sv1] : [1 - sv1, 1 - sv0]
      if (!kind.draggable) {
        return (
          <div
            class={sliders_css.span}
            style={{"--start": start, "--end": end}}
            ref={(el) => { this.span_el = el }}
          ></div>
        )
      }
      // a draggable span moves all handles together, so it can be focused
      // and controlled with keyboard as well
      // the span's value is its position, i.e. where its lower end can move
      const [lower, upper] = minmax(synthetic[0], synthetic[N - 1])
      const label = "range"
      return (
        <div
          role="slider"
          id={span_id}
          class={cls(sliders_css.span, sliders_css.draggable, keyboard_focus == "span" ? sliders_css.focus_visible : null)}
          tabIndex={disabled.value ? -1 : 0}
          style={{"--start": start, "--end": end}}
          aria-disabled={disabled}
          aria-orientation={orientation}
          aria-valuenow={lower}
          aria-valuemin={min}
          aria-valuemax={max - (upper - lower)}
          aria-valuetext={values.map((v) => this.pretty(v)).join(" to ")}
          aria-label={label}
          aria-labelledby={labelled_by(span_id, label)}
          onKeyDown={this._on_keydown}
          ref={(el) => { this.span_el = el }}
        ></div>
      )
    })()

    // keep tab order consistent with visual order (left to right or top to
    // bottom), i.e. a draggable span between the first and the remaining
    // handles, and reversed for flipped sliders
    const track_children = kind.draggable ? [handles[0], span_el, ...handles.slice(1)] : [span_el, ...handles]
    if (flipped) {
      track_children.reverse()
    }

    return (
      <UIComponent
        parent={this.resolved_props}
        class={cls(orientation_cls, disabled_cls, stealth_cls)}
      >
        {title_el}
        <div
          class={sliders_css.slider}
          onPointerDown={this._on_pointer_down}
          onPointerMove={this._on_pointer_move}
          onPointerUp={this._on_pointer_up}
          onPointerCancel={this._on_pointer_cancel}
          onLostPointerCapture={this._on_lost_pointer_capture}
          onWheel={this._on_wheel}
        >
          <div
            class={sliders_css.track}
            onFocusIn={this._on_focus_in}
            onFocusOut={this._on_focus_out}
            ref={(el) => { this.track_el = el! }}
          >
            {...track_children}
          </div>
        </div>
      </UIComponent>
    )
  }

  private _state: DragState | null = null

  /** Indices of handles being dragged. */
  protected readonly _dragged = signal<number[]>([])

  // TODO redesign this using UIGestures
  @bind protected _on_pointer_down(event: TargetedPointerEvent): void {
    this._pointer_interaction = true
    if (this.values.disabled || this._state != null) {
      return
    }
    if (!event.isPrimary || event.button != 0) {
      return
    }
    const target = this.hit_target(event)
    if (target == null) {
      return
    }

    const [values, group, unstack] = (() => {
      const values = this.synthetic_values
      switch (target.type) {
        case "handle": {
          const i = this.handles.indexOf(target.el)
          return [values, [i], true] as const
        }
        case "span": {
          return [values, range(values.length), false] as const
        }
        case "track": {
          // jump with the nearest handle to the pointer and continue dragging it
          const value = this.to_synthetic(event)
          const i = this.nearest_handle(values, value)
          const new_values = this.move(values, i, value)
          this._change(new_values, true)
          return [new_values, [i], false] as const
        }
      }
    })()

    // capture on the dragged element (not the whole slider), so that it
    // keeps its cursor and hover state (e.g. the tooltip) while dragging
    const capture_el = target.type == "span" ? target.el : this.handles[group[0]]
    capture_el.setPointerCapture(event.pointerId)
    this.pointer_focus(target.type == "span" ? target.el : this.handles[group[0]])
    event.preventDefault()

    this._state = {
      pointer: event.pointerId,
      xy: {x: event.clientX, y: event.clientY},
      values,
      group: [...group],
      unstack,
      capture_el,
    }
    this._dragged.value = this._state.group
  }

  @bind protected _on_pointer_move(event: TargetedPointerEvent): void {
    const {_state: state} = this
    if (state != null && state.pointer == event.pointerId) {
      if (this.values.disabled) {
        this._end_drag()
      } else {
        this._drag(event, state)
      }
    }
  }

  @bind protected _on_pointer_up(event: TargetedPointerEvent): void {
    const {_state: state} = this
    if (state != null && state.pointer == event.pointerId) {
      if (!this.values.disabled) {
        this._drag(event, state)
      }
      this._end_drag()
    }
  }

  @bind protected _on_pointer_cancel(event: TargetedPointerEvent): void {
    const {_state: state} = this
    if (state != null && state.pointer == event.pointerId) {
      this._end_drag()
    }
  }

  @bind protected _on_lost_pointer_capture(event: TargetedPointerEvent): void {
    const {_state: state} = this
    // ignore capture being transferred between handles
    if (state != null && state.pointer == event.pointerId && event.target == state.capture_el) {
      this._end_drag()
    }
  }

  protected _drag(xy: XY, state: DragState): void {
    const {span} = this.meta
    const {track_size} = this
    const dpx = this.horizontal ? xy.x - state.xy.x : xy.y - state.xy.y
    const offset = track_size == 0 ? 0 : (this.flipped ? -1 : 1)*dpx/track_size*span

    if (state.unstack && offset != 0) {
      const [i] = state.group
      const j = this.unstack(state.values, i, offset)
      if (j != i) {
        state.group = [j]
        this._dragged.value = state.group
        state.capture_el = this.handles[j]
        state.capture_el.setPointerCapture(state.pointer)
        this.pointer_focus(this.handles[j])
      }
      state.unstack = false
    }

    const values = this.shift(state.values, state.group, offset)
    this._change(values, true)
  }

  protected _end_drag(): void {
    this._state = null
    this._dragged.value = []
    this.model.setv({value_throttled: this.model.value})
  }

  @bind protected _on_wheel(event: TargetedWheelEvent): void {
    if (this.values.disabled) {
      return
    }

    const dy = sign(-event.deltaY)
    if (dy == 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const values = this.synthetic_values
    const group = (() => {
      if (this.kind.draggable) {
        return range(values.length)
      } else {
        const value = this.to_synthetic(event)
        return [this.nearest_handle(values, value)]
      }
    })()
    // scrolling behaves like arrow up and down keys
    const direction = this.arrow_direction(dy > 0 ? "ArrowUp" : "ArrowDown")
    this._change(this.shift(values, group, this.step_offset(direction)))
  }

  @bind protected _on_keydown(event: KeyboardEvent): void {
    if (this.values.disabled) {
      return
    }
    const target = this.hit_target(event)
    if (target == null || target.type == "track") {
      return
    }

    this._pointer_interaction = false
    this._keyboard_focus.value = this.focus_target(target.el)

    const {step_multiplier} = this.meta
    const key = event.key as Keys
    const offset = (() => {
      switch (key) {
        case "Home":
          return -Infinity
        case "End":
          return +Infinity
        case "ArrowLeft":
        case "ArrowRight":
        case "ArrowUp":
        case "ArrowDown":
          return this.step_offset(this.arrow_direction(key))
        case "PageDown":
          return this.step_offset(-step_multiplier)
        case "PageUp":
          return this.step_offset(+step_multiplier)
        default:
          return null
      }
    })()

    if (offset == null) {
      return
    }

    const values = this.synthetic_values
    const group = (() => {
      if (target.type == "span") {
        return range(values.length)
      } else {
        // unlike when dragging, don't unstack overlapping handles, because
        // the focused handle was chosen explicitly, so it should stop at its
        // neighbors (any of overlapping handles can be focused with tab)
        const i = this.handles.indexOf(target.el)
        return [i]
      }
    })()

    event.preventDefault()
    this._change(this.shift(values, group, offset))
  }

  /**
   * Update the model from synthetic values.
   */
  protected _change(values: number[], throttle: boolean = false): void {
    const {invert} = this.meta
    const value = this._calc_from(values.map((v) => invert(v)))
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
    return span == 0 ? 0 : (compute(value) - min)/span
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

export interface AbstractSlider<T> extends AbstractSlider.Attrs {}

export abstract class AbstractSlider<T> extends OrientedControl {
  declare properties: AbstractSlider.Props
  declare __view_type__: AbstractSliderView<T>

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
