import {SelectToolView} from "../gestures/select_tool"

export interface BkEv {
  bokeh: {
    sx: number
    sy: number
  }
  srcEvent: {
    shiftKey?: boolean
  }
  keyCode: number
  timeStamp: number
}

export abstract class EditToolView extends SelectToolView {

  // this is executed when the pan/drag event starts
  _map_drag(sx: number[], sy: number[]) {
    const frame = this.plot_model.frame;

    if (!frame.bbox.contains(sx, sy)) {
      return null;
    }

    const x = frame.xscales['default'].invert(sx);
    const y = frame.yscales['default'].invert(sy);
    return [x, y];
  }

  _select_event(e: BkEv, append: boolean) {
    let did_hit;
    const {sx, sy} = e.bokeh;
    const geometry = {
      type: 'point',
      sx,
      sy
    };
    const renderers_by_source = this._computed_renderers_by_data_source();
    for (let _ in renderers_by_source) {
      var sm;
      const renderers = renderers_by_source[_];
      if (this.model.source) {
        sm = this.model.source.selection_manager;
      } else {
        sm = this.model.renderers[0].data_source.selection_manager;
      }
      const r_views = (Array.from(renderers).map((r) => this.plot_view.renderer_views[r.id]));
      did_hit = sm.select(r_views, geometry, true, append);
    }
    return did_hit;
  }
}
