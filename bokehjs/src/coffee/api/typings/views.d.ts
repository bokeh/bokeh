declare namespace Bokeh {
 interface ViewOptions<ModelType extends Model> {
   model: ModelType;
   id?: string;
   el?: HTMLElement;
  }

  class BokehView<ModelType extends Model> {
    constructor(options?: ViewOptions<ModelType>);

    model: ModelType;
    id: string;
    el: HTMLElement;

    render(): this;
    remove(): this;
  }

  type View<ModelType extends Model> = BokehView<ModelType>;
}
