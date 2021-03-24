precision mediump float;

const float SQRT_2 = 1.4142135623730951;
const float SQRT_3 = sqrt(3.0);
const float PI = 3.14159265358979323846264;

const float IN_ANGLE = 0.6283185307179586; // PI/5. = 36 degrees (star of 5 pikes)
//const float OUT_ANGLE = PI/2. - IN_ANGLE; // External angle for regular stars
const float COS_A = 0.8090169943749475; // cos(IN_ANGLE)
const float SIN_A = 0.5877852522924731; // sin(IN_ANGLE)
const float COS_B = 0.5877852522924731; // cos(OUT_ANGLE)
const float SIN_B = 0.8090169943749475; // sin(OUT_ANGLE)

uniform float u_antialias;

varying vec4 v_line_color;
varying vec4 v_fill_color;
varying float v_linewidth;
varying float v_size;
varying vec2 v_coords;

#ifdef USE_ASTERISK
// asterisk
float marker(vec2 P, float size)
{
    // Masks
    float diamond = max(abs(SQRT_2 / 2.0 * (P.x - P.y)), abs(SQRT_2 / 2.0 * (P.x + P.y))) - size / 2.0;
    float square = max(abs(P.x), abs(P.y)) - size / 2.0;
    // Shapes
    float X = min(abs(P.x - P.y), abs(P.x + P.y));
    float cross = min(abs(P.x), abs(P.y));
    // Result is union of masked shapes
    float result = min(max(X, diamond), max(cross, square));
    return max(result - v_linewidth/2.0 + u_antialias/2.0, 0.0);
}
#endif

#ifdef USE_CIRCLE
// circle
float marker(vec2 P, float size)
{
    return length(P) - size/2.0;
}
#endif

#ifdef USE_DOT
float marker(vec2 P, float size)
{
    return max(length(P) - size/8.0 - v_linewidth/15.0 + u_antialias, 0.0);
}
#endif

#ifdef USE_CIRCLE_DOT
float marker(vec2 P, float size)
{
    float circle = length(P) - size/2.0;
    float dot_ = min(size/8.0 + v_linewidth/15.0 - u_antialias - length(P), 0.0);
    return max(circle, dot_);
}
#endif

#ifdef USE_SQUARE
// square
float marker(vec2 P, float size)
{
    return max(abs(P.x), abs(P.y)) - size/2.0;
}
#endif

#ifdef USE_SQUARE_DOT
float marker(vec2 P, float size)
{
    float square = max(abs(P.x), abs(P.y)) - size/2.0;
    float dot_ = min(size/8.0 + v_linewidth/15.0 - u_antialias - length(P), 0.0);
    return max(square, dot_);
}
#endif

#ifdef USE_DIAMOND
// diamond
float marker(vec2 P, float size)
{
    float x = SQRT_2 / 2.0 * (P.x * 1.5 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.5 + P.y);
    float r1 = max(abs(x), abs(y)) - size / (2.0 * SQRT_2);
    return r1 / SQRT_2;
}
#endif

#ifdef USE_DIAMOND_DOT
float marker(vec2 P, float size)
{
    float x = SQRT_2 / 2.0 * (P.x * 1.5 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.5 + P.y);
    float r1 = max(abs(x), abs(y)) - size / (2.0 * SQRT_2);
    float diamond = r1 / SQRT_2;
    float dot_ = min(size/8.0 + v_linewidth/15.0 - u_antialias - length(P), 0.0);
    return max(diamond, dot_);
}
#endif

#ifdef USE_HEX
// hex
float marker(vec2 P, float size)
{
    vec2 q = abs(P);
    return max(q.y * 0.57735 + q.x - 1.0 * size/2.0, q.y - 0.866 * size/2.0);
}
#endif

#ifdef USE_HEX_DOT
float marker(vec2 P, float size)
{
    vec2 q = abs(P);
    float hex = max(q.y * 0.57735 + q.x - 1.0 * size/2.0, q.y - 0.866 * size/2.0);
    float dot_ = min(size/8.0 + v_linewidth/15.0 - u_antialias - length(P), 0.0);
    return max(hex, dot_);
}
#endif

#ifdef USE_STAR
// star
// https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm
float marker(vec2 P, float size)
{
    float bn = mod(atan(P.x, -P.y), 2.0*IN_ANGLE) - IN_ANGLE;
    P = length(P)*vec2(cos(bn), abs(sin(bn)));
    P -= size*vec2(COS_A, SIN_A)/2.;
    P += vec2(COS_B, SIN_B)*clamp(-(P.x*COS_B + P.y*SIN_B), 0.0, size*SIN_A/SIN_B/2.);
    return length(P)*sign(P.x);
}
#endif

#ifdef USE_STAR_DOT
float marker(vec2 P, float size)
{
    float dot_ = min(size/8.0 + v_linewidth/15.0 - u_antialias - length(P), 0.0);
    float bn = mod(atan(P.x, -P.y), 2.0*IN_ANGLE) - IN_ANGLE;
    P = length(P)*vec2(cos(bn), abs(sin(bn)));
    P -= size*vec2(COS_A, SIN_A)/2.;
    P += vec2(COS_B, SIN_B)*clamp(-(P.x*COS_B + P.y*SIN_B), 0.0, size*SIN_A/SIN_B/2.);
    float star = length(P)*sign(P.x);
    return max(star, dot_);
}
#endif

#ifdef USE_TRIANGLE
// triangle
float marker(vec2 P, float size)
{
    P.y -= size * 0.3;
    float x = SQRT_2 / 2.0 * (P.x * 1.7 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.7 + P.y);
    float r1 = max(abs(x), abs(y)) - size / 1.6;
    float r2 = P.y;
    return max(r1 / SQRT_2, r2);  // Intersect diamond with rectangle
}
#endif

#ifdef USE_TRIANGLE_DOT
float marker(vec2 P, float size)
{
    float dot_ = min(size/8.0 + v_linewidth/15.0 - u_antialias - length(P), 0.0);
    P.y -= size * 0.3;
    float x = SQRT_2 / 2.0 * (P.x * 1.7 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.7 + P.y);
    float r1 = max(abs(x), abs(y)) - size / 1.6;
    float r2 = P.y;
    float triangle = max(r1 / SQRT_2, r2);  // Intersect diamond with rectangle
    return max(triangle, dot_);
}
#endif

#ifdef USE_INVERTED_TRIANGLE
// inverted_triangle
float marker(vec2 P, float size)
{
    P.y += size * 0.3;
    float x = SQRT_2 / 2.0 * (P.x * 1.7 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.7 + P.y);
    float r1 = max(abs(x), abs(y)) - size / 1.6;
    float r2 = - P.y;
    return max(r1 / SQRT_2, r2);  // Intersect diamond with rectangle
}
#endif

#ifdef USE_CROSS
// cross
float marker(vec2 P, float size)
{
    float square = max(abs(P.x), abs(P.y)) - size / 2.0;
    float cross = min(abs(P.x), abs(P.y));
    cross = max(cross - v_linewidth/2.0 + u_antialias/2.0, 0.0);
    return max(square, cross);
}
#endif

#ifdef USE_DASH
float marker(vec2 P, float size)
{
    float square = max(abs(P.x), abs(P.y)) - size / 2.0;
    float cross = abs(P.y);
    cross = max(cross - v_linewidth/2.0 + u_antialias/2.0, 0.0);
    return max(square, cross);
}
#endif

#ifdef USE_CIRCLE_CROSS
// circle_cross
float marker(vec2 P, float size)
{
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(P.x - qs), abs(P.y - qs)) - qs;
    float s2 = max(abs(P.x + qs), abs(P.y - qs)) - qs;
    float s3 = max(abs(P.x - qs), abs(P.y + qs)) - qs;
    float s4 = max(abs(P.x + qs), abs(P.y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float circle = length(P) - size/2.0;
    float c1 = max(circle, s1);
    float c2 = max(circle, s2);
    float c3 = max(circle, s3);
    float c4 = max(circle, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}
#endif

#ifdef USE_SQUARE_CROSS
// square_cross
float marker(vec2 P, float size)
{
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(P.x - qs), abs(P.y - qs)) - qs;
    float s2 = max(abs(P.x + qs), abs(P.y - qs)) - qs;
    float s3 = max(abs(P.x - qs), abs(P.y + qs)) - qs;
    float s4 = max(abs(P.x + qs), abs(P.y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float square = max(abs(P.x), abs(P.y)) - size/2.0;
    float c1 = max(square, s1);
    float c2 = max(square, s2);
    float c3 = max(square, s3);
    float c4 = max(square, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}
#endif

#ifdef USE_DIAMOND_CROSS
// diamond_cross
float marker(vec2 P, float size)
{
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(P.x - qs), abs(P.y - qs)) - qs;
    float s2 = max(abs(P.x + qs), abs(P.y - qs)) - qs;
    float s3 = max(abs(P.x - qs), abs(P.y + qs)) - qs;
    float s4 = max(abs(P.x + qs), abs(P.y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float x = SQRT_2 / 2.0 * (P.x * 1.5 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.5 + P.y);
    float diamond = max(abs(x), abs(y)) - size / (2.0 * SQRT_2);
    diamond /= SQRT_2;
    float c1 = max(diamond, s1);
    float c2 = max(diamond, s2);
    float c3 = max(diamond, s3);
    float c4 = max(diamond, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}
#endif

#ifdef USE_X
// x
float marker(vec2 P, float size)
{
    float circle = length(P) - size / 2.0;
    float X = min(abs(P.x - P.y), abs(P.x + P.y));
    X = max(X - v_linewidth/2.0, 0.0);
    return max(circle, X);
}
#endif

#ifdef USE_Y
float marker(vec2 P, float size)
{
    float circle = length(P) - size / 2.0;

    float dx = 1.0 / SQRT_3;
    float dy = SQRT_2 / SQRT_3;

    // Sideways distance from the three spokes.
    float d0 = abs(P.x);
    float d1 = abs(dot(P, vec2(dx, dy)));
    float d2 = abs(dot(P, vec2(dx, -dy)));

    // Clip each spoke to semicircle.
    d0 = max(d0, -P.y);
    d1 = max(d1, dot(P, vec2(-dy, dx)));
    d2 = max(d2, dot(P, vec2(dy, dx)));

    float Y = min(min(d0, d1), d2);
    Y = max(Y - v_linewidth/2.0 + u_antialias/2.0, 0.0);
    return max(circle, Y);
}
#endif

#ifdef USE_CIRCLE_X
// circle_x
float marker(vec2 P, float size)
{
    float x = P.x - P.y;
    float y = P.x + P.y;
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(x - qs), abs(y - qs)) - qs;
    float s2 = max(abs(x + qs), abs(y - qs)) - qs;
    float s3 = max(abs(x - qs), abs(y + qs)) - qs;
    float s4 = max(abs(x + qs), abs(y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float circle = length(P) - size/2.0;
    float c1 = max(circle, s1);
    float c2 = max(circle, s2);
    float c3 = max(circle, s3);
    float c4 = max(circle, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}
#endif

#ifdef USE_CIRCLE_Y
float marker(vec2 P, float size)
{
    float circle = length(P) - size/2.0;

    float dx = 1.0 / SQRT_3;
    float dy = SQRT_2 / SQRT_3;

    // Sideways distance from the three spokes.
    float d0 = abs(P.x);
    float d1 = abs(dot(P, vec2(dx, dy)));
    float d2 = abs(dot(P, vec2(dx, -dy)));

    // Clip each spoke to semicircle.
    d0 = max(d0, -P.y);
    d1 = max(d1, dot(P, vec2(-dy, dx)));
    d2 = max(d2, dot(P, vec2(dy, dx)));

    float Y = min(min(d0, d1), d2);
    Y = min(v_linewidth/2.0 - u_antialias/2.0 - Y, 0.0);

    return max(circle, Y);
}
#endif

#ifdef USE_SQUARE_X
// square_x
float marker(vec2 P, float size)
{
    float x = P.x - P.y;
    float y = P.x + P.y;
    // Define quadrants
    float qs = size / 2.0;  // quadrant size
    float s1 = max(abs(x - qs), abs(y - qs)) - qs;
    float s2 = max(abs(x + qs), abs(y - qs)) - qs;
    float s3 = max(abs(x - qs), abs(y + qs)) - qs;
    float s4 = max(abs(x + qs), abs(y + qs)) - qs;
    // Intersect main shape with quadrants (to form cross)
    float square = max(abs(P.x), abs(P.y)) - size/2.0;
    float c1 = max(square, s1);
    float c2 = max(square, s2);
    float c3 = max(square, s3);
    float c4 = max(square, s4);
    // Union
    return min(min(min(c1, c2), c3), c4);
}
#endif

#ifdef USE_PLUS
float marker(vec2 P, float size)
{
    vec2 size2 = vec2(size*0.5, size*0.2);
    P = abs(P);
    P = (P.y > P.x) ? P.yx : P.xy;
    vec2 q = P - size2;
    float k = max(q.y, q.x);
    vec2 w = (k > 0.0) ? q : vec2(size2.y - P.x, -k);
    return sign(k)*length(max(w, 0.0));
}
#endif

#ifdef USE_SQUARE_PIN
float marker(vec2 P, float size)
{
    float actual_size = size*1.2;
    float radius = 0.75*actual_size; // Radius of curvature of edges.
    float offset = actual_size/2.0 + sqrt(radius*radius - actual_size*actual_size/4.0);
    vec2 centerx = vec2(offset, 0.0);
    vec2 centery = vec2(0.0, offset);

    float right = length(P - centerx);
    float left = length(P + centerx);
    float up = length(P - centery);
    float down = length(P + centery);
    float pin = radius - min(min(right, left), min(up, down));

    float circle = length(P) - actual_size*0.6;
    return max(circle, pin);
}
#endif

#ifdef USE_TRIANGLE_PIN
float marker(vec2 P, float size)
{
    float actual_size = size*1.2;
    float radius = 1.2*actual_size; // Radius of curvature of edges.

    float angle = 2.0*PI / 3.0;
    float c = cos(angle);
    float s = sin(angle);
    mat2 rotation = mat2(c, -s, s, c);

    // Half the length of straight triangle edge.
    float half_edge = actual_size*SQRT_3/4.0;
    // Distance from center of triangle to middle of straight edge.
    float centre_middle_edge = 0.25*actual_size;
    float offset = centre_middle_edge + sqrt(radius*radius - half_edge*half_edge);
    // Centre of curvature.
    vec2 center = vec2(0.0, offset);

    float dist0 = length(P - center);
    P = rotation*P;
    float dist1 = length(P - center);
    P = rotation*P;
    float dist2 = length(P - center);
    float pin = radius - min(min(dist0, dist1), dist2);

    float circle = length(P) - actual_size / 2.0;
    return max(circle, pin);
}
#endif

vec4 outline(float distance, float linewidth, float antialias, vec4 line_color,
             vec4 fill_color)
{
    vec4 frag_color;
    float t = min(linewidth/2.0 - antialias, 0.0);  // Line half-width.
    float signed_distance = distance;
    float border_distance = abs(signed_distance) - t;
    float alpha = border_distance/antialias;
    alpha = exp(-alpha*alpha);

    // If line alpha is zero, it probably means no outline. To avoid a dark
    // outline shining through due to antialiasing, we set the line color to the
    // fill color.
    float select = float(bool(line_color.a));
    line_color.rgb = select*line_color.rgb + (1.0 - select)*fill_color.rgb;
    // Similarly, if we want a transparent fill.
    select = float(bool(fill_color.a));
    fill_color.rgb = select*fill_color.rgb + (1.0 - select)*line_color.rgb;

    if (border_distance < 0.0)
        frag_color = line_color;
    else if (signed_distance < 0.0)
        frag_color = mix(fill_color, line_color, sqrt(alpha));
    else {
        if (abs(signed_distance) < linewidth/2.0 + antialias)
            frag_color = vec4(line_color.rgb, line_color.a*alpha);
        else
            discard;
    }
    return frag_color;
}

void main()
{
    float distance = marker(v_coords, v_size);
    gl_FragColor = outline(
        distance, v_linewidth, u_antialias, v_line_color, v_fill_color);
    gl_FragColor.rgb *= gl_FragColor.a;  // Premultiplied alpha.
}
