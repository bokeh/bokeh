declare namespace Bokeh {
  export interface Range extends Model, IRange {}
  export interface IRange extends IModel {
    callback?: Callback | ((source: this) => void);
  }

  export const Range1d: {
    new(attributes?: IRange1d, options?: ModelOpts): Range1d;
    (start: number, end: number): Range1d;
  }
  export interface Range1d extends Range {}
  export interface IRange1d extends IRange {
    start?: number;
    end?: number;
    bounds?: Auto | [number, number] /*| [Datetime, Datetime]*/;
  }

  export interface DataRange extends Range, IDataRange {}
  export interface IDataRange extends IRange {
    names?: string[];
    renderers?: Renderer[];
  }

  export const DataRange1d: { new(attributes?: IDataRange1d, options?: ModelOpts): DataRange1d };
  export interface DataRange1d extends DataRange, IDataRange1d {}
  export interface IDataRange1d extends IDataRange {
    range_padding?: number;

    start?: number;
    end?: number;

    bounds?: Auto | [number, number];

    flipped?: boolean;
    follow?: StartEnd;
    follow_interval?: number;
    default_span?: number;
  }

  export const FactorRange: { new(attributes?: IFactorRange, options?: ModelOpts): FactorRange };
  export interface FactorRange extends Range, IFactorRange {}
  export interface IFactorRange extends IRange {
    offset?: number;
    factors?: string[] | Int[];
    bounds?: Auto | string[] | Int[];
  }
}
