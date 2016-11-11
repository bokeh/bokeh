import * as DOM from "../../core/util/dom";

interface RangeSliderProps {
  id: string;
  title?: string;
}

export default (props: RangeSliderProps): HTMLElement => {
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
      <div class="bk-slider-horizontal">
        <input type="text" class="slider" id={props.id}></input>
      </div>
    </div>
  )
}
