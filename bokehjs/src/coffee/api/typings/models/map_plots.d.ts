declare namespace Bokeh {
    export interface MapOptions {
        lat: number;
        lng: number;
        zoom: Int;
    }

    export interface MapPlot extends Plot {}

    export var GMapOptions: { new(attributes?: KeyVal, options?: KeyVal): GMapOptions };
    export interface GMapOptions extends MapOptions {
        map_type: MapType;
        styles: any;
    }

    export var GMapPlot: { new(attributes?: KeyVal, options?: KeyVal): GMapPlot };
    export interface GMapPlot extends MapPlot {
        map_options: GMapOptions;
    }
}
