declare namespace Bokeh {
    export interface MapOptions {
        lat: number;
        lng: number;
        zoom: Int;
    }

    export interface MapPlot extends Plot {}

    export var GMapOptions: { new(): GMapOptions };
    export interface GMapOptions extends MapOptions {
        map_type: MapType;
        styles: any;
    }

    export var GMapPlot: { new(): GMapPlot };
    export interface GMapPlot extends MapPlot {
        map_options: GMapOptions;
    }
}
