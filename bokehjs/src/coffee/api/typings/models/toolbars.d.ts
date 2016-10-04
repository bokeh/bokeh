declare namespace Bokeh {
  export interface ToolbarBase extends LayoutDOM, IToolbarBase {}
  export interface IToolbarBase extends ILayoutDOM {
    logo?: Logo;
    tools?: Array<Tool>;
  }

  export var Toolbar: {
    new(attributes?: IToolbar, options?: ModelOpts): Toolbar;
  }
  export interface Toolbar extends ToolbarBase {}
  export interface IToolbar extends IToolbarBase {}

  export var ToolbarBox: {
    new(attributes?: IToolbarBox, options?: ModelOpts): ToolbarBox;
  }
  export interface ToolbarBox extends ToolbarBase {}
  export interface IToolbarBox extends IToolbarBase {
    toolbar_location?: Location;
    merge_tools?: boolean;
  }
}
