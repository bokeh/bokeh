import * as DOM from "core/util/dom";

interface TagsInputProps {
  id: string;
  title: string;
  name: string;
  placeholder: string;
}

export default (props: TagsInputProps): HTMLElement => {
  return (
    <fragment>
      <label for={props.id}> {props.title} </label>
      <input class="bk-widget-form-input" type="text"
        id={props.id} name={props.name} placeholder={props.placeholder} />
    </fragment>
  )
}
