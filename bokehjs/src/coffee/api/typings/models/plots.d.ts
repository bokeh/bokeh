declare namespace Bokeh {
    export var Plot: { new(attributes?: KeyVal, options?: KeyVal): Plot };
    export interface Plot extends Component {
        title: string;

        //title = include[TextProps]
        //outline = include[LineProps]

        x_range: Range;
        y_range: Range;

        extra_x_ranges: {[key: string]: Range};
        extra_y_ranges: {[key: string]: Range};

        x_mapper_type: string;
        y_mapper_type: string;

        renderers: Array<Renderer>;
        tools: Array<Tool>;

        tool_events: ToolEvents;

        left: Array<Renderer>;
        right: Array<Renderer>;
        above: Array<Renderer>;
        below: Array<Renderer>;

        toolbar_location: Location;
        logo: Logo;

        plot_width: Int;
        plot_height: Int;

        background_fill_color: Color;
        border_fill_color: Color;

        min_border_top: Int;
        min_border_bottom: Int;
        min_border_left: Int;
        min_border_right: Int;
        min_border: Int;

        h_symmetry: boolean;
        v_symmetry: boolean;

        lod_factor: Int;
        lod_threshold: Int;
        lod_interval: Int;
        lod_timeout: Int;

        webgl: boolean;

        responsive: boolean;

        add_renderers(...Renderer: Array<Renderer>): void;
        add_layout(obj: Model, place?: Place): void;
        add_glyph(glyph: Glyph, source?: DataSource): GlyphRenderer;
        add_tools(...tools: Array<Tool>): void;
    }

    export interface BackRef {
        plot: Plot;
    }

    export var GridPlot: { new(attributes?: KeyVal, options?: KeyVal): GridPlot };
    export interface GridPlot extends Component {
        children: Array<Array<Plot>>;
        border_space: Int;
        toolbar_location: Location;
    }
}
