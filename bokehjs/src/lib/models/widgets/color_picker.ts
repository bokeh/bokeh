import {logger} from "core/logging"
import * as p from "core/properties"
import {empty, label, input} from 'core/dom'
import {InputWidget, InputWidgetView} from 'models/widgets/input_widget'
import {Color} from 'core/types'


export class ColorPickerView extends InputWidgetView {
    model: ColorPicker

    protected inputEl: HTMLInputElement

    initialize(options: any): void {
        super.initialize(options)
        this.render()
    }

    connect_signals(): void {
        super.connect_signals()
        this.connect(this.model.change, () => this.render())
    }

    render(): void {
        super.render()

        empty(this.el)

        const labelEl = label({for: this.model.id}, this.model.title)
        this.el.appendChild(labelEl)

        this.inputEl = input({
            class: "bk-widget-form-input",
            id: this.model.id,
            name: this.model.name,
            value: this.model.color,
            disabled: this.model.disabled,
            type: "color",
        })

        this.inputEl.append(this.model.color)
        this.inputEl.addEventListener("change", () => this.change_input())
        this.el.appendChild(this.inputEl)

        // TODO - This 35 is a hack we should be able to compute it
        if (this.model.width)
            this.inputEl.style.width = `${this.model.width - 35}px`

        // TODO - This 35 is a hack we should be able to compute it
        if (this.model.height)
            this.inputEl.style.height = `${this.model.height - 35}px`
    }

    change_input(): void {
        const color = this.inputEl.value
        logger.debug(`widget/text_input: value = ${color}`)
        this.model.color = color
        super.change_input()
    }

}

export namespace ColorPicker {
    export interface Attrs extends InputWidget.Attrs {
        color: Color
    }
    export interface Props extends InputWidget.Props {}
}

export interface ColorPicker extends ColorPicker.Attrs {}

export class ColorPicker extends InputWidget {

    static initClass(): void {
        this.prototype.type = "ColorInput"
        this.prototype.default_view = ColorPickerView

        this.define({
            color: [p.Color, "#000000"],
        })
    }
}

ColorPicker.initClass()
