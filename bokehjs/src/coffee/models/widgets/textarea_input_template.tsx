import * as DOM from "core/dom";

export interface TextareaInputProps {
  id: string;
  title: string;
  name: string;
  placeholder: string;
  value: string;
  cols: string;
<<<<<<< HEAD
  max_length: string;
=======
  maxlength: string;
>>>>>>> master
  rows: string;
}

export default (props: TextareaInputProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <textarea class="bk-widget-form-input" id={props.id} name={props.name}
<<<<<<< HEAD
                placeholder={props.placeholder} cols={props.cols} maxlength={props.max_length}
=======
                placeholder={props.placeholder} cols={props.cols} maxlength={props.maxlength}
>>>>>>> master
                rows={props.rows}>{props.value}</textarea>
    </fragment>
  )
}
