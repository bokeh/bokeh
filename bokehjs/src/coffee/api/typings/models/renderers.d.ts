declare namespace Bokeh {
  export interface Renderer extends Model, IRenderer {}
  export interface IRenderer extends IModel {}

  export interface DataRenderer extends Renderer, IDataRenderer {}
  export interface IDataRenderer extends IRenderer {}

  export var TileRenderer: { new(attributes?: ITileRenderer, options?: ModelOpts): TileRenderer };
  export interface TileRenderer extends DataRenderer, ITileRenderer {}
  export interface ITileRenderer extends IDataRenderer {
    tile_source?: TileSource;

    alpha?: Percent;

    x_range_name?: string;
    y_range_name?: string;

    level?: RenderLevel;

    render_parents?: boolean;
  }

  export var DynamicImageRenderer: { new(attributes?: IDynamicImageRenderer, options?: ModelOpts): DynamicImageRenderer };
  export interface DynamicImageRenderer extends DataRenderer, IDynamicImageRenderer {}
  export interface IDynamicImageRenderer extends IDataRenderer {
    image_source?: ImageSource;

    alpha?: Percent;

    level?: RenderLevel;
    render_parents?: boolean;
  }

  export var GlyphRenderer: { new(attributes?: IGlyphRenderer, options?: ModelOpts): GlyphRenderer };
  export interface GlyphRenderer extends Renderer, IGlyphRenderer {}
  export interface IGlyphRenderer extends IRenderer {
    data_source?: DataSource;

    glyph?: Glyph;
    hover_glyph?: Glyph;
    selection_glyph?: Glyph;
    nonselection_glyph?: Glyph;

    x_range_name?: string;
    y_range_name?: string;

    level?: RenderLevel;
  }

  export interface GuideRenderer extends Renderer, IGuideRenderer {}
  export interface IGuideRenderer extends IRenderer, IBackRef {
    bounds?: Auto | [number, number];

    x_range_name?: string;
    y_range_name?: string;
  }
}
