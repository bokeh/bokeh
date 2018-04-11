declare namespace Bokeh {
  export interface Scale extends Transform, IScale {}
  export interface IScale extends ITransform {}

  export const LinearScale: { new(attributes?: ILinearScale, options?: ModelOpts): LinearScale };
  export interface LinearScale extends Scale, ILinearScale {}
  export interface ILinearScale extends IScale {}

  export const LogScale: { new(attributes?: ILogScale, options?: ModelOpts): LogScale };
  export interface LogScale extends Scale, ILogScale {}
  export interface ILogScale extends IScale {}

  export const CategoricalScale: { new(attributes?: ICategoricalScale, options?: ModelOpts): CategoricalScale };
  export interface CategoricalScale extends Scale, ICategoricalScale {}
  export interface ICategoricalScale extends IScale {}
}
