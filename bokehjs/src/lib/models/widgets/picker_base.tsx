import flatpickr from "flatpickr"
import type {FlatpickrInstance, FlatpickrOptions} from "../../external/flatpickr"

import {InputWidget, InputWidgetView, PrefixSuffixCommon, Prefix, Suffix} from "./input_widget"
import type {StyleSheetLike} from "core/dom"
import {input, empty} from "core/dom"
import type {VNode} from "core/vdom"
import {UIComponent} from "core/vdom"
import {bind} from "core/class"
import {CalendarPosition} from "core/enums"
import {bounding_box} from "core/dom"
import {assert} from "core/util/assert"
import type * as p from "core/properties"

import flatpickr_css from "styles/widgets/flatpickr.css"
import * as inputs_css from "styles/widgets/inputs.css"

import {createRef} from "preact"

export abstract class PickerBaseView extends InputWidgetView {
  declare readonly model: PickerBase
  declare readonly signals: p.SignalsOf<PickerBase.Props>
  declare readonly values: PickerBase.Attrs

  protected _picker?: FlatpickrInstance

  get picker(): FlatpickrInstance {
    assert(this._picker != null)
    return this._picker
  }

  /**
   * The element hosting flatpickr's input. flatpickr manages its own DOM
   * (e.g. it adds an alternative input), so this element has no vDOM children.
   */
  protected _input_host: HTMLElement | null = null

  /**
   * The element hosting flatpickr's calendar, which is positioned relative to
   * the widget (see `_position()`).
   */
  protected _calendar_host: HTMLElement | null = null

  /**
   * The element relative to which the calendar is positioned.
   */
  protected readonly _outer_ref = createRef<HTMLDivElement>()

  override remove(): void {
    this._destroy_picker()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), flatpickr_css]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {inline, disabled} = this.model.properties
    this.connect(inline.change, () => this.picker.set("inline", this.model.inline))
    this.connect(disabled.change, () => this._update_disabled())
  }

  @bind
  protected _input_host_ref(el: HTMLDivElement | null): void {
    this._input_host = el
    this._rebuild_picker()
  }

  @bind
  protected _calendar_host_ref(el: HTMLDivElement | null): void {
    this._calendar_host = el
    this._rebuild_picker()
  }

  override component(): VNode {
    const {prefix, suffix} = this.values
    const Title = this._title_el
    return (
      <UIComponent parent={this.resolved_props}>
        <Title></Title>
        <div ref={this._outer_ref} class={inputs_css.outer}>
          <Prefix text={prefix}/>
          <div class={inputs_css.inner} ref={this._input_host_ref}/>
          <Suffix text={suffix}/>
        </div>
        <div ref={this._calendar_host_ref}/>
      </UIComponent>
    )
  }

  protected get flatpickr_options(): FlatpickrOptions {
    return {
      appendTo: this._calendar_host ?? undefined,
      positionElement: this._outer_ref.current ?? undefined,
      inline: this.model.inline,
      position: this._position.bind(this),
      onChange: (selected) => {
        this._on_change(selected)
        this.change_input()
      },
    }
  }

  protected abstract _on_change(selected: Date[]): void

  protected _destroy_picker(): void {
    this._picker?.destroy()
    this._picker = undefined
    if (this._input_host != null) {
      empty(this._input_host)
    }
    if (this._calendar_host != null) {
      empty(this._calendar_host)
    }
  }

  protected _rebuild_picker(): void {
    this._destroy_picker()
    if (this._input_host != null && this._calendar_host != null) {
      this._build_picker(this._input_host)
    }
  }

  protected _build_picker(host: HTMLElement): void {
    const input_el = input({
      type: "text",
      id: this.input_id,
      class: inputs_css.input,
      disabled: this.model.disabled,
    })
    host.append(input_el)
    this._picker = flatpickr(input_el, this.flatpickr_options)
  }

  protected _update_disabled(): void {
    const {disabled} = this.model
    const picker = this._picker
    if (picker != null) {
      picker.input.disabled = disabled
      if (picker.altInput != null) {
        picker.altInput.disabled = disabled
      }
    }
  }

  // https://github.com/flatpickr/flatpickr/pull/2362
  protected _position(self: FlatpickrInstance, custom_el: HTMLElement | undefined): void {
    const positionElement = custom_el ?? self._positionElement

    const calendarHeight = [...self.calendarContainer.children].reduce((acc, child) => acc + bounding_box(child).height, 0)
    const calendarWidth = self.calendarContainer.offsetWidth
    const configPos = this.model.position.split(" ")
    const configPosVertical = configPos[0]
    const configPosHorizontal = configPos.length > 1 ? configPos[1] : null
    // const inputBounds = positionElement.getBoundingClientRect()
    const inputBounds = {
      top: positionElement.offsetTop,
      bottom: positionElement.offsetTop + positionElement.offsetHeight,
      left: positionElement.offsetLeft,
      right: positionElement.offsetLeft + positionElement.offsetWidth,
      width: positionElement.offsetWidth,
    }
    const distanceFromBottom = window.innerHeight - inputBounds.bottom
    const showOnTop =
      configPosVertical === "above" ||
      (configPosVertical !== "below" &&
        distanceFromBottom < calendarHeight &&
        inputBounds.top > calendarHeight)

    // const top =
    //   window.scrollY +
    //   inputBounds.top +
    //   (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2)
    const top = self.config.appendTo != null
      ? inputBounds.top +
        (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2)
      : window.scrollY +
        inputBounds.top +
        (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2)

    self.calendarContainer.classList.toggle("arrowTop", !showOnTop)
    self.calendarContainer.classList.toggle("arrowBottom", showOnTop)

    if (self.config.inline) {
      return
    }

    let left = window.scrollX + inputBounds.left
    let isCenter = false
    let isRight = false

    if (configPosHorizontal === "center") {
      left -= (calendarWidth - inputBounds.width) / 2
      isCenter = true
    } else if (configPosHorizontal === "right") {
      left -= calendarWidth - inputBounds.width
      isRight = true
    }

    self.calendarContainer.classList.toggle("arrowLeft", !isCenter && !isRight)
    self.calendarContainer.classList.toggle("arrowCenter", isCenter)
    self.calendarContainer.classList.toggle("arrowRight", isRight)

    const right =
      window.document.body.offsetWidth -
      (window.scrollX + inputBounds.right)
    const rightMost = left + calendarWidth > window.document.body.offsetWidth
    const centerMost = right + calendarWidth > window.document.body.offsetWidth

    self.calendarContainer.classList.toggle("rightMost", rightMost)

    if (self.config.static) {
      return
    }

    self.calendarContainer.style.top = `${top}px`

    if (!rightMost) {
      self.calendarContainer.style.left = `${left}px`
      self.calendarContainer.style.right = "auto"
    } else if (!centerMost) {
      self.calendarContainer.style.left = "auto"
      self.calendarContainer.style.right = `${right}px`
    } else {
      const css = this.shadow_el.styleSheets[0]
      const bodyWidth = window.document.body.offsetWidth
      const centerLeft = Math.max(0, bodyWidth / 2 - calendarWidth / 2)
      const centerBefore = ".flatpickr-calendar.centerMost:before"
      const centerAfter = ".flatpickr-calendar.centerMost:after"
      const centerIndex = css.cssRules.length
      const centerStyle = `{left:${inputBounds.left}px;right:auto;}`
      self.calendarContainer.classList.toggle("rightMost", false)
      self.calendarContainer.classList.toggle("centerMost", true)
      css.insertRule(`${centerBefore},${centerAfter}${centerStyle}`, centerIndex)
      self.calendarContainer.style.left = `${centerLeft}px`
      self.calendarContainer.style.right = "auto"
    }
  }
}

export namespace PickerBase {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & PrefixSuffixCommon.Props & {
    position: p.Property<CalendarPosition>
    inline:   p.Property<boolean>
  }
}

export interface PickerBase extends PickerBase.Attrs {}

export abstract class PickerBase extends InputWidget {
  declare properties: PickerBase.Props
  declare __view_type__: PickerBaseView

  static {
    this.define<PrefixSuffixCommon.Props>(PrefixSuffixCommon.define)
    this.define<PickerBase.Props>(({Bool}) => {
      return {
        position: [ CalendarPosition, "auto" ],
        inline:   [ Bool, false ],
      }
    })
  }
}
