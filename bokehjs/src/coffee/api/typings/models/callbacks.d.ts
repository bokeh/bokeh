declare namespace Bokeh {
  export interface Callback extends Model, ICallback {}
  export interface ICallback extends IModel {}

  export const OpenURL: { new(attributes?: IOpenURL, options?: ModelOpts): OpenURL };
  export interface OpenURL extends Callback, IOpenURL {}
  export interface IOpenURL extends ICallback {
    url?: string;
  }

  export const CustomJS: { new(attributes?: ICustomJS, options?: ModelOpts): CustomJS };
  export interface CustomJS extends Callback, ICustomJS {}
  export interface ICustomJS extends ICallback {
    args?: Map<Model>;
    code?: string;
  }
}
