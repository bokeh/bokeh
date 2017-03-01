import * as DOM from "core/dom";

export interface TextInputProps {
  id: string;
  title: string;
  name: string;
  placeholder: string;
  value: string;
}

export default (props: TextInputProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <input class="bk-widget-form-input" type="text"
        id={props.id} name={props.name} value={props.value} placeholder={props.placeholder} />
    </fragment>
  )
}
