import * as DOM from "core/dom";

export interface TextareaInputProps {
  id: string;
  title: string;
  name: string;
  placeholder: string;
  value: string;
  cols: int;
  max_length: int;
  rows: int;
}

export default (props: TextareaInputProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <textarea class="bk-widget-form-input" id={props.id} name={props.name}
                placeholder={props.placeholder} cols={props.cols} maxlength={props.max_length}
                rows={props.rows}>{props.value}</textarea>
    </fragment>
  )
}
