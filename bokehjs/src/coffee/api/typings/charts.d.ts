declare namespace Bokeh.Charts {
    //var Chart: { new(attributes?: IChart, options?: ModelOpts): Chart };
    //export interface IChart extends IBasePlot {



    interface IPie {
      inner_radius?: number;
      outer_radius?: number;
      start_angle?: number;
      end_angle?: number;
      center?: [number, number];
      treshold?: number;
      palette?: Palette | Array<Color>;
      slice_labels?: "labels" | "values" | "percentages";
    }

    //function pie(data: Array<[string, number]>, opts: IPie): Plot;
    function pie(data: {labels: Array<string>, values: Array<number>}, opts: IPie): Plot;



    /*
    function area(): Chart;
    function bar(): Chart;
    function boxplot(): Chart;
    function chord(): Chart;
    function donut(): Chart;
    function dot(): Chart;
    function heatmap(): Chart;
    function histogram(): Chart;
    function horizon(): Chart;
    function line(): Chart;
    function scatter(): Chart;
    function step(): Chart;
    function timeseries(): Chart;
    */
}
