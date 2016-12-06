import * as _ from "underscore";
import * as DOM from "../../core/util/dom";

interface MultiSelectProps {
  id: string;
  title: string;
  name: string;
  value: Array<string>;
  options: Array<string | [string, string]>;
}

export default (props: MultiSelectProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <select multiple class="bk-widget-form-input" id={props.id} name={props.name}>{
        props.options.map(option => {
          let value, label;
          if (_.isString(option)) {
            value = label  = option
          } else {
            [value, label] = option
          }

          const selected = props.value.indexOf(value) > -1
          return <option selected={selected} value={value}>{label}</option>
        })
      }</select>
    </fragment>
  )
}
