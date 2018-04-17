export const vertex_shader: string = `
precision mediump float;

const float PI = 3.14159265358979323846264;
const float THETA = 15.0 * 3.14159265358979323846264/180.0;

uniform float u_pixel_ratio;
uniform vec2 u_canvas_size, u_offset;
uniform vec2 u_scale_aspect;
uniform float u_scale_length;

uniform vec4 u_color;
uniform float u_antialias;
uniform float u_length;
uniform float u_linewidth;
uniform float u_dash_index;
uniform float u_closed;

attribute vec2 a_position;
attribute vec4 a_tangents;
attribute vec2 a_segment;
attribute vec2 a_angles;
attribute vec2 a_texcoord;

varying vec4  v_color;
varying vec2  v_segment;
varying vec2  v_angles;
varying vec2  v_texcoord;
varying vec2  v_miter;
varying float v_length;
varying float v_linewidth;

float cross(in vec2 v1, in vec2 v2)
{
    return v1.x*v2.y - v1.y*v2.x;
}

float signed_distance(in vec2 v1, in vec2 v2, in vec2 v3)
{
    return cross(v2-v1,v1-v3) / length(v2-v1);
}

void rotate( in vec2 v, in float alpha, out vec2 result )
{
    float c = cos(alpha);
    float s = sin(alpha);
    result = vec2( c*v.x - s*v.y,
                   s*v.x + c*v.y );
}

void main()
{
    bool closed = (u_closed > 0.0);

    // Attributes and uniforms to varyings
    v_color = u_color;
    v_linewidth = u_linewidth;
    v_segment = a_segment * u_scale_length;
    v_length = u_length * u_scale_length;

    // Scale to map to pixel coordinates. The original algorithm from the paper
    // assumed isotropic scale. We obviously do not have this.
    vec2 abs_scale_aspect = abs(u_scale_aspect);
    vec2 abs_scale = u_scale_length * abs_scale_aspect;

    // Correct angles for aspect ratio
    vec2 av;
    av = vec2(1.0, tan(a_angles.x)) / abs_scale_aspect;
    v_angles.x = atan(av.y, av.x);
    av = vec2(1.0, tan(a_angles.y)) / abs_scale_aspect;
    v_angles.y = atan(av.y, av.x);

    // Thickness below 1 pixel are represented using a 1 pixel thickness
    // and a modified alpha
    v_color.a = min(v_linewidth, v_color.a);
    v_linewidth = max(v_linewidth, 1.0);

    // If color is fully transparent we just will discard the fragment anyway
    if( v_color.a <= 0.0 ) {
        gl_Position = vec4(0.0,0.0,0.0,1.0);
        return;
    }

    // This is the actual half width of the line
    float w = ceil(u_antialias+v_linewidth)/2.0;

    vec2 position = (a_position + u_offset) * abs_scale;

    vec2 t1 = normalize(a_tangents.xy * abs_scale_aspect);  // note the scaling for aspect ratio here
    vec2 t2 = normalize(a_tangents.zw * abs_scale_aspect);
    float u = a_texcoord.x;
    float v = a_texcoord.y;
    vec2 o1 = vec2( +t1.y, -t1.x);
    vec2 o2 = vec2( +t2.y, -t2.x);

    // This is a join
    // ----------------------------------------------------------------
    if( t1 != t2 ) {
        float angle = atan (t1.x*t2.y-t1.y*t2.x, t1.x*t2.x+t1.y*t2.y);  // Angle needs recalculation for some reason
        vec2 t  = normalize(t1+t2);
        vec2 o  = vec2( + t.y, - t.x);

        if ( u_dash_index > 0.0 )
        {
            // Broken angle
            // ----------------------------------------------------------------
            if( (abs(angle) > THETA) ) {
                position += v * w * o / cos(angle/2.0);
                float s = sign(angle);
                if( angle < 0.0 ) {
                    if( u == +1.0 ) {
                        u = v_segment.y + v * w * tan(angle/2.0);
                        if( v == 1.0 ) {
                            position -= 2.0 * w * t1 / sin(angle);
                            u -= 2.0 * w / sin(angle);
                        }
                    } else {
                        u = v_segment.x - v * w * tan(angle/2.0);
                        if( v == 1.0 ) {
                            position += 2.0 * w * t2 / sin(angle);
                            u += 2.0*w / sin(angle);
                        }
                    }
                } else {
                    if( u == +1.0 ) {
                        u = v_segment.y + v * w * tan(angle/2.0);
                        if( v == -1.0 ) {
                            position += 2.0 * w * t1 / sin(angle);
                            u += 2.0 * w / sin(angle);
                        }
                    } else {
                        u = v_segment.x - v * w * tan(angle/2.0);
                        if( v == -1.0 ) {
                            position -= 2.0 * w * t2 / sin(angle);
                            u -= 2.0*w / sin(angle);
                        }
                    }
                }
                // Continuous angle
                // ------------------------------------------------------------
            } else {
                position += v * w * o / cos(angle/2.0);
                if( u == +1.0 ) u = v_segment.y;
                else            u = v_segment.x;
            }
        }

        // Solid line
        // --------------------------------------------------------------------
        else
        {
            position.xy += v * w * o / cos(angle/2.0);
            if( angle < 0.0 ) {
                if( u == +1.0 ) {
                    u = v_segment.y + v * w * tan(angle/2.0);
                } else {
                    u = v_segment.x - v * w * tan(angle/2.0);
                }
            } else {
                if( u == +1.0 ) {
                    u = v_segment.y + v * w * tan(angle/2.0);
                } else {
                    u = v_segment.x - v * w * tan(angle/2.0);
                }
            }
        }

    // This is a line start or end (t1 == t2)
    // ------------------------------------------------------------------------
    } else {
        position += v * w * o1;
        if( u == -1.0 ) {
            u = v_segment.x - w;
            position -= w * t1;
        } else {
            u = v_segment.y + w;
            position += w * t2;
        }
    }

    // Miter distance
    // ------------------------------------------------------------------------
    vec2 t;
    vec2 curr = a_position * abs_scale;
    if( a_texcoord.x < 0.0 ) {
        vec2 next = curr + t2*(v_segment.y-v_segment.x);

        rotate( t1, +v_angles.x/2.0, t);
        v_miter.x = signed_distance(curr, curr+t, position);

        rotate( t2, +v_angles.y/2.0, t);
        v_miter.y = signed_distance(next, next+t, position);
    } else {
        vec2 prev = curr - t1*(v_segment.y-v_segment.x);

        rotate( t1, -v_angles.x/2.0,t);
        v_miter.x = signed_distance(prev, prev+t, position);

        rotate( t2, -v_angles.y/2.0,t);
        v_miter.y = signed_distance(curr, curr+t, position);
    }

    if (!closed && v_segment.x <= 0.0) {
        v_miter.x = 1e10;
    }
    if (!closed && v_segment.y >= v_length)
    {
        v_miter.y = 1e10;
    }

    v_texcoord = vec2( u, v*w );

    // Calculate position in device coordinates. Note that we
    // already scaled with abs scale above.
    vec2 normpos = position * sign(u_scale_aspect);
    normpos += 0.5;  // make up for Bokeh's offset
    normpos /= u_canvas_size / u_pixel_ratio;  // in 0..1
    gl_Position = vec4(normpos*2.0-1.0, 0.0, 1.0);
    gl_Position.y *= -1.0;
}
`
