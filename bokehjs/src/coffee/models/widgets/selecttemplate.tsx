import * as _ from "underscore";
import * as DOM from "../../core/util/dom";

interface SelectProps {
  id: string;
  title: string;
  name: string;
  value: string;
  options: Array<string | [string, string]>;
}

export default (props: SelectProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <select class="bk-widget-form-input" id={props.id} name={props.name}>{
        props.options.map(option => {
          let value, label;
          if (_.isString(option)) {
            value = label  = option
          } else {
            [value, label] = option
          }

          const selected = props.value == value
          return <option selected={selected} value={value}>{label}</option>
        })
      }</select>
    </fragment>
  )
}
