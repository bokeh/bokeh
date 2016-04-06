declare namespace Bokeh {
    export interface IBackRef {
        plot?: Plot;
    }

    export interface PlotView extends View<Plot> {
        resize_width_height(use_width: boolean, use_height: boolean, maintain_ar?: boolean,
                            width?: number, height?: number): void;
    }

    export var Plot: { new(attributes?: IPlot, options?: ModelOpts): Plot };
    export interface Plot extends Component, IPlot {
        add_renderers(...Renderer: Array<Renderer>): void;
        add_layout(obj: Model, place?: Place): void;
        add_glyph(glyph: Glyph, source?: DataSource, attrs?: ModelOpts): GlyphRenderer;
        add_tools(...tools: Array<Tool>): void;
    }
    export interface IPlot extends IBasePlot {
        x_range?: Range;
        y_range?: Range;

        tools?: Array<Tool>;
    }
    export interface IBasePlot extends IComponent {
        title?: string;

        // {{{ title = include[TextProps]
        title_text_font?: string;
        title_text_font_size?: FontSize;
        title_text_font_style?: FontStyle;
        title_text_color?: Color;
        title_text_alpha?: Percent;
        title_text_align?: TextAlign;
        title_text_baseline?: TextBaseline;
        // }}}

        // {{{ outline = include[LineProps]
        outline_line_color?: Color;
        outline_line_width?: number;
        outline_line_alpha?: Percent;
        outline_line_join?: LineJoin;
        outline_line_cap?: LineCap;
        outline_line_dash?: DashPattern;
        outline_line_dash_offset?: Int;
        // }}}

        extra_x_ranges?: Map<Range>;
        extra_y_ranges?: Map<Range>;

        x_mapper_type?: Auto | "log";
        y_mapper_type?: Auto | "log";

        renderers?: Array<Renderer>;

        tool_events?: ToolEvents;

        left?: Array<Renderer>;
        right?: Array<Renderer>;
        above?: Array<Renderer>;
        below?: Array<Renderer>;

        toolbar_location?: Location;
        logo?: Logo;

        plot_width?: Int;
        plot_height?: Int;

        background_fill_color?: Color;
        border_fill_color?: Color;

        min_border_top?: Int;
        min_border_bottom?: Int;
        min_border_left?: Int;
        min_border_right?: Int;
        min_border?: Int;

        h_symmetry?: boolean;
        v_symmetry?: boolean;

        lod_factor?: Int;
        lod_threshold?: Int;
        lod_interval?: Int;
        lod_timeout?: Int;

        webgl?: boolean;

        responsive?: boolean;
    }

    export var GridPlot: { new(attributes?: IGridPlot, options?: ModelOpts): GridPlot };
    export interface GridPlot extends Component, IGridPlot {}
    export interface IGridPlot extends IComponent {
        children?: Array<Array<Plot>>;
        border_space?: Int;
        toolbar_location?: Location;
    }
}
