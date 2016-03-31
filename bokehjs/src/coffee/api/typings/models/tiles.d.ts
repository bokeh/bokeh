declare namespace Bokeh {
    export interface TileSource extends Model, ITileSource {}
    export interface ITileSource extends IModel {
        url?: string;
        tile_size?: Int;

        min_zoom?: Int;
        max_zoom?: Int;

        extra_url_vars?: {[key: string]: string};
        attribution?: string;
    }

    export var MercatorTileSource: { new(attributes?: IMercatorTileSource, options?: KeyVal): MercatorTileSource };
    export interface MercatorTileSource extends TileSource, IMercatorTileSource {}
    export interface IMercatorTileSource extends ITileSource {
        x_origin_offset?: number;
        y_origin_offset?: number;
        initial_resolution?: number;
        wrap_around?: boolean;
    }

    export var TMSTileSource: { new(attributes?: ITMSTileSource, options?: KeyVal): TMSTileSource };
    export interface TMSTileSource extends MercatorTileSource, ITMSTileSource {}
    export interface ITMSTileSource extends IMercatorTileSource {}

    export var WMTSTileSource: { new(attributes?: IWMTSTileSource, options?: KeyVal): WMTSTileSource };
    export interface WMTSTileSource extends MercatorTileSource, IWMTSTileSource {}
    export interface IWMTSTileSource extends IMercatorTileSource {}

    export var QUADKEYTileSource: { new(attributes?: IQUADKEYTileSource, options?: KeyVal): QUADKEYTileSource };
    export interface QUADKEYTileSource extends MercatorTileSource, IQUADKEYTileSource {}
    export interface IQUADKEYTileSource extends IMercatorTileSource {}

    export var BBoxTileSource: { new(attributes?: IBBoxTileSource, options?: KeyVal): BBoxTileSource };
    export interface BBoxTileSource extends MercatorTileSource, IBBoxTileSource {}
    export interface IBBoxTileSource extends IMercatorTileSource {
        use_latlon?: boolean;
    }
}
