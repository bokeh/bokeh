import * as numbro from "@bokeh/numbro"
import {AbstractSlider, AbstractSliderView} from "./abstract_slider"
import * as p from "core/properties"
import {isString} from "core/util/types"
import {TickFormatter} from "../formatters/tick_formatter"
import {input, div, span,empty} from "core/dom"
import {bk_inline, bk_below} from "styles/mixins"
import {bk_input_group} from "styles/widgets/inputs"
import {uniqueId} from "core/util/string"
import {bk_slider_title,bk_slider_value} from "styles/widgets/sliders"

export class CategorySliderView extends AbstractSliderView {
  model: CategorySlider

 

 
  render(){
   
    
   
    this.model.value = this.model.values[0];
    const group = div({class: [bk_input_group,  bk_inline]})
  

    const name = uniqueId()
    const {value, labels} = this.model

    for (let i = 0; i < labels.length; i++) {
      const radio = input({type: `radio`, name, value: `${i}`})
      radio.addEventListener("change", () => this.change_active(i))

      if (this.model.disabled)
        radio.disabled = true
      if (i == value)
        radio.checked = true

      const label_el = div({class:[bk_input_group]}, radio, span({class:[bk_below]}, labels[i]))
      group.appendChild(label_el)
    }
    this.title_el = div({class: bk_slider_title})
    //this.title_el.appendChild(span({class: bk_slider_value}, this.model.value))
    //this.group_el = div({class: bk_input_group}, this.title_el, group)
    this.el.appendChild(div({class:bk_input_group},"TITULO",group));
    
  }
  change_active(i: number): void {
    this.model.value = this.model.values[i]
    empty(this.title_el)
    this.title_el.appendChild(span({class: bk_slider_value}, this.model.value))

  }
}

export namespace CategorySlider {
  export type Attrs = p.AttrsOf<Props>

  export type Props = AbstractSlider.Props & {
    labels : p.Property<string[]>,
    values : p.Property<any[]>
  }
}

export interface CategorySlider extends CategorySlider.Attrs {}

export class CategorySlider extends AbstractSlider {
  properties: CategorySlider.Props

  constructor(attrs?: Partial<CategorySlider.Attrs>) {
    super(attrs)
  }

  static init_CategorySlider(): void {
    this.prototype.default_view = CategorySliderView

    this.define<CategorySlider.Props>({
      labels :         [p.Array,            []],
      values:          [ p.Array,              []       ]
     
    })
  }

  behaviour = "tap" as "tap"
  connected = [true, false]

  protected _formatter(value: number, format: string | TickFormatter): string {
    if (isString(format)){
      return numbro.format(value, format)
    } else {
      return format.doFormat([value], {loc: 0})[0]
    }
  }
}
