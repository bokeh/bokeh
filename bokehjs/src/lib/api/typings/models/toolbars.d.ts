declare namespace Bokeh {
  export interface ToolbarBase extends LayoutDOM, IToolbarBase {}
  export interface IToolbarBase extends ILayoutDOM {
    logo?: Logo;
    tools?: Tool[];
    visible?: boolean;
    autohide?: boolean;
  }

  export const Toolbar: {
    new(attributes?: IToolbar, options?: ModelOpts): Toolbar;
  }
  export interface Toolbar extends ToolbarBase {}
  export interface IToolbar extends IToolbarBase {}

  export const ToolbarBox: {
    new(attributes?: IToolbarBox, options?: ModelOpts): ToolbarBox;
  }
  export interface ToolbarBox extends ToolbarBase {}
  export interface IToolbarBox extends IToolbarBase {
    toolbar_location?: Location;
  }
}
