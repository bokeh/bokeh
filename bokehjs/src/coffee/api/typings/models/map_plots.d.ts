declare namespace Bokeh {
  export interface MapOptions {
    lat?: number;
    lng?: number;
    zoom?: Int;
  }

  export interface GMapOptions extends MapOptions {
    map_type?: MapType;
    styles?: any;
  }

  export interface MapPlot extends Plot, IMapPlot {}
  export interface IMapPlot extends IPlot {}

  export const GMapPlot: { new(attributes?: IGMapPlot, options?: ModelOpts): GMapPlot };
  export interface GMapPlot extends MapPlot, IGMapPlot {}
  export interface IGMapPlot extends IMapPlot {
    map_options?: GMapOptions;
    api_key?: string;
  }
}
