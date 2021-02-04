precision mediump float;

const int butt_cap   = 0;
const int round_cap  = 1;
const int square_cap = 2;

const int miter_join = 0;
const int round_join = 1;
const int bevel_join = 2;

uniform float u_linewidth;
uniform float u_antialias;
uniform float u_join_type;
uniform float u_cap_type;
uniform vec4 u_color;
#ifdef DASHED
uniform sampler2D u_dash_tex;
uniform vec3 u_dash_tex_info;
#endif

varying float v_segment_length;
varying vec2 v_coords;
varying float v_flags;
varying float v_cos_theta_turn_right_start;
varying float v_cos_theta_turn_right_end;
#ifdef DASHED
varying float v_length_so_far;
#endif

float cross_z(in vec2 v0, in vec2 v1)
{
    return v0.x*v1.y - v0.y*v1.x;
}

float point_line_side(in vec2 point, in vec2 start, in vec2 end)
{
    // +ve if point to right of line.
    // Alternatively could do dot product with right_vector.
    return cross_z(point - start, end - start);
}

float point_line_distance(in vec2 point, in vec2 start, in vec2 end)
{
    return point_line_side(point, start, end) / distance(start, end);
}

vec2 right_vector(in vec2 v)
{
    return vec2(v.y, -v.x);
}

float distance_to_alpha(in float dist)
{
    return 1.0 - smoothstep(0.5*(u_linewidth - u_antialias),
                            0.5*(u_linewidth + u_antialias), dist);
}

void main ()
{
    int join_type = int(u_join_type + 0.5);
    int cap_type = int(u_cap_type + 0.5);
    float halfwidth = 0.5*(u_linewidth + u_antialias);

    // Extract flags.
    int flags = int(v_flags + 0.5);
    bool miter_too_large_end = (flags / 8 > 0);
    flags -= 8*int(miter_too_large_end);
    bool miter_too_large_start = (flags / 4 > 0);
    flags -= 4*int(miter_too_large_start);
    bool has_end_cap = (flags / 2 > 0);
    flags -= 2*int(has_end_cap);
    bool has_start_cap = flags > 0;

    float cos_theta_start = abs(v_cos_theta_turn_right_start);
    float turn_right_start = sign(v_cos_theta_turn_right_start);
    float cos_theta_end = abs(v_cos_theta_turn_right_end);
    float turn_right_end = sign(v_cos_theta_turn_right_end);

    float dist = v_coords.y;  // For straight segment, and miter join.

    if (v_coords.x <= 0.5*u_antialias)
    {
        // At start of segment, either cap or join.
        if (has_start_cap)
        {
            if (cap_type == butt_cap)
                dist = max(0.5*u_linewidth - v_coords.x, abs(v_coords.y));
            else if (cap_type == square_cap)
                dist = max(-v_coords.x, abs(v_coords.y));
            else if (v_coords.x <= 0.0)  // cap_type == round_cap
                dist = distance(v_coords, vec2(0, 0));
        }
        else if (join_type == round_join)
        {
            dist = distance(v_coords, vec2(0.0, 0.0));
        }
        else if (join_type == bevel_join ||
                 (join_type == miter_join && miter_too_large_start))
        {
            // In v_coords reference frame (x is along segment, y across).
            vec2 line_start = vec2(0.0, halfwidth*turn_right_start);
            float sin_alpha = cos_theta_start;
            float cos_alpha = sqrt(1.0 - sin_alpha*sin_alpha);
            vec2 line_along = vec2(-turn_right_start*sin_alpha, -cos_alpha);
            dist = max(abs(dist), halfwidth + point_line_distance(v_coords, line_start, line_start+line_along));
        }
        // else a miter join which uses the default dist calculation.
    }
    else if (v_coords.x >= v_segment_length - 0.5*u_antialias)
    {
        // At end of segment, either cap or join.
        if (has_end_cap)
        {
            if (cap_type == butt_cap)
                dist = max(v_coords.x - v_segment_length + 0.5*u_linewidth,
                           abs(v_coords.y));
            else if (cap_type == square_cap)
                dist = max(v_coords.x - v_segment_length, abs(v_coords.y));
            else if (v_coords.x >= v_segment_length)  // cap_type == round_cap
                dist = distance(v_coords, vec2(v_segment_length, 0));
        }
        else if (join_type == round_join)
        {
            dist = distance(v_coords, vec2(v_segment_length, 0));
        }
        else if ((join_type == bevel_join ||
                 (join_type == miter_join && miter_too_large_end)))
        {
            vec2 line_start = vec2(v_segment_length, halfwidth*turn_right_end);
            float sin_alpha = cos_theta_end;
            float cos_alpha = sqrt(1.0 - sin_alpha*sin_alpha);
            vec2 line_along = vec2(sin_alpha*turn_right_end, -cos_alpha);
            dist = max(abs(dist), halfwidth - point_line_distance(v_coords, line_start, line_start+line_along));
        }
        // else a miter join which uses the default dist calculation.
    }

    float alpha = distance_to_alpha(abs(dist));

#ifdef DASHED
    if (u_dash_tex_info.x >= 0.0)  // If have dash.
    {
        float tex_length = u_dash_tex_info.x;
        float tex_offset = u_dash_tex_info.y;
        float tex_scale = u_dash_tex_info.z;

        float distance_along = v_length_so_far + v_coords.x - tex_scale*tex_offset;
        float scaled_length = tex_length*tex_scale;

        float dash_dist =
            tex_scale*texture2D(u_dash_tex,
                                vec2(distance_along / scaled_length, 0.0)).a;

        if (cap_type == butt_cap)
            dash_dist += 0.5*u_linewidth;
        else if (cap_type == round_cap)
            dash_dist = length(vec2(max(0.0, dash_dist), v_coords.y));

        float dash_alpha = distance_to_alpha(dash_dist);

        alpha = min(alpha, dash_alpha);
    }
#endif

    gl_FragColor = vec4(u_color.rgb, u_color.a*alpha);
}
