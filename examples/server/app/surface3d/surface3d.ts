// This file contains the JavaScript (TypeScript) implementation
// for a Bokeh custom extension. The "surface3d.py" contains the
// python counterpart.
//
// This custom model wraps one part of the third-party vis.js library:
//
//     http://visjs.org/index.html
//
// Making it easy to hook up python data analytics tools (NumPy, SciPy,
// Pandas, etc.) to web presentations using the Bokeh server.

import {LayoutDOM, LayoutDOMView} from "models/layouts/layout_dom"
import {ColumnDataSource} from "models/sources/column_data_source"
import * as p from "core/properties"

declare namespace vis {
  class Graph3d {
    constructor(el: HTMLElement | DocumentFragment, data: object, OPTIONS: object)
    setData(data: vis.DataSet): void
  }

  class DataSet {
    add(data: unknown): void
  }
}

// This defines some default options for the Graph3d feature of vis.js
// See: https://visjs.github.io/vis-graph3d/examples/ for more details. This
// JS object should match the Python default value.
const OPTIONS = {
  width: '600px',
  height: '600px',
  style: 'surface',
  showPerspective: true,
  showGrid: true,
  keepAspectRatio: true,
  verticalRatio: 1.0,
  legendLabel: 'stuff',
  cameraPosition: {
    horizontal: -0.35,
    vertical: 0.22,
    distance: 1.8,
  },
}

// To create custom model extensions that will render on to the HTML canvas or
// into the DOM, we must create a View subclass for the model. In this case we
// will subclass from the existing BokehJS ``LayoutDOMView``, corresponding to our.
export class Surface3dView extends LayoutDOMView {
  model: Surface3d

  private _graph: vis.Graph3d

  get child_models(): LayoutDOM[] {
    return []
  }

  override render(): void {
    super.render()
    // Create a new Graph3s using the vis.js API. This assumes the vis.js has
    // already been loaded (e.g. in a custom app template). In the future Bokeh
    // models will be able to specify and load external scripts automatically.
    //
    // Views create <div> elements by default, accessible as @el. Many
    // Bokeh views ignore this default <div>, and instead do things like draw
    // to the HTML canvas. In this case though, we use the <div> to attach a
    // Graph3d to the DOM.
    this._graph = new vis.Graph3d(this.shadow_el, this.get_data(), this.model.options)
  }

  override connect_signals(): void {
    super.connect_signals()
    // Set listener so that when the Bokeh data source has a change
    // event, we can process the new data
    this.connect(this.model.data_source.change, () => this._graph.setData(this.get_data()))
  }

  // This is the callback executed when the Bokeh data has an change (e.g. when
  // the server updates the data). It's basic function is simply to adapt the
  // Bokeh data source to the vis.js DataSet format
  get_data(): vis.DataSet {
    const data = new vis.DataSet()
    const source = this.model.data_source
    for (let i = 0; i < source.get_length()!; i++) {
      data.add({
        x: source.data[this.model.x][i],
        y: source.data[this.model.y][i],
        z: source.data[this.model.z][i],
      })
    }
    return data
  }
}

// We must also create a corresponding JavaScript model subclass to
// correspond to the python Bokeh model subclass. In this case, since we want
// an element that can position itself in the DOM according to a Bokeh layout,
// we subclass from ``LayoutDOM``

export namespace Surface3d {
  export type Attrs = p.AttrsOf<Props>

  export type Props = LayoutDOM.Props & {
    x: p.Property<string>
    y: p.Property<string>
    z: p.Property<string>
    data_source: p.Property<ColumnDataSource>
    options: p.Property<{[key: string]: unknown}>
  }
}

export interface Surface3d extends Surface3d.Attrs {}

export class Surface3d extends LayoutDOM {
  properties: Surface3d.Props
  __view_type__: Surface3dView

  constructor(attrs?: Partial<Surface3d.Attrs>) {
    super(attrs)
  }

  // The ``__name__`` class attribute should generally match exactly the name
  // of the corresponding Python class. Note that if using TypeScript, this
  // will be automatically filled in during compilation, so except in some
  // special cases, this shouldn't be generally included manually, to avoid
  // typos, which would prohibit serialization/deserialization of this model.
  static __name__ = "Surface3d"

  static {
    // This is usually boilerplate. In some cases there may not be a view.
    this.prototype.default_view = Surface3dView

    // The @define block adds corresponding "properties" to the JS model. These
    // should basically line up 1-1 with the Python model class. Most property
    // types have counterparts, e.g. ``bokeh.core.properties.String`` will be
    // ``p.String`` in the JS implementation. Where the JS type system is not yet
    // as rich, you can use ``p.Any`` as a "wildcard" property type.
    this.define<Surface3d.Props>(({Unknown, Str, Dict, Ref}) => ({
      x:           [ Str ],
      y:           [ Str ],
      z:           [ Str ],
      data_source: [ Ref(ColumnDataSource) ],
      options:     [ Dict(Unknown), OPTIONS ],
    }))
  }
}
