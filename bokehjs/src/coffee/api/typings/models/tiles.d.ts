declare namespace Bokeh {
export interface TileSource extends Model {
    url: string;
    tile_size: Int;

    min_zoom: Int;
    max_zoom: Int;

    extra_url_vars: {[key: string]: string};
    attribution: string;
}

export interface MercatorTileSource extends TileSource {
    x_origin_offset: number;
    y_origin_offset: number;
    initial_resolution: number;
    wrap_around: boolean;
}

export interface TMSTileSource extends MercatorTileSource {}

export interface WMTSTileSource extends MercatorTileSource {}

export interface QUADKEYTileSource extends MercatorTileSource {}

export interface BBoxTileSource extends MercatorTileSource {
    use_latlon: boolean;
}
}
