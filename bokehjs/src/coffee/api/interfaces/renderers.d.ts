declare namespace Bokeh {
export interface Renderer extends Model {}

export interface DataRenderer extends Renderer {}

export interface TileRenderer extends DataRenderer {
    tile_source: TileSource;

    alpha: Percent;

    x_range_name: string;
    y_range_name: string;

    level: RenderLevel;

    render_parents: boolean;
}

export interface DynamicImageRenderer extends DataRenderer {
    image_source: ImageSource;

    alpha: Percent;

    level: RenderLevel;
    render_parents: boolean;
}

export interface GlyphRenderer extends Renderer {
    data_source: DataSource;

    glyph: Glyph;
    hover_glyph: Glyph;
    selection_glyph: Glyph;
    nonselection_glyph: Glyph;

    x_range_name: string;
    y_range_name: string;

    level: RenderLevel;
}

export interface GuideRenderer extends Renderer {
    bounds: Auto | [number, number];

    x_range_name: string;
    y_range_name: string;
}
}
