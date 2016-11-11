import * as DOM from "../../core/util/dom";

interface SliderProps {
  id: string;
  title?: string;
  orientation: "horizontal" | "vertical";
}

export default (props: SliderProps): HTMLElement => {
  let title;
  if (props.title != null) {
    title = <fragment>
      props.title.length != 0 && <label for={props.id}> {props.title}: </label>
      <input type="text" id={props.id} readonly />
    </fragment>
  }

  return (
    <div class="bk-slider-parent">
      {title}
      <div class={`bk-slider-${props.orientation}`}>
        <div class="slider" id={props.id}></div>
      </div>
    </div>
  )
}
