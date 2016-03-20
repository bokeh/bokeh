declare namespace Bokeh {
    export interface TileSource extends Model {
        url: string;
        tile_size: Int;

        min_zoom: Int;
        max_zoom: Int;

        extra_url_vars: {[key: string]: string};
        attribution: string;
    }

    export var MercatorTileSource: { new(): MercatorTileSource };
    export interface MercatorTileSource extends TileSource {
        x_origin_offset: number;
        y_origin_offset: number;
        initial_resolution: number;
        wrap_around: boolean;
    }

    export var TMSTileSource: { new(): TMSTileSource };
    export interface TMSTileSource extends MercatorTileSource {}

    export var WMTSTileSource: { new(): WMTSTileSource };
    export interface WMTSTileSource extends MercatorTileSource {}

    export var QUADKEYTileSource: { new(): QUADKEYTileSource };
    export interface QUADKEYTileSource extends MercatorTileSource {}

    export var BBoxTileSource: { new(): BBoxTileSource };
    export interface BBoxTileSource extends MercatorTileSource {
        use_latlon: boolean;
    }
}
