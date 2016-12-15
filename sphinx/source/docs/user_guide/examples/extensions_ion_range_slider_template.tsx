import * as DOM from "core/dom";

interface RangeSliderProps {
  id: string;
  title?: string;
}

export default (props: RangeSliderProps): HTMLElement => {
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
      <div class="bk-slider-horizontal">
        <input type="text" class="slider" id={props.id}></input>
      </div>
    </div>
  )
}
