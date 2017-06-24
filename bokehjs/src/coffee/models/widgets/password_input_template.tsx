import * as DOM from "core/dom";

export interface PasswordInputProps {
  id: string;
  title: string;
  name: string;
  placeholder: string;
}

export default (props: PasswordInputProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <input class="bk-widget-form-input" type="password"
        id={props.id} name={props.name} placeholder={props.placeholder} />
    </fragment>
  )
}
