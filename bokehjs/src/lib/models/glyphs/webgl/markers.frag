precision mediump float;
const float SQRT_2 = 1.4142135623730951;
const float PI = 3.14159265358979323846264;
//
uniform float u_antialias;
//
varying vec4  v_fg_color;
varying vec4  v_bg_color;
varying float v_marker_type;
varying float v_linewidth;
varying float v_size;
varying vec2  v_rotation;

float circle(vec2 P, float size)
{
    return length(P) - size/2.0;
}

float square(vec2 P, float size)
{
    return max(abs(P.x), abs(P.y)) - size/2.0;
}

float diamond(vec2 P, float size)
{
    float x = SQRT_2 / 2.0 * (P.x * 1.5 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.5 + P.y);
    float r1 = max(abs(x), abs(y)) - size / (2.0 * SQRT_2);
    return r1 / SQRT_2;
}

float hex(vec2 P, float size)
{
    vec2 q = abs(P);
    return max(q.y * 0.57735 + q.x - 1.0 * size/2.0, q.y - 0.866 * size/2.0);
}

float triangle(vec2 P, float size)
{
    P.y -= size * 0.3;
    float x = SQRT_2 / 2.0 * (P.x * 1.7 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.7 + P.y);
    float r1 = max(abs(x), abs(y)) - size / 1.6;
    float r2 = P.y;
    return max(r1 / SQRT_2, r2);  // Intersect diamond with rectangle
}

float invertedtriangle(vec2 P, float size)
{
    P.y += size * 0.3;
    float x = SQRT_2 / 2.0 * (P.x * 1.7 - P.y);
    float y = SQRT_2 / 2.0 * (P.x * 1.7 + P.y);
    float r1 = max(abs(x), abs(y)) - size / 1.6;
    float r2 = - P.y;
    return max(r1 / SQRT_2, r2);  // Intersect diamond with rectangle
}

float cross(vec2 P, float size)
{
    float square = max(abs(P.x), abs(P.y)) - size / 2.5;   // 2.5 is a tweak
    float cross = min(abs(P.x), abs(P.y)) - size / 100.0;  // bit of "width" for aa
    return max(square, cross);
}

float circlecross(vec2 P, float size)
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

float squarecross(vec2 P, float size)
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

float diamondcross(vec2 P, float size)
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

float x(vec2 P, float size)
{
    float circle = length(P) - size / 1.6;
    float X = min(abs(P.x - P.y), abs(P.x + P.y)) - size / 100.0;  // bit of "width" for aa
    return max(circle, X);
}

float circlex(vec2 P, float size)
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
    float almost = min(min(min(c1, c2), c3), c4);
    // In this case, the X is also outside of the main shape
    float Xmask = length(P) - size / 1.6;  // a circle
    float X = min(abs(P.x - P.y), abs(P.x + P.y)) - size / 100.0;  // bit of "width" for aa
    return min(max(X, Xmask), almost);
}

float squarex(vec2 P, float size)
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

float asterisk(vec2 P, float size)
{
    // Masks
    float diamond = max(abs(SQRT_2 / 2.0 * (P.x - P.y)), abs(SQRT_2 / 2.0 * (P.x + P.y))) - size / (2.0 * SQRT_2);
    float square = max(abs(P.x), abs(P.y)) - size / (2.0 * SQRT_2);
    // Shapes
    float X = min(abs(P.x - P.y), abs(P.x + P.y)) - size / 100.0;  // bit of "width" for aa
    float cross = min(abs(P.x), abs(P.y)) - size / 100.0;  // bit of "width" for aa
    // Result is union of masked shapes
    return min(max(X, diamond), max(cross, square));
}

vec4 outline(float distance, float linewidth, float antialias, vec4 fg_color, vec4 bg_color)
{
    vec4 frag_color;
    float t = linewidth/2.0 - antialias;
    float signed_distance = distance;
    float border_distance = abs(signed_distance) - t;
    float alpha = border_distance/antialias;
    alpha = exp(-alpha*alpha);

    // If fg alpha is zero, it probably means no outline. To avoid a dark outline
    // shining through due to aa, we set the fg color to the bg color. Avoid if (i.e. branching).
    float select = float(bool(fg_color.a));
    fg_color.rgb = select * fg_color.rgb + (1.0  - select) * bg_color.rgb;
    // Similarly, if we want a transparent bg
    select = float(bool(bg_color.a));
    bg_color.rgb = select * bg_color.rgb + (1.0  - select) * fg_color.rgb;

    if( border_distance < 0.0)
        frag_color = fg_color;
    else if( signed_distance < 0.0 ) {
        frag_color = mix(bg_color, fg_color, sqrt(alpha));
    } else {
        if( abs(signed_distance) < (linewidth/2.0 + antialias) ) {
            frag_color = vec4(fg_color.rgb, fg_color.a * alpha);
        } else {
            discard;
        }
    }
    return frag_color;
}

void main()
{
    vec2 P = gl_PointCoord.xy - vec2(0.5, 0.5);
    P = vec2(v_rotation.x*P.x - v_rotation.y*P.y,
             v_rotation.y*P.x + v_rotation.x*P.y);
    float point_size = SQRT_2*v_size  + 2.0 * (v_linewidth + 1.5*u_antialias);

    int i_marker_type = int(v_marker_type);
    float distance;
    if (i_marker_type == 0) {         // asterisk
        distance = asterisk(P*point_size, v_size);
    } else if (i_marker_type == 1) {  // circle
        distance = circle(P*point_size, v_size);
    } else if (i_marker_type == 2) {  // circle_cross
        distance = circlecross(P*point_size, v_size);
    } else if (i_marker_type == 3) {  // circle_dot
        distance = 0.0;
    } else if (i_marker_type == 4) {  // circle_x
        distance = circlex(P*point_size, v_size);
    } else if (i_marker_type == 5) {  // circle_y
        distance = 0.0;
    } else if (i_marker_type == 6) {  // cross
        distance = cross(P*point_size, v_size);
    } else if (i_marker_type == 7) {  // dash
        distance = 0.0;
    } else if (i_marker_type == 8) {  // diamond
        distance = diamond(P*point_size, v_size);
    } else if (i_marker_type == 9) {  // diamond_cross
        distance = diamondcross(P*point_size, v_size);
    } else if (i_marker_type == 10) { // diamond_dot
        distance = 0.0;
    } else if (i_marker_type == 11) { // dot
        distance = 0.0;
    } else if (i_marker_type == 12) { // hex
        distance = hex(P*point_size, v_size);
    } else if (i_marker_type == 13) { // hex_dot
        distance = 0.0;
    } else if (i_marker_type == 14) { // inverted_triangle
        distance = invertedtriangle(P*point_size, v_size);
    } else if (i_marker_type == 15) { // plus
        distance = 0.0;
    } else if (i_marker_type == 16) { // square
        distance = square(P*point_size, v_size);
    } else if (i_marker_type == 17) { // square_cross
        distance = squarecross(P*point_size, v_size);
    } else if (i_marker_type == 18) { // square_dot
        distance = 0.0;
    } else if (i_marker_type == 19) { // square_pin
        distance = 0.0;
    } else if (i_marker_type == 20) { // square_x
        distance = squarex(P*point_size, v_size);
    } else if (i_marker_type == 21) { // triangle
        distance = triangle(P*point_size, v_size);
    } else if (i_marker_type == 22) { // triangle_dot
        distance = 0.0;
    } else if (i_marker_type == 23) { // triangle_pin
        distance = 0.0;
    } else if (i_marker_type == 24) { // x
        distance = x(P*point_size, v_size);
    } else if (i_marker_type == 25) { // y
        distance = 0.0;
    } else {
        distance = 0.0;
    }

    gl_FragColor = outline(distance, v_linewidth, u_antialias, v_fg_color, v_bg_color);
}
