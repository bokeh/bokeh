declare namespace Bokeh {
    export interface IComponent extends IModel {
        disabled?: boolean;
    }
    export interface Component extends Model, IComponent {}
}
