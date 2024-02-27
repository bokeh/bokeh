import flatpickr from "flatpickr"

import {InputWidget, InputWidgetView} from "./input_widget"
import type {StyleSheetLike} from "core/dom"
import {input} from "core/dom"
import {CalendarPosition} from "core/enums"
import {bounding_box} from "core/dom"
import {assert} from "core/util/assert"
import type * as p from "core/properties"

import flatpickr_css from "styles/widgets/flatpickr.css"
import * as inputs from "styles/widgets/inputs.css"

export abstract class PickerBaseView extends InputWidgetView {
  declare model: PickerBase

  protected _picker?: flatpickr.Instance
  get picker(): flatpickr.Instance {
    assert(this._picker != null)
    return this._picker
  }

  public override *controls() {
    yield this.picker.altInput ?? this.input_el
  }

  override remove(): void {
    this._picker?.destroy()
    super.remove()
  }

  override stylesheets(): StyleSheetLike[] {
    return [...super.stylesheets(), flatpickr_css]
  }

  override connect_signals(): void {
    super.connect_signals()

    const {inline} = this.model.properties
    this.connect(inline.change, () => this.picker.set("inline", this.model.inline))
  }

  protected get flatpickr_options(): flatpickr.Options.Options {
    return {
      appendTo: this.group_el,
      inline: this.model.inline,
      position: this._position.bind(this),
      onChange: (selected) => {
        this._on_change(selected)
        this.change_input()
      },
    }
  }

  protected abstract _on_change(selected: Date[]): void

  protected _render_input(): HTMLElement {
    return this.input_el = input({type: "text", class: inputs.input, disabled: this.model.disabled})
  }

  override render(): void {
    super.render()
    this._picker?.destroy()

    const options = this.flatpickr_options
    this._picker = flatpickr(this.input_el, options)
  }

  // https://github.com/flatpickr/flatpickr/pull/2362
  protected _position(self: flatpickr.Instance, custom_el: HTMLElement | undefined): void {
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

  export type Props = InputWidget.Props & {
    position: p.Property<CalendarPosition>
    inline:   p.Property<boolean>
  }
}

export interface PickerBase extends PickerBase.Attrs {}

export abstract class PickerBase extends InputWidget {
  declare properties: PickerBase.Props
  declare __view_type__: PickerBaseView

  constructor(attrs?: Partial<PickerBase.Attrs>) {
    super(attrs)
  }

  static {
    this.define<PickerBase.Props>(({Bool}) => {
      return {
        position: [ CalendarPosition, "auto" ],
        inline:   [ Bool, false ],
      }
    })
  }
}
