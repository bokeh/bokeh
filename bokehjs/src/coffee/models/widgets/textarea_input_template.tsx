import * as DOM from "core/dom";

export interface TextareaInputProps {
  id: string;
  title: string;
  name: string;
  placeholder: string;
  value: string;
  cols: string;
  maxlength: string;
  rows: string;
}

export default (props: TextareaInputProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <textarea class="bk-widget-form-input" id={props.id} name={props.name}
                placeholder={props.placeholder} cols={props.cols} maxlength={props.maxlength}
                rows={props.row}>{props.value}</textarea>
    </fragment>
  )
}
