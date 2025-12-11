// Marker shader for WebGPU rendering
// Supports circle, rect, and round_rect marker types

// Marker type constants (set via pipeline specialization)
override MARKER_CIRCLE: bool = false;
override MARKER_RECT: bool = false;
override MARKER_ROUND_RECT: bool = false;

// Uniform buffer containing rendering parameters
struct Uniforms {
    canvas_size: vec2f,
    antialias: f32,
    size_hint: f32,
    border_radius: vec4f,
    // Coordinate transform: screen = data * scale + offset
    // For x: sx = x * x_scale + x_offset
    // For y: sy = y * y_scale + y_offset
    x_scale: f32,
    x_offset: f32,
    y_scale: f32,
    y_offset: f32,
    // Radius transform (for data-unit radius)
    radius_scale: f32,
    _pad1: f32,
    _pad2: f32,
    _pad3: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

// Vertex input from quad geometry (per-vertex)
struct VertexInput {
    @location(0) position: vec2f,
}

// Instance data split into separate buffers for efficient partial updates
// Buffer 1: Position - DATA coordinates (only changes when data changes, NOT on pan/zoom)
struct PositionInput {
    @location(1) center: vec2f,  // x, y in data coordinates
}

// Buffer 2: Size - DATA units (only changes when data changes)
struct SizeInput {
    @location(2) size: vec2f,       // width, height (radius * 2 in data units)
}

// Buffer 3: Geometry (changes on data change)
struct GeometryInput {
    @location(3) angle_aux: vec2f,  // angle, aux
}

// Buffer 4: Line properties (changes on visual/selection change)
struct LinePropsInput {
    @location(4) line_props: vec4f, // linewidth, cap, join, show
}

// Buffer 5: Line color (changes on visual change)
struct LineColorInput {
    @location(5) line_color: vec4f,
}

// Buffer 6: Fill color (changes on visual change)
struct FillColorInput {
    @location(6) fill_color: vec4f,
}

// Data passed from vertex to fragment shader
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) v_coords: vec2f,
    @location(1) v_size: vec2f,
    @location(2) v_linewidth: f32,
    @location(3) v_line_color: vec4f,
    @location(4) v_fill_color: vec4f,
}

// Calculate enclosing size for a marker including line width and antialiasing
fn enclosing_size(size: vec2f, linewidth: f32) -> vec2f {
    return size + linewidth + uniforms.antialias;
}

@vertex
fn vertex_main(
    vertex: VertexInput,
    pos_in: PositionInput,
    size_in: SizeInput,
    geom_in: GeometryInput,
    line_props_in: LinePropsInput,
    line_color_in: LineColorInput,
    fill_color_in: FillColorInput
) -> VertexOutput {
    var output: VertexOutput;

    // Extract line properties
    let linewidth_raw = line_props_in.line_props.x;
    let show = line_props_in.line_props.w;

    // Early exit for hidden markers (position off-screen)
    if (show < 0.5 || size_in.size.x < 0.0 || size_in.size.y < 0.0) {
        output.position = vec4f(-2.0, -2.0, 0.0, 1.0);
        return output;
    }

    // Transform data coordinates to screen coordinates on the GPU
    // screen = data * scale + offset
    let screen_center = vec2f(
        pos_in.center.x * uniforms.x_scale + uniforms.x_offset,
        pos_in.center.y * uniforms.y_scale + uniforms.y_offset
    );

    // Transform size from data units to screen units
    // For circle, size is diameter in data units
    let screen_size = size_in.size * uniforms.radius_scale;

    // Determine marker size based on type
    var v_size: vec2f;
    if (MARKER_CIRCLE) {
        // Circle uses width for both dimensions (diameter)
        v_size = vec2f(screen_size.x, screen_size.x);
    } else {
        // Rect and round_rect use width and height
        v_size = screen_size;
    }

    // Adjust line color alpha for thin lines
    var v_linewidth = linewidth_raw;
    var v_line_color = line_color_in.line_color;
    if (v_linewidth < 1.0) {
        v_line_color.a *= v_linewidth;
        v_linewidth = 1.0;
    }

    // Calculate vertex position in local marker space
    let v_coords = vertex.position * enclosing_size(v_size, v_linewidth);

    // Apply rotation
    let angle = geom_in.angle_aux.x;
    let c = cos(-angle);
    let s = sin(-angle);
    let rotation = mat2x2f(c, -s, s, c);
    var pos = screen_center + rotation * v_coords;

    // Convert to normalized device coordinates
    // Add 0.5 pixel offset for crisp rendering
    pos = pos + 0.5;
    pos = pos / uniforms.canvas_size;

    output.position = vec4f(2.0 * pos.x - 1.0, 1.0 - 2.0 * pos.y, 0.0, 1.0);
    output.v_coords = v_coords;
    output.v_size = v_size;
    output.v_linewidth = v_linewidth;
    output.v_line_color = v_line_color;
    output.v_fill_color = fill_color_in.fill_color;

    return output;
}

// Signed distance function for a circle
fn circle_sdf(p: vec2f, radius: f32) -> f32 {
    return length(p) - radius;
}

// Signed distance function for a rectangle
fn rect_sdf(p: vec2f, half_size: vec2f) -> f32 {
    let d = abs(p) - half_size;
    return length(max(d, vec2f(0.0))) + min(max(d.x, d.y), 0.0);
}

// Signed distance function for a rounded rectangle
fn round_rect_sdf(p: vec2f, half_size: vec2f, radius: vec4f) -> f32 {
    // radius.x = top-right, .y = bottom-right, .z = bottom-left, .w = top-left
    var r: vec2f;
    if (p.x > 0.0) {
        if (p.y > 0.0) {
            r = vec2f(radius.x, radius.x);
        } else {
            r = vec2f(radius.y, radius.y);
        }
    } else {
        if (p.y > 0.0) {
            r = vec2f(radius.w, radius.w);
        } else {
            r = vec2f(radius.z, radius.z);
        }
    }
    let q = abs(p) - half_size + r;
    return min(max(q.x, q.y), 0.0) + length(max(q, vec2f(0.0))) - r.x;
}

// Get signed distance based on marker type
fn marker_sdf(p: vec2f, size: vec2f) -> f32 {
    if (MARKER_CIRCLE) {
        return circle_sdf(p, 0.5 * size.x);
    } else if (MARKER_ROUND_RECT) {
        return round_rect_sdf(p, size / 2.0, uniforms.border_radius);
    } else {
        // Default to rect
        return rect_sdf(p, size / 2.0);
    }
}

// Convert distance to alpha using smoothstep for antialiasing
fn distance_to_alpha(dist: f32) -> f32 {
    return 1.0 - smoothstep(-0.5 * uniforms.antialias, 0.5 * uniforms.antialias, dist);
}

// Apply premultiplied alpha
fn premultiply_alpha(color: vec4f, alpha: f32) -> vec4f {
    let a = color.a * alpha;
    return vec4f(color.rgb * a, a);
}

// Blend source over destination (premultiplied alpha)
fn blend_over(src: vec4f, dst: vec4f) -> vec4f {
    return src + (1.0 - src.a) * dst;
}

@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4f {
    // Calculate signed distance from fragment to marker edge
    let dist = marker_sdf(input.v_coords, input.v_size);

    // Calculate fill contribution
    let fill_alpha = distance_to_alpha(dist);
    var color = premultiply_alpha(input.v_fill_color, fill_alpha);

    // Calculate line/stroke contribution
    let line_dist = abs(dist) - 0.5 * input.v_linewidth;
    let line_alpha = distance_to_alpha(line_dist);

    if (line_alpha > 0.0) {
        let line_color = premultiply_alpha(input.v_line_color, line_alpha);
        color = blend_over(line_color, color);
    }

    return color;
}
