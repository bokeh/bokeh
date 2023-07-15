precision mediump float;

const int butt_cap   = 0;
const int round_cap  = 1;
const int square_cap = 2;

const int miter_join = 0;
const int round_join = 1;
const int bevel_join = 2;

uniform float u_antialias;
#ifdef DASHED
uniform sampler2D u_dash_tex;
#endif

varying float v_linewidth;
varying vec4 v_line_color;
varying float v_line_cap;
varying float v_line_join;
varying float v_segment_length;
varying vec2 v_coords;
varying float v_flags;
varying float v_cos_turn_angle_start;
varying float v_cos_turn_angle_end;
#ifdef DASHED
varying float v_length_so_far;
varying vec4 v_dash_tex_info;
varying float v_dash_scale;
varying float v_dash_offset;
#endif

#define ONE_MINUS_SMALL (1.0 - 1e-6)

float cross_z(in vec2 v0, in vec2 v1)
{
    return v0.x*v1.y - v0.y*v1.x;
}

vec2 right_vector(in vec2 v)
{
    return vec2(v.y, -v.x);
}

float bevel_join_distance(in vec2 coords, in vec2 other_right, in float sign_turn_right)
{
    // other_right is unit vector facing right of the other (previous or next) segment, in coord reference frame
    float hw = 0.5*v_linewidth;  // Not including antialiasing
    if (other_right.y >= ONE_MINUS_SMALL) {  // other_right.y is -cos(turn_angle)
        // 180 degree turn.
        return abs(hw - v_coords.x);
    }
    else {
        const vec2 segment_right = vec2(0.0, -1.0);
        // corner_right is unit vector bisecting corner facing right, in coord reference frame
        vec2 corner_right = normalize(other_right + segment_right);
        vec2 outside_point = (-hw*sign_turn_right)*segment_right;
        return hw + sign_turn_right*dot(outside_point - coords, corner_right);
    }
}

float cap(in int cap_type, in float x, in float y)
{
    // x is distance along segment in direction away from end of segment,
    // y is distance across segment.
    if (cap_type == butt_cap)
        return max(0.5*v_linewidth - x, abs(y));
    else if (cap_type == square_cap)
        return max(-x, abs(y));
    else  // cap_type == round_cap
        return distance(vec2(min(x, 0.0), y), vec2(0.0, 0.0));
}

float distance_to_alpha(in float dist)
{
    return 1.0 - smoothstep(0.5*(v_linewidth - u_antialias),
                            0.5*(v_linewidth + u_antialias), dist);
}

vec2 turn_angle_to_right_vector(in float cos_turn_angle, in float sign_turn_right)
{
    float sin_turn_angle = sign_turn_right*sqrt(1.0 - cos_turn_angle*cos_turn_angle);
    return vec2(sin_turn_angle, -cos_turn_angle);
}

#ifdef DASHED
float dash_distance(in float x)
{
    // x is in direction of v_coords.x, i.e. along segment.
    float tex_length = v_dash_tex_info.x;
    float tex_offset = v_dash_tex_info.y;
    float tex_dist_min = v_dash_tex_info.z;
    float tex_dist_max = v_dash_tex_info.w;

    // Apply offset.
    x += v_length_so_far - v_dash_scale*tex_offset + v_dash_offset;

    // Interpolate within texture to obtain distance to dash.
    float dist = texture2D(u_dash_tex,
                           vec2(x / (tex_length*v_dash_scale), 0.0)).a;

    // Scale distance within min and max limits.
    dist = tex_dist_min + dist*(tex_dist_max - tex_dist_min);

    return v_dash_scale*dist;
}

mat2 rotation_matrix(in vec2 other_right)
{
    float sin_angle = other_right.x;
    float cos_angle = -other_right.y;
    return mat2(cos_angle, -sin_angle, sin_angle, cos_angle);
}
#endif

void main()
{
    int join_type = int(v_line_join + 0.5);
    int cap_type = int(v_line_cap + 0.5);
    float halfwidth = 0.5*(v_linewidth + u_antialias);
    float half_antialias = 0.5*u_antialias;

    // Extract flags.
    int flags = int(v_flags + 0.5);
    bool turn_right_end = (flags / 32 > 0);
    float sign_turn_right_end = turn_right_end ? 1.0 : -1.0;
    flags -= 32*int(turn_right_end);
    bool turn_right_start = (flags / 16 > 0);
    float sign_turn_right_start = turn_right_start ? 1.0 : -1.0;
    flags -= 16*int(turn_right_start);
    bool miter_too_large_end = (flags / 8 > 0);
    flags -= 8*int(miter_too_large_end);
    bool miter_too_large_start = (flags / 4 > 0);
    flags -= 4*int(miter_too_large_start);
    bool has_end_cap = (flags / 2 > 0);
    flags -= 2*int(has_end_cap);
    bool has_start_cap = flags > 0;

    // Unit vectors to right of previous and next segments in coord reference frame
    vec2 prev_right = turn_angle_to_right_vector(v_cos_turn_angle_start, sign_turn_right_start);
    vec2 next_right = turn_angle_to_right_vector(v_cos_turn_angle_end, sign_turn_right_end);

    float dist = v_coords.y;  // For straight segment, and miter join.

    // Along-segment coords with respect to end of segment, facing inwards
    vec2 end_coords = vec2(v_segment_length, 0.0) - v_coords;

    if (v_coords.x <= half_antialias) {
        // At start of segment, either cap or join.
        if (has_start_cap)
            dist = cap(cap_type, v_coords.x, v_coords.y);
        else if (join_type == round_join) {
            if (v_coords.x <= 0.0)
                dist = distance(v_coords, vec2(0.0, 0.0));
        }
        else {  // bevel or miter join
            if (join_type == bevel_join || miter_too_large_start)
                dist = max(abs(dist), bevel_join_distance(v_coords, prev_right, sign_turn_right_start));
            float prev_sideways_dist = -sign_turn_right_start*dot(v_coords, prev_right);
            dist = max(abs(dist), prev_sideways_dist);
        }
    }

    if (end_coords.x <= half_antialias) {
        if (has_end_cap) {
            dist = max(abs(dist), cap(cap_type, end_coords.x, v_coords.y));
        }
        else if (join_type == bevel_join || miter_too_large_end) {
            // Bevel join at end impacts half antialias distance
            dist = max(abs(dist), bevel_join_distance(end_coords, next_right, sign_turn_right_end));
        }
    }

    float alpha = distance_to_alpha(abs(dist));

#ifdef DASHED
    if (v_dash_tex_info.x >= 0.0) {
        // Dashes in straight segments (outside of joins) are easily calculated.
        dist = dash_distance(v_coords.x);

        vec2 prev_coords = rotation_matrix(prev_right)*v_coords;
        float start_dash_distance = dash_distance(0.0);

        if (!has_start_cap && cap_type == butt_cap) {
            // Outer of start join rendered solid color or not at all depending on whether corner
            // point is in dash or gap, with antialiased ends.
            bool outer_solid = start_dash_distance >= 0.0 && v_coords.x < half_antialias && prev_coords.x > -half_antialias;
            if (outer_solid) {
                // Within solid outer region, antialiased at ends
                float half_aa_dist = dash_distance(half_antialias);
                if (half_aa_dist > 0.0)  // Next dash near, do not want antialiased gap
                    dist = half_aa_dist - v_coords.x + half_antialias;
                else
                    dist = start_dash_distance - v_coords.x;

                half_aa_dist = dash_distance(-half_antialias);
                if (half_aa_dist > 0.0)  // Prev dash nearm do not want antialiased gap
                    dist = min(dist, half_aa_dist + prev_coords.x + half_antialias);
                else
                    dist = min(dist, start_dash_distance + prev_coords.x);
            }
            else {
                // Outer not rendered, antialias ends.
                if (v_coords.x < half_antialias)
                    dist = min(0.0, dash_distance(half_antialias) - half_antialias) + v_coords.x;

                if (prev_coords.x > -half_antialias && prev_coords.x <= half_antialias) {
                    // Antialias from end of previous segment into join
                    float prev_dist = min(0.0, dash_distance(-half_antialias) - half_antialias) - prev_coords.x;
                    // Consider width of previous segment
                    prev_dist = min(prev_dist, 0.5*v_linewidth - abs(prev_coords.y));
                    dist = max(dist, prev_dist);
                }
            }
        }

        if (!has_end_cap && cap_type == butt_cap && end_coords.x < half_antialias) {
            float end_dash_distance = dash_distance(v_segment_length);
            bool increasing = end_dash_distance >= 0.0 && sign_turn_right_end*v_coords.y < 0.0;
            if (!increasing) {
                float half_aa_dist = dash_distance(v_segment_length - half_antialias);
                dist = min(0.0, half_aa_dist - half_antialias) + end_coords.x;
            }
        }

        dist = cap(cap_type, dist, v_coords.y);

        float dash_alpha = distance_to_alpha(dist);
        alpha = min(alpha, dash_alpha);
    }
#endif

    alpha = v_line_color.a*alpha;
    gl_FragColor = vec4(v_line_color.rgb*alpha, alpha);  // Premultiplied alpha.
}
