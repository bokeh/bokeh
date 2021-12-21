import flatpickr from "flatpickr"

import {InputWidget, InputWidgetView} from "./input_widget"
import {input} from "core/dom"
import {CalendarPosition} from "core/enums"
import * as p from "core/properties"
import {isString} from "core/util/types"

import * as inputs from "styles/widgets/inputs.css"
import flatpickr_css from "styles/widgets/flatpickr.css"

type DateStr = string
type DatesList = (DateStr | [DateStr, DateStr])[]

function _convert_date_list(value: DatesList): flatpickr.Options.DateLimit[] {
  const result: flatpickr.Options.DateLimit[] = []
  for (const item of value) {
    if (isString(item))
      result.push(item)
    else {
      const [from, to] = item
      result.push({from, to})
    }
  }
  return result
}

export class DatePickerView extends InputWidgetView {
  override model: DatePicker

  private _picker?: flatpickr.Instance

  override connect_signals(): void {
    super.connect_signals()

    const {value, min_date, max_date, disabled_dates, enabled_dates, inline} = this.model.properties
    this.connect(value.change, () => this._picker?.setDate(this.model.value))
    this.connect(min_date.change, () => this._picker?.set("minDate", this.model.min_date))
    this.connect(max_date.change, () => this._picker?.set("maxDate", this.model.max_date))
    this.connect(disabled_dates.change, () => {
      const {disabled_dates} = this.model
      this._picker?.set("disable", disabled_dates != null ? _convert_date_list(disabled_dates) : undefined)
    })
    this.connect(enabled_dates.change, () => {
      const {enabled_dates} = this.model
      this._picker?.set("enable", enabled_dates != null ? _convert_date_list(enabled_dates) : undefined)
    })
    this.connect(inline.change, () => this._picker?.set("inline", this.model.inline))
  }

  override remove(): void {
    this._picker?.destroy()
    super.remove()
  }

  override styles(): string[] {
    return [...super.styles(), flatpickr_css]
  }

  override render(): void {
    if (this._picker != null)
      return

    super.render()

    this.input_el = input({type: "text", class: inputs.input, disabled: this.model.disabled})
    this.group_el.appendChild(this.input_el)

    const options: flatpickr.Options.Options = {
      appendTo: this.group_el,
      positionElement: this.input_el,
      defaultDate: this.model.value,
      inline: this.model.inline,
      position: this._position.bind(this),
      onChange: (selected_dates, date_string, instance) => this._on_change(selected_dates, date_string, instance),
    }

    const {min_date, max_date, disabled_dates, enabled_dates} = this.model
    if (min_date != null)
      options.minDate = min_date
    if (max_date != null)
      options.maxDate = max_date
    if (disabled_dates != null)
      options.disable = _convert_date_list(disabled_dates)
    if (enabled_dates != null)
      options.enable = _convert_date_list(enabled_dates)

    this._picker = flatpickr(this.input_el, options)
  }

  protected _on_change(_selected_dates: Date[], date_string: string, _instance: flatpickr.Instance): void {
    this.model.value = date_string
    this.change_input()
  }

  // https://github.com/flatpickr/flatpickr/pull/2362
  protected _position(self: flatpickr.Instance, custom_el: HTMLElement | undefined): void {
    const positionElement = custom_el ?? self._positionElement

    const calendarHeight = Array.prototype.reduce.call(
      self.calendarContainer.children,
        ((acc: number, child: HTMLElement) => acc + child.offsetHeight) as any,
        0
    ) as number
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
    //   window.pageYOffset +
    //   inputBounds.top +
    //   (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2)
    const top = self.config.appendTo
      ? inputBounds.top +
        (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2)
      : window.pageYOffset +
        inputBounds.top +
        (!showOnTop ? positionElement.offsetHeight + 2 : -calendarHeight - 2)

    self.calendarContainer.classList.toggle("arrowTop", !showOnTop)
    self.calendarContainer.classList.toggle("arrowBottom", showOnTop)

    if (self.config.inline) return

    let left = window.pageXOffset + inputBounds.left
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
      (window.pageXOffset + inputBounds.right)
    const rightMost = left + calendarWidth > window.document.body.offsetWidth
    const centerMost = right + calendarWidth > window.document.body.offsetWidth

    self.calendarContainer.classList.toggle("rightMost", rightMost)

    if (self.config.static) return

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
      css.insertRule(
        `${centerBefore},${centerAfter}${centerStyle}`,
        centerIndex
      )
      self.calendarContainer.style.left = `${centerLeft}px`
      self.calendarContainer.style.right = "auto"
    }
  }
}

export namespace DatePicker {
  export type Attrs = p.AttrsOf<Props>

  export type Props = InputWidget.Props & {
    value:          p.Property<string>
    min_date:       p.Property<string | null>
    max_date:       p.Property<string | null>
    disabled_dates: p.Property<DatesList | null>
    enabled_dates:  p.Property<DatesList | null>
    position:       p.Property<CalendarPosition>
    inline:         p.Property<boolean>
  }
}

export interface DatePicker extends DatePicker.Attrs {}

export class DatePicker extends InputWidget {
  override properties: DatePicker.Props
  override __view_type__: DatePickerView

  constructor(attrs?: Partial<DatePicker.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = DatePickerView

    this.define<DatePicker.Props>(({Boolean, String, Array, Tuple, Or, Nullable}) => {
      const DateStr = String
      const DatesList = Array(Or(DateStr, Tuple(DateStr, DateStr)))
      return {
        value:          [ String ],
        min_date:       [ Nullable(String), null ],
        max_date:       [ Nullable(String), null ],
        disabled_dates: [ Nullable(DatesList), null ],
        enabled_dates:  [ Nullable(DatesList), null ],
        position:       [ CalendarPosition, "auto" ],
        inline:         [ Boolean, false ],
      }
    })
  }
}
