import * as DOM from "core/dom";

export interface NumberInputProps {
  id: string;
  title: string;
  name: string;
}

export default (props: NumberInputProps): HTMLElement => {
  return (
     <div class="bk-spinner-parent">
      <label for={props.id}> {props.title} </label>
      <div class="bk-spinner">
        <input class="bk-widget-form-input"
            id={props.id} name={props.name} />
      </div>
    </div>
  )
}
