declare namespace Bokeh {
 interface ViewOptions<ModelType extends Model> {
   model: ModelType;
   id?: string;
   el?: HTMLElement;
  }

  class View<ModelType extends Model> {
    constructor(options?: ViewOptions<ModelType>);

    model: ModelType;
    id: string;
    el: HTMLElement;

    render(): this;
    remove(): this;
  }
}
