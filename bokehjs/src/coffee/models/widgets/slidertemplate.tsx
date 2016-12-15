import * as DOM from "../../core/util/dom";

interface SliderProps {
  id: string;
  title?: string;
  orientation: "horizontal" | "vertical";
}

export default (props: SliderProps): HTMLElement => {
  let title, value;
  if (props.title != null) {
    if (props.title.length != 0) {
      title = <label for={props.id}> {props.title}: </label>
    }
    value = <input type="text" id={props.id} readonly />
  }

  return (
    <div class="bk-slider-parent">
      {title}
      {value}
      <div class={`bk-slider-${props.orientation}`}>
        <div class="slider" id={props.id}></div>
      </div>
    </div>
  )
}
