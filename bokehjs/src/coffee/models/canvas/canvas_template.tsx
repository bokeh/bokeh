import * as DOM from "core/dom";

export interface CanvasProps {
  map: boolean;
}

export default (props: CanvasProps): HTMLElement => {
  return (
    <fragment>
      { props.map && <div class="bk-canvas-map" /> }
      <div class="bk-canvas-events" />
      <div class="bk-canvas-overlays" />
      <canvas class='bk-canvas'></canvas>
    </fragment>
  )
}
