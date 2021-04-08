precision mediump float;

const float SQRT2 = sqrt(2.0);
const float INV_SQRT2 = 1.0 / SQRT2;

const int miter_join = 0;
const int round_join = 1;
const int bevel_join = 2;

uniform float u_antialias;

varying float v_linewidth;
varying vec2 v_size;
varying vec4 v_line_color;
varying vec4 v_fill_color;
varying float v_line_join;
varying vec2 v_coords;

// Distance is zero on edge of marker, +ve outside and -ve inside.
float marker_distance(vec2 p, int line_join)
{
    vec2 dist2 = abs(p) - v_size/2.0;
    float dist = max(dist2.x, dist2.y);

    if (dist2.x > 0.0 && dist2.y > 0.0)
    {
        // Outside of corner.
        if (line_join == round_join)
            dist = length(dist2);
        else if (line_join == bevel_join)
            dist = dot(dist2, vec2(INV_SQRT2, INV_SQRT2)) + 0.5*v_linewidth*(1.0 - INV_SQRT2);
    }

    return dist;
}

float fill_fraction(float dist)
{
    // Return fraction in range 0 (no fill color) to 1 (full fill color).
    return 1.0 - smoothstep(-0.5*u_antialias, 0.5*u_antialias, dist);
}

float line_fraction(float dist)
{
    // Return fraction in range 0 (no line color) to 1 (full line color).
    dist = abs(dist) - 0.5*v_linewidth;
    return 1.0 - smoothstep(-0.5*u_antialias, 0.5*u_antialias, dist);
}

vec4 fractional_color(vec4 color, float fraction)
{
    // Return fraction (in range 0 to 1) of a color, with premultiplied alpha.
    color.a *= fraction;
    color.rgb *= color.a;
    return color;
}

vec4 blend_colors(vec4 src, vec4 dest)
{
    // Blend colors that have premultiplied alpha.
    return (1.0 - src.a)*dest + src;
}

void main()
{
    int line_join = int(v_line_join + 0.5);

    float dist = marker_distance(v_coords, line_join);

    float fill_frac = fill_fraction(dist);
    vec4 color = fractional_color(v_fill_color, fill_frac);

    float line_frac = line_fraction(dist);
    if (line_frac > 0.0)
    {
        vec4 line_color = fractional_color(v_line_color, line_frac);
        color = blend_colors(line_color, color);
    }

    gl_FragColor = color;
}
