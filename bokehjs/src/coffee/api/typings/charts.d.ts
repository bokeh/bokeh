declare namespace Bokeh.Charts {
  interface IChartOpts {
    width?: Int;
    height?: Int;
  }

  interface IPieOpts extends IChartOpts {
    inner_radius?: number;
    outer_radius?: number;
    start_angle?: number;
    end_angle?: number;
    center?: [number, number];
    treshold?: number;
    palette?: Palette | Color[];
    slice_labels?: "labels" | "values" | "percentages";
  }

  function pie(data: {labels: string[], values: number[]}, opts?: IPieOpts): Plot;

  interface IBarOpts extends IChartOpts {
    stacked?: boolean;
    orientation?: "horizontal" | "vertical";
    bar_width?: number;
    palette?: Palette | Color[];
    axis_number_format?: string;
  }

  function bar(data: (string | number)[][], opts?: IBarOpts): Plot;
}
