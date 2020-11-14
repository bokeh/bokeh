export const fragment_shader: string = `
precision mediump float;

const float PI = 3.14159265358979323846264;
const float THETA = 15.0 * 3.14159265358979323846264/180.0;

uniform sampler2D u_dash_atlas;

uniform vec2 u_linecaps;
uniform float u_miter_limit;
uniform float u_linejoin;
uniform float u_antialias;
uniform float u_dash_phase;
uniform float u_dash_period;
uniform float u_dash_index;
uniform vec2 u_dash_caps;
uniform float u_closed;

varying vec4  v_color;
varying vec2  v_segment;
varying vec2  v_angles;
varying vec2  v_texcoord;
varying vec2  v_miter;
varying float v_length;
varying float v_linewidth;

// Compute distance to cap ----------------------------------------------------
float cap( int type, float dx, float dy, float t, float linewidth )
{
    float d = 0.0;
    dx = abs(dx);
    dy = abs(dy);
    if      (type == 0)  discard;  // None
    else if (type == 1)  d = sqrt(dx*dx+dy*dy);  // Round
    else if (type == 3)  d = (dx+abs(dy));  // Triangle in
    else if (type == 2)  d = max(abs(dy),(t+dx-abs(dy)));  // Triangle out
    else if (type == 4)  d = max(dx,dy);  // Square
    else if (type == 5)  d = max(dx+t,dy);  // Butt
    return d;
}

// Compute distance to join -------------------------------------------------
float join( in int type, in float d, in vec2 segment, in vec2 texcoord, in vec2 miter,
           in float linewidth )
{
    // texcoord.x is distance from start
    // texcoord.y is distance from centerline
    // segment.x and y indicate the limits (as for texcoord.x) for this segment

    float dx = texcoord.x;

    // Round join
    if( type == 1 ) {
        if (dx < segment.x) {
            d = max(d,length( texcoord - vec2(segment.x,0.0)));
            //d = length( texcoord - vec2(segment.x,0.0));
        } else if (dx > segment.y) {
            d = max(d,length( texcoord - vec2(segment.y,0.0)));
            //d = length( texcoord - vec2(segment.y,0.0));
        }
    }
    // Bevel join
    else if ( type == 2 ) {
        if (dx < segment.x) {
            vec2 x = texcoord - vec2(segment.x,0.0);
            d = max(d, max(abs(x.x), abs(x.y)));

        } else if (dx > segment.y) {
            vec2 x = texcoord - vec2(segment.y,0.0);
            d = max(d, max(abs(x.x), abs(x.y)));
        }
        /*  Original code for bevel which does not work for us
        if( (dx < segment.x) ||  (dx > segment.y) )
            d = max(d, min(abs(x.x),abs(x.y)));
        */
    }

    return d;
}

void main()
{
    // If color is fully transparent we just discard the fragment
    if( v_color.a <= 0.0 ) {
        discard;
    }

    // Test if dash pattern is the solid one (0)
    bool solid =  (u_dash_index == 0.0);

    // Test if path is closed
    bool closed = (u_closed > 0.0);

    vec4 color = v_color;
    float dx = v_texcoord.x;
    float dy = v_texcoord.y;
    float t = v_linewidth/2.0-u_antialias;
    float width = 1.0;  //v_linewidth; original code had dashes scale with line width, we do not
    float d = 0.0;

    vec2 linecaps = u_linecaps;
    vec2 dash_caps = u_dash_caps;
    float line_start = 0.0;
    float line_stop = v_length;

    // Apply miter limit; fragments too far into the miter are simply discarded
    if( (dx < v_segment.x) || (dx > v_segment.y) ) {
        float into_miter = max(v_segment.x - dx, dx - v_segment.y);
        if (into_miter > u_miter_limit*v_linewidth/2.0)
          discard;
    }

    // Solid line --------------------------------------------------------------
    if( solid ) {
        d = abs(dy);
        if( (!closed) && (dx < line_start) ) {
            d = cap( int(u_linecaps.x), abs(dx), abs(dy), t, v_linewidth );
        }
        else if( (!closed) &&  (dx > line_stop) ) {
            d = cap( int(u_linecaps.y), abs(dx)-line_stop, abs(dy), t, v_linewidth );
        }
        else {
            d = join( int(u_linejoin), abs(dy), v_segment, v_texcoord, v_miter, v_linewidth );
        }

    // Dash line --------------------------------------------------------------
    } else {
        float segment_start = v_segment.x;
        float segment_stop  = v_segment.y;
        float segment_center= (segment_start+segment_stop)/2.0;
        float freq          = u_dash_period*width;
        float u = mod( dx + u_dash_phase*width, freq);
        vec4 tex = texture2D(u_dash_atlas, vec2(u/freq, u_dash_index)) * 255.0 -10.0;  // conversion to int-like
        float dash_center= tex.x * width;
        float dash_type  = tex.y;
        float _start = tex.z * width;
        float _stop  = tex.a * width;
        float dash_start = dx - u + _start;
        float dash_stop  = dx - u + _stop;

        // Compute extents of the first dash (the one relative to v_segment.x)
        // Note: this could be computed in the vertex shader
        if( (dash_stop < segment_start) && (dash_caps.x != 5.0) ) {
            float u = mod(segment_start + u_dash_phase*width, freq);
            vec4 tex = texture2D(u_dash_atlas, vec2(u/freq, u_dash_index)) * 255.0 -10.0;  // conversion to int-like
            dash_center= tex.x * width;
            //dash_type  = tex.y;
            float _start = tex.z * width;
            float _stop  = tex.a * width;
            dash_start = segment_start - u + _start;
            dash_stop = segment_start - u + _stop;
        }

        // Compute extents of the last dash (the one relatives to v_segment.y)
        // Note: This could be computed in the vertex shader
        else if( (dash_start > segment_stop)  && (dash_caps.y != 5.0) ) {
            float u = mod(segment_stop + u_dash_phase*width, freq);
            vec4 tex = texture2D(u_dash_atlas, vec2(u/freq, u_dash_index)) * 255.0 -10.0;  // conversion to int-like
            dash_center= tex.x * width;
            //dash_type  = tex.y;
            float _start = tex.z * width;
            float _stop  = tex.a * width;
            dash_start = segment_stop - u + _start;
            dash_stop  = segment_stop - u + _stop;
        }

        // This test if the we are dealing with a discontinuous angle
        bool discontinuous = ((dx <  segment_center) && abs(v_angles.x) > THETA) ||
                             ((dx >= segment_center) && abs(v_angles.y) > THETA);
        //if( dx < line_start) discontinuous = false;
        //if( dx > line_stop)  discontinuous = false;

        float d_join = join( int(u_linejoin), abs(dy),
                            v_segment, v_texcoord, v_miter, v_linewidth );

        // When path is closed, we do not have room for linecaps, so we make room
        // by shortening the total length
        if (closed) {
             line_start += v_linewidth/2.0;
             line_stop  -= v_linewidth/2.0;
        }

        // We also need to take antialias area into account
        //line_start += u_antialias;
        //line_stop  -= u_antialias;

        // Check is dash stop is before line start
        if( dash_stop <= line_start ) {
            discard;
        }
        // Check is dash start is beyond line stop
        if( dash_start >= line_stop ) {
            discard;
        }

        // Check if current dash start is beyond segment stop
        if( discontinuous ) {
            // Dash start is beyond segment, we discard
            if( (dash_start > segment_stop) ) {
                discard;
                //gl_FragColor = vec4(1.0,0.0,0.0,.25); return;
            }

            // Dash stop is before segment, we discard
            if( (dash_stop < segment_start) ) {
                discard;  //gl_FragColor = vec4(0.0,1.0,0.0,.25); return;
            }

            // Special case for round caps (nicer with this)
            if( dash_caps.x == 1.0 ) {
                if( (u > _stop) && (dash_stop > segment_stop )  && (abs(v_angles.y) < PI/2.0)) {
                    discard;
                }
            }

            // Special case for round caps  (nicer with this)
            if( dash_caps.y == 1.0 ) {
                if( (u < _start) && (dash_start < segment_start )  && (abs(v_angles.x) < PI/2.0)) {
                    discard;
                }
            }

            // Special case for triangle caps (in & out) and square
            // We make sure the cap stop at crossing frontier
            if( (dash_caps.x != 1.0) && (dash_caps.x != 5.0) ) {
                if( (dash_start < segment_start )  && (abs(v_angles.x) < PI/2.0) ) {
                    float a = v_angles.x/2.0;
                    float x = (segment_start-dx)*cos(a) - dy*sin(a);
                    float y = (segment_start-dx)*sin(a) + dy*cos(a);
                    if( x > 0.0 ) discard;
                    // We transform the cap into square to avoid holes
                    dash_caps.x = 4.0;
                }
            }

            // Special case for triangle caps (in & out) and square
            // We make sure the cap stop at crossing frontier
            if( (dash_caps.y != 1.0) && (dash_caps.y != 5.0) ) {
                if( (dash_stop > segment_stop )  && (abs(v_angles.y) < PI/2.0) ) {
                    float a = v_angles.y/2.0;
                    float x = (dx-segment_stop)*cos(a) - dy*sin(a);
                    float y = (dx-segment_stop)*sin(a) + dy*cos(a);
                    if( x > 0.0 ) discard;
                    // We transform the caps into square to avoid holes
                    dash_caps.y = 4.0;
                }
            }
        }

        // Line cap at start
        if( (dx < line_start) && (dash_start < line_start) && (dash_stop > line_start) ) {
            d = cap( int(linecaps.x), dx-line_start, dy, t, v_linewidth);
        }
        // Line cap at stop
        else if( (dx > line_stop) && (dash_stop > line_stop) && (dash_start < line_stop) ) {
            d = cap( int(linecaps.y), dx-line_stop, dy, t, v_linewidth);
        }
        // Dash cap left - dash_type = -1, 0 or 1, but there may be roundoff errors
        else if( dash_type < -0.5 ) {
            d = cap( int(dash_caps.y), abs(u-dash_center), dy, t, v_linewidth);
            if( (dx > line_start) && (dx < line_stop) )
                d = max(d,d_join);
        }
        // Dash cap right
        else if( dash_type > 0.5 ) {
            d = cap( int(dash_caps.x), abs(dash_center-u), dy, t, v_linewidth);
            if( (dx > line_start) && (dx < line_stop) )
                d = max(d,d_join);
        }
        // Dash body (plain)
        else {// if( dash_type > -0.5 &&  dash_type < 0.5) {
            d = abs(dy);
        }

        // Line join
        if( (dx > line_start) && (dx < line_stop)) {
            if( (dx <= segment_start) && (dash_start <= segment_start)
                && (dash_stop >= segment_start) ) {
                d = d_join;
                // Antialias at outer border
                float angle = PI/2.+v_angles.x;
                float f = abs( (segment_start - dx)*cos(angle) - dy*sin(angle));
                d = max(f,d);
            }
            else if( (dx > segment_stop) && (dash_start <= segment_stop)
                     && (dash_stop >= segment_stop) ) {
                d = d_join;
                // Antialias at outer border
                float angle = PI/2.+v_angles.y;
                float f = abs((dx - segment_stop)*cos(angle) - dy*sin(angle));
                d = max(f,d);
            }
            else if( dx < (segment_start - v_linewidth/2.)) {
                discard;
            }
            else if( dx > (segment_stop + v_linewidth/2.)) {
                discard;
            }
        }
        else if( dx < (segment_start - v_linewidth/2.)) {
            discard;
        }
        else if( dx > (segment_stop + v_linewidth/2.)) {
            discard;
        }
    }

    // Distance to border ------------------------------------------------------
    d = d - t;
    if( d < 0.0 ) {
        gl_FragColor = color;
    } else {
        d /= u_antialias;
        gl_FragColor = vec4(color.rgb, exp(-d*d)*color.a);
    }
}
`
