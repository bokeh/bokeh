precision mediump float;

const float SQRT2 = sqrt(2.0);
const float SQRT3 = sqrt(3.0);
const float PI = 3.14159265358979323846;

const int butt_cap = 0;
const int round_cap = 1;
const int square_cap = 2;

const int miter_join = 0;
const int round_join = 1;
const int bevel_join = 2;

#ifdef HATCH
const int hatch_dot = 1;
const int hatch_ring = 2;
const int hatch_horizontal_line = 3;
const int hatch_vertical_line = 4;
const int hatch_cross = 5;
const int hatch_horizontal_dash = 6;
const int hatch_vertical_dash = 7;
const int hatch_spiral = 8;
const int hatch_right_diagonal_line = 9;
const int hatch_left_diagonal_line = 10;
const int hatch_diagonal_cross = 11;
const int hatch_right_diagonal_dash = 12;
const int hatch_left_diagonal_dash = 13;
const int hatch_horizontal_wave = 14;
const int hatch_vertical_wave = 15;
const int hatch_criss_cross = 16;
#endif

uniform float u_antialias;

varying vec2 v_coords;
varying vec2 v_size;

#ifdef USE_ANNULAR_WEDGE
varying float v_outer_radius;
varying float v_inner_radius;
varying float v_start_angle;
varying float v_end_angle;
#endif

#ifdef USE_ANNULUS
varying float v_outer_radius;
varying float v_inner_radius;
#endif

#ifdef USE_WEDGE
varying float v_radius;
varying float v_start_angle;
varying float v_end_angle;
#endif

#ifdef USE_CIRCLE
varying float v_radius;
#endif

#ifdef USE_RECT
varying vec4 v_border_radius;
#endif

varying float v_linewidth;
varying vec4 v_line_color;
varying vec4 v_fill_color;
varying float v_line_cap;
varying float v_line_join;

#ifdef HATCH
varying float v_hatch_pattern;
varying float v_hatch_scale;
varying float v_hatch_weight;
varying vec4 v_hatch_color;
varying vec2 v_hatch_coords;
#endif

// Lines within the marker (dot, cross, x and y) are added at the end as they are
// on top of the fill rather than astride it.
#if defined(USE_CIRCLE_DOT) || defined(USE_DIAMOND_DOT) || defined(USE_DOT) || \
    defined(USE_HEX_DOT) || defined(USE_SQUARE_DOT) || defined(USE_STAR_DOT) || \
    defined(USE_TRIANGLE_DOT)
  #define APPEND_DOT
#endif

#if defined(USE_CIRCLE_CROSS) || defined(USE_SQUARE_CROSS)
  #define APPEND_CROSS
#endif

#ifdef USE_DIAMOND_CROSS
  #define APPEND_CROSS_2
#endif

#ifdef USE_CIRCLE_X
  #define APPEND_X
  #define APPEND_X_LEN (0.5*v_size.x)
#endif

#ifdef USE_SQUARE_X
  #define APPEND_X
  #define APPEND_X_LEN (v_size.x/SQRT2)
#endif

#ifdef USE_CIRCLE_Y
  #define APPEND_Y
#endif

#if defined(USE_ASTERISK) || defined(USE_CROSS) || defined(USE_DASH) || \
    defined(USE_DOT) || defined(USE_X) || defined(USE_Y)
  // No fill.
  #define LINE_ONLY
#endif

#if defined(LINE_ONLY) || defined(APPEND_CROSS) || defined(APPEND_CROSS_2) || \
    defined(APPEND_X) || defined(APPEND_Y)
float end_cap_distance(in vec2 p, in vec2 end_point, in vec2 unit_direction, in int line_cap)
{
  vec2 offset = p - end_point;
  if (line_cap == butt_cap)
    return dot(offset, unit_direction) + 0.5*v_linewidth;
  else if (line_cap == square_cap)
    return dot(offset, unit_direction);
  else if (line_cap == round_cap && dot(offset, unit_direction) > 0.0)
    return length(offset);
  else
    // Default is outside of line and should be -0.5*(v_linewidth+u_antialias) or less,
    // so here avoid the multiplication.
    return -v_linewidth-u_antialias;
}
#endif

#if !(defined(LINE_ONLY) || defined(USE_SQUARE_PIN) || defined(USE_TRIANGLE_PIN))
// For line join at a vec2 corner where 2 line segments meet, consider bevel points which are the 2
// points obtained by moving half a linewidth away from the corner point in the directions normal to
// the line segments.  The line through these points is the bevel line, characterised by a vec2
// unit_normal and offset distance from the corner point.  Edge of bevel join straddles this line,
// round join occurs outside of this line centred on the corner point.  In general
//   offset = (linewidth/2)*sin(alpha/2)
// where alpha is the angle between the 2 line segments at the corner.
float line_join_distance_no_miter(
  in vec2 p, in vec2 corner, in vec2 unit_normal, in float offset, in int line_join)
{
  // Simplified version of line_join_distance ignoring miter which most markers do implicitly
  // as they are composed of straight line segments.
  float dist_outside = dot((p - corner), unit_normal) - offset;

  if (line_join == bevel_join && dist_outside > -0.5*u_antialias)
    return dist_outside + 0.5*v_linewidth;
  else if (dist_outside > 0.0)  // round_join
    return distance(p, corner);
  else
    // Default is outside of line and should be -0.5*(v_linewidth+u_antialias) or less,
    // so here avoid the multiplication.
    return -v_linewidth-u_antialias;
}
#endif

#if defined(USE_SQUARE_PIN) || defined(USE_TRIANGLE_PIN)
// Line join distance including miter but only one-sided check as assuming use of symmetry in
// calling function.
float line_join_distance_incl_miter(
  in vec2 p, in vec2 corner, in vec2 unit_normal, in float offset, in int line_join,
  vec2 miter_unit_normal)
{
  float dist_outside = dot((p - corner), unit_normal) - offset;

  if (line_join == miter_join && dist_outside > 0.0)
    return dot((p - corner), miter_unit_normal);
  else if (line_join == bevel_join && dist_outside > -0.5*u_antialias)
    return dist_outside + 0.5*v_linewidth;
  else if (dist_outside > 0.0)  // round_join
    return distance(p, corner);
  else
    return -v_linewidth-u_antialias;
}
#endif

#if defined(APPEND_CROSS) || defined(APPEND_X) || defined(USE_ASTERISK) || \
    defined(USE_CROSS) || defined(USE_X)
float one_cross(in vec2 p, in int line_cap, in float len)
{
  p = abs(p);
  p = (p.y > p.x) ? p.yx : p.xy;
  float dist = p.y;
  float end_dist = end_cap_distance(p, vec2(len, 0.0), vec2(1.0, 0.0), line_cap);
  return max(dist, end_dist);
}
#endif

#ifdef APPEND_CROSS_2
float one_cross_2(in vec2 p, in int line_cap, in vec2 lengths)
{
  // Cross with different length in x and y directions.
  p = abs(p);
  bool switch_xy = (p.y > p.x);
  p = switch_xy ? p.yx : p.xy;
  float len = switch_xy ? lengths.y : lengths.x;
  float dist = p.y;
  float end_dist = end_cap_distance(p, vec2(len, 0.0), vec2(1.0, 0.0), line_cap);
  return max(dist, end_dist);
}
#endif

#if defined(APPEND_Y) || defined(USE_Y)
float one_y(in vec2 p, in int line_cap, in float len)
{
  p = vec2(abs(p.x), -p.y);

  // End point of line to right is (1/2, 1/3)*len*SQRT3.
  // Unit vector along line is (1/2, 1/3)*k where k = 6/SQRT13.
  const float k = 6.0/sqrt(13.0);
  vec2 unit_along = vec2(0.5*k, k/3.0);
  vec2 end_point = vec2(0.5*len*SQRT3, len*SQRT3/3.0);
  float dist = max(abs(dot(p, vec2(-unit_along.y, unit_along.x))),
                   end_cap_distance(p, end_point, unit_along, line_cap));

  if (p.y < 0.0) {
    // Vertical line.
    float vert_dist = max(p.x,
                          end_cap_distance(p, vec2(0.0, -len), vec2(0.0, -1.0), line_cap));
    dist = min(dist, vert_dist);
  }
  return dist;
}
#endif

// One marker_distance function per marker type.
// Distance is zero on edge of marker, +ve outside and -ve inside.

#ifdef USE_ASTERISK
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  vec2 p_diag = vec2((p.x + p.y)/SQRT2, (p.x - p.y)/SQRT2);
  float len = 0.5*v_size.x;
  return min(one_cross(p, line_cap, len),  // cross
             one_cross(p_diag, line_cap, len));  // x
}
#endif

#if defined(USE_ANNULUS) || defined(USE_WEDGE) || defined(USE_ANNULAR_WEDGE)
float merge(in float d1, in float d2)
{
  return min(d1, d2);
}

float intersect(in float d1, in float d2)
{
  return max(d1, d2);
}

float subtract(in float d1, in float d2)
{
  return max(d1, -d2);
}

float circle(in vec2 p, in float radius)
{
  return length(p) - radius;
}

float segment_square(in vec2 p, in vec2 q) {
  vec2 v = p - q*clamp(dot(p, q)/dot(q, q), 0.0, 1.0);
  return dot(v, v);
}

vec2 xy(in float angle)
{
  return vec2(cos(angle), sin(angle));
}

float cross_z(in vec2 v0, in vec2 v1)
{
    return v0.x*v1.y - v0.y*v1.x;
}

// From https://www.shadertoy.com/view/wldXWB (MIT licensed)
float wedge(in vec2 p, in float r, in float start_angle, in float end_angle)
{
    vec2 a = r*xy(start_angle);
    vec2 b = r*xy(end_angle);

    // distance
    float d = sqrt(merge(segment_square(p, a), segment_square(p, b)));

    // sign
    float s;
    if (cross_z(a, b) < 0.0) {
        s =  sign(max(cross_z(a, p), cross_z(p, b)));
    } else {
        s = -sign(max(cross_z(p, a), cross_z(b, p)));
    }

    return s*d;
}

float annulus(in vec2 p, in float outer_radius, in float inner_radius)
{
  float outer = circle(p, outer_radius);
  float inner = circle(p, inner_radius);

  return subtract(outer, inner);
}
#endif

#if defined(USE_ANNULUS)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  return annulus(p, v_outer_radius, v_inner_radius);
}
#endif

#if defined(USE_WEDGE)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  return intersect(
    circle(p, v_radius),
    wedge(p, v_radius, v_start_angle, v_end_angle));
}
#endif

#if defined(USE_ANNULAR_WEDGE)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  return intersect(
    annulus(p, v_outer_radius, v_inner_radius),
    wedge(p, v_outer_radius, v_start_angle, v_end_angle));
}
#endif

#if defined(USE_CIRCLE) || defined(USE_CIRCLE_CROSS) || defined(USE_CIRCLE_DOT) || \
    defined(USE_CIRCLE_X) || defined(USE_CIRCLE_Y)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  return length(p) - 0.5*v_size.x;
}
#endif

#ifdef USE_CROSS
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  return one_cross(p, line_cap, 0.5*v_size.x);
}
#endif

#ifdef USE_DASH
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  p = abs(p);
  float dist = p.y;
  float end_dist = end_cap_distance(p, vec2(0.5*v_size.x, 0.0), vec2(1.0, 0.0), line_cap);
  return max(dist, end_dist);
}
#endif

#if defined(USE_DIAMOND) || defined(USE_DIAMOND_CROSS) || defined(USE_DIAMOND_DOT)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  // Only need to consider +ve quadrant, the 2 end points are (2r/3, 0) and (0, r)
  // where r = radius = v_size.x/2.
  // Line has outward-facing unit normal vec2(1, 2/3)/k where k = SQRT13/3
  // hence vec2(3, 2)/SQRT13, and distance from origin of 2r/(3k) = 2r/SQRT13.
  p = abs(p);
  float r = 0.5*v_size.x;
  const float SQRT13 = sqrt(13.0);
  float dist = dot(p, vec2(3.0, 2.0))/SQRT13 - 2.0*r/SQRT13;

  if (line_join != miter_join) {
    dist = max(dist, line_join_distance_no_miter(
      p, vec2(0.0, r), vec2(0.0, 1.0), v_linewidth/SQRT13, line_join));

    dist = max(dist, line_join_distance_no_miter(
      p, vec2(r*2.0/3.0, 0.0), vec2(1.0, 0.0), v_linewidth*(1.5/SQRT13), line_join));
  }

  return dist;
}
#endif

#ifdef USE_DOT
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Dot is always appended.
  return v_linewidth+u_antialias;
}
#endif

#if defined(USE_HEX_TILE) || defined(USE_HEX) || defined(USE_HEX_DOT)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // A regular hexagon has v_size.x == v.size_y = r where r is the length of
  // each of the 3 sides of the 6 equilateral triangles that comprise the hex.
  // Only consider +ve quadrant, the 3 corners are at (0, h), (rx/2, h), (rx, 0)
  // where rx = 0.5*v_size.x, ry = 0.5*v_size.y and h = ry*SQRT3/2.
  // Sloping line has outward normal vec2(h, rx/2).  Length of this is
  // len = sqrt(h**2 + rx**2/4) to give unit normal (h, rx/2)/len and distance
  // from origin of this line is rx*h/len.
  p = abs(p);
  float rx = v_size.x/2.0;
  float h = v_size.y*(SQRT3/4.0);
  float len_normal = sqrt(h*h + 0.25*rx*rx);
  vec2 unit_normal = vec2(h, 0.5*rx) / len_normal;
  float dist = max(dot(p, unit_normal) - rx*h/len_normal,  // Distance from sloping line.
                   p.y - h);  // Distance from horizontal line.

  if (line_join != miter_join) {
    dist = max(dist, line_join_distance_no_miter(
      p, vec2(rx, 0.0), vec2(1.0, 0.0), 0.5*v_linewidth*unit_normal.x, line_join));

    unit_normal = normalize(unit_normal + vec2(0.0, 1.0));  // At (rx/2, h) corner.
    dist = max(dist, line_join_distance_no_miter(
      p, vec2(0.5*rx, h), unit_normal, 0.5*v_linewidth*unit_normal.y, line_join));
  }
  return dist;
}
#endif

#ifdef USE_PLUS
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  // Only need to consider one octant, the +ve quadrant with x >= y.
  p = abs(p);
  p = (p.y > p.x) ? p.yx : p.xy;

  // 3 corners are (r, 0), (r, 3r/8) and (3r/8, 3r/8).
  float r = 0.5*v_size.x;
  p = p - vec2(r, 0.375*r);  // Distance with respect to outside corner
  float dist = max(p.x, p.y);

  if (line_join != miter_join) {
    // Outside corner
    dist = max(dist, line_join_distance_no_miter(
      p, vec2(0.0, 0.0), vec2(1.0/SQRT2, 1.0/SQRT2), v_linewidth/(2.0*SQRT2), line_join));

    // Inside corner
    dist = min(dist, -line_join_distance_no_miter(
      p, vec2(-5.0*r/8.0, 0.0), vec2(-1.0/SQRT2, -1.0/SQRT2), v_linewidth/(2.0*SQRT2), line_join));
  }

  return dist;
}
#endif

#if defined(USE_RECT)
// From https://www.shadertoy.com/view/4llXD7 (MIT licensed)
float rounded_box(in vec2 p, in vec2 size, in vec4 r)
{
  float width = size.x;
  float height = size.y;

  float top_left = r.x;
  float top_right = r.y;
  float bottom_right = r.z;
  float bottom_left = r.w;

  float top = top_left + top_right;
  float right = top_right + bottom_right;
  float bottom = bottom_right + bottom_left;
  float left = top_left + bottom_left;

  float top_scale    = top    == 0.0 ? 1.0 : width  / top;
  float right_scale  = right  == 0.0 ? 1.0 : height / right;
  float bottom_scale = bottom == 0.0 ? 1.0 : width  / bottom;
  float left_scale   = left   == 0.0 ? 1.0 : height / left;

  float scale = min(min(min(top_scale, right_scale), bottom_scale), left_scale);
  if (scale < 1.0) {
    r *= scale;
  }

  // tl r.x x=-1 y=-1
  // tr r.y x=+1 y=-1
  // br r.z x=+1 y=+1
  // bl r.w x=-1 y=+1
  vec2 rh = p.x > 0.0 ? r.yz : r.xw;
  float rq = p.y > 0.0 ? rh.y : rh.x;

  // special case for corner miter joins
  vec2 half_size = size/2.0;
  if (rq == 0.0) {
    vec2 q = abs(p) - half_size;
    return max(q.x, q.y);
  } else {
    vec2 q = abs(p) - half_size + rq;
    return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - rq;
  }
}

float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  float dist = rounded_box(p, v_size, v_border_radius);

  if (line_join != miter_join) {
    vec2 p2 = abs(p) - v_size/2.0; // Offset from corner
    dist = max(dist, line_join_distance_no_miter(
      p2, vec2(0.0, 0.0), vec2(1.0/SQRT2, 1.0/SQRT2), v_linewidth/(2.0*SQRT2), line_join));
  }

  return dist;
}
#endif

#if defined(USE_SQUARE) || defined(USE_SQUARE_CROSS) || defined(USE_SQUARE_DOT) || defined(USE_SQUARE_X)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  vec2 p2 = abs(p) - v_size/2.0;  // Offset from corner
  float dist = max(p2.x, p2.y);

  if (line_join != miter_join) {
    dist = max(dist, line_join_distance_no_miter(
      p2, vec2(0.0, 0.0), vec2(1.0/SQRT2, 1.0/SQRT2), v_linewidth/(2.0*SQRT2), line_join));
  }

  return dist;
}
#endif

#ifdef USE_SQUARE_PIN
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  p = abs(p);
  p = (p.y > p.x) ? p.yx : p.xy;
  // p is in octant between y=0 and y=x.
  // Quadratic bezier curve passes through (r, r), (11r/16, 0) and (r, -r).
  // Circular arc that passes through the same points has center at
  // x = r + 231r/160 = 2.44275r and y = 0 and hence radius is
  // x - 11r/16 = 1.75626 precisely.
  float r = 0.5*v_size.x;
  float center_x = r*2.44375;
  float radius = r*1.75626;
  float dist = radius - distance(p, vec2(center_x, 0.0));

  // Magic number is 0.5*sin(atan(8/5) - pi/4)
  dist = max(dist, line_join_distance_incl_miter(
    p, vec2(r, r), vec2(1.0/SQRT2, 1.0/SQRT2), v_linewidth*0.1124297533493792, line_join,
    vec2(8.0/sqrt(89.0), -5.0/sqrt(89.0))));

  return dist;
}
#endif

#if defined(USE_STAR) || defined(USE_STAR_DOT)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  const float SQRT5 = sqrt(5.0);
  const float COS72 = 0.25*(SQRT5 - 1.0);
  const float SIN72 = sqrt((5.0+SQRT5) / 8.0);

  float angle = atan(p.x, p.y);  // In range -pi to +pi clockwise from +y direction.
  angle = mod(angle, 0.4*PI) - 0.2*PI;  // In range -pi/5 to +pi/5 clockwise from +y direction.
  p = length(p)*vec2(cos(angle), abs(sin(angle)));  // (x,y) in pi/10 (36 degree) sector.

  // 2 corners are at (r, 0) and (r-a*SIN72, a*COS72) where a = r sqrt(5-2*sqrt(5)).
  // Line has outward-facing unit normal vec2(COS72, SIN72) and distance from
  // origin of dot(vec2(r, 0), vec2(COS72, SIN72)) = r*COS72
  float r = 0.5*v_size.x;
  float a = r*sqrt(5.0 - 2.0*SQRT5);
  float dist = dot(p, vec2(COS72, SIN72)) - r*COS72;

  if (line_join != miter_join) {
    // Outside corner
    dist = max(dist, line_join_distance_no_miter(
      p, vec2(r, 0.0), vec2(1.0, 0.0), v_linewidth*(0.5*COS72), line_join));

    // Inside corner
    const float COS36 = sqrt(0.5 + COS72/2.0);
    const float SIN36 = sqrt(0.5 - COS72/2.0);
    dist = min(dist, -line_join_distance_no_miter(
      p, vec2(r-a*SIN72, a*COS72), vec2(-COS36, -SIN36), v_linewidth*(0.5*COS36), line_join));
  }

  return dist;
}
#endif

#if defined(USE_TRIANGLE) || defined(USE_TRIANGLE_DOT) || defined(USE_INVERTED_TRIANGLE)
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  // For normal triangle 3 corners are at (-r, a), (r, a), (0, a-h)=(0, -2h/3)
  // given r = radius = v_size.x/2, h = SQRT3*r, a = h/3.
  // Sloping line has outward-facing unit normal vec2(h, -r)/2r = vec2(SQRT3, -1)/2
  // and distance from origin of a.  Horizontal line has outward-facing unit normal
  // vec2(0, 1) and distance from origin of a.
  float r = 0.5*v_size.x;
  float a = r*SQRT3/3.0;

  // Only need to consider +ve x.
#ifdef USE_INVERTED_TRIANGLE
  p = vec2(abs(p.x), -p.y);
#else
  p = vec2(abs(p.x), p.y);
#endif

  float dist = max(0.5*dot(p, vec2(SQRT3, -1.0)) - a,  // Distance from sloping line.
                   p.y - a);  // Distance from horizontal line.

  if (line_join != miter_join) {
    dist = max(dist, line_join_distance_no_miter(
      p, vec2(0.0, -(2.0/SQRT3)*r), vec2(0.0, -1.0), v_linewidth*0.25, line_join));

    dist = max(dist, line_join_distance_no_miter(
      p, vec2(r, a), vec2(SQRT3/2.0, 0.5), v_linewidth*0.25, line_join));
  }

  return dist;
}
#endif

#ifdef USE_TRIANGLE_PIN
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  float angle = atan(p.x, -p.y);  // In range -pi to +pi.
  angle = mod(angle, PI*2.0/3.0) - PI/3.0;  // In range -pi/3 to pi/3.
  p = length(p)*vec2(cos(angle), abs(sin(angle)));  // (x,y) in range 0 to pi/3.
  // Quadratic bezier curve passes through (a, r), ((a+b)/2, 0) and (a, -r) where
  // a = r/SQRT3, b = 3a/8 = r SQRT3/8.  Circular arc that passes through the same points has
  // center at (a+x, 0) and radius x+c where c = (a-b)/2 and x = (r**2 - c**2) / (2c).
  // Ignore r factor until the end so can use const.
  const float a = 1.0/SQRT3;
  const float b = SQRT3/8.0;
  const float c = (a-b)/2.0;
  const float x = (1.0 - c*c) / (2.0*c);
  const float center_x = x + a;
  const float radius = x + c;
  float r = 0.5*v_size.x;
  float dist = r*radius - distance(p, vec2(r*center_x, 0.0));

  // Magic number is 0.5*sin(atan(8*sqrt(3)/5) - pi/3)
  dist = max(dist, line_join_distance_incl_miter(
    p, vec2(a*r, r), vec2(0.5, 0.5*SQRT3), v_linewidth*0.0881844526878324, line_join,
    vec2(8.0*SQRT3, -5.0)/sqrt(217.0)));

  return dist;
}
#endif

#ifdef USE_X
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  p = vec2((p.x + p.y)/SQRT2, (p.x - p.y)/SQRT2);
  return one_cross(p, line_cap, 0.5*v_size.x);
}
#endif

#ifdef USE_Y
float marker_distance(in vec2 p, in int line_cap, in int line_join)
{
  // Assuming v_size.x == v.size_y
  return one_y(p, line_cap, 0.5*v_size.x);
}
#endif

// Convert distance from edge of marker to fraction in range 0 to 1, depending
// on antialiasing width.
float distance_to_fraction(in float dist)
{
  return 1.0 - smoothstep(-0.5*u_antialias, 0.5*u_antialias, dist);
}

// Return fraction from 0 (no fill color) to 1 (full fill color).
float fill_fraction(in float dist)
{
  return distance_to_fraction(dist);
}

// Return fraction in range 0 (no line color) to 1 (full line color).
float line_fraction(in float dist)
{
  return distance_to_fraction(abs(dist) - 0.5*v_linewidth);
}

// Return fraction (in range 0 to 1) of a color, with premultiplied alpha.
vec4 fractional_color(in vec4 color, in float fraction)
{
  color.a *= fraction;
  color.rgb *= color.a;
  return color;
}

// Blend colors that have premultiplied alpha.
vec4 blend_colors(in vec4 src, in vec4 dest)
{
  return (1.0 - src.a)*dest + src;
}

#ifdef APPEND_DOT
float dot_fraction(in vec2 p)
{
  // Assuming v_size.x == v_size.y
  float radius = 0.125*v_size.x;
  float dot_distance = max(length(p) - radius, -0.5*u_antialias);
  return fill_fraction(dot_distance);
}
#endif

#ifdef HATCH
// Wrap coordinate(s) by removing integer part to give distance from center of
// repeat, in the range -0.5 to +0.5.
float wrap(in float x)
{
  return fract(x) - 0.5;
}

vec2 wrap(in vec2 xy)
{
  return fract(xy) - 0.5;
}

// Return fraction from 0 (no hatch color) to 1 (full hatch color).
float hatch_fraction(in vec2 coords, in int hatch_pattern)
{
  float scale = v_hatch_scale; // Hatch repeat distance.

  // Coordinates and linewidth/halfwidth are scaled to hatch repeat distance.
  coords = coords / scale;
  float halfwidth = 0.5*v_hatch_weight / scale; // Half the hatch linewidth.

  // Default is to return fraction of zero, i.e. no pattern.
  float dist = u_antialias;

  if (hatch_pattern == hatch_dot) {
    const float dot_radius = 0.25;
    dist = length(wrap(coords)) - dot_radius;
  }
  else if (hatch_pattern == hatch_ring) {
    const float ring_radius = 0.25;
    dist = abs(length(wrap(coords)) - ring_radius) - halfwidth;
  }
  else if (hatch_pattern == hatch_horizontal_line) {
    dist = abs(wrap(coords.y)) - halfwidth;
  }
  else if (hatch_pattern == hatch_vertical_line) {
    dist = abs(wrap(coords.x)) - halfwidth;
  }
  else if (hatch_pattern == hatch_cross) {
    dist = min(abs(wrap(coords.x)), abs(wrap(coords.y))) - halfwidth;
  }
  else if (hatch_pattern == hatch_horizontal_dash) {
    // Dashes have square caps.
    const float halflength = 0.25;
    dist = max(abs(wrap(coords.y)),
               abs(wrap(coords.x) + 0.25) - halflength) - halfwidth;
  }
  else if (hatch_pattern == hatch_vertical_dash) {
    const float halflength = 0.25;
    dist = max(abs(wrap(coords.x)),
               abs(wrap(coords.y) + 0.25) - halflength) - halfwidth;
  }
  else if (hatch_pattern == hatch_spiral) {
    vec2 wrap2 = wrap(coords);
    float angle = wrap(atan(wrap2.y, wrap2.x) / (2.0*PI));
    // Canvas spiral radius increases by scale*pi/15 each rotation.
    const float dr = PI/15.0;
    float radius = length(wrap2);
    // At any angle, spiral lines are equally spaced dr apart.
    // Find distance to nearest of these lines.
    float frac = fract((radius - dr*angle) / dr); // 0 to 1.
    dist = dr*(abs(frac - 0.5));
    dist = min(dist, radius) - halfwidth; // Consider center point also.
  }
  else if (hatch_pattern == hatch_right_diagonal_line) {
    dist = abs(wrap(2.0*coords.x + coords.y))/sqrt(5.0) - halfwidth;
  }
  else if (hatch_pattern == hatch_left_diagonal_line) {
    dist = abs(wrap(2.0*coords.x - coords.y))/sqrt(5.0) - halfwidth;
  }
  else if (hatch_pattern == hatch_diagonal_cross) {
    coords = vec2(coords.x + coords.y + 0.5, coords.x - coords.y + 0.5);
    dist = min(abs(wrap(coords.x)), abs(wrap(coords.y))) / SQRT2 - halfwidth;
  }
  else if (hatch_pattern == hatch_right_diagonal_dash) {
    float across = coords.x + coords.y + 0.5;
    dist = abs(wrap(across)) / SQRT2; // Distance to nearest solid line.

    across = floor(across); // Offset for dash.
    float along = wrap(0.5*(coords.x - coords.y + across));
    const float halflength = 0.25;
    along = abs(along) - halflength; // Distance along line.

    dist = max(dist, along) - halfwidth;
  }
  else if (hatch_pattern == hatch_left_diagonal_dash) {
    float across = coords.x - coords.y + 0.5;
    dist = abs(wrap(across)) / SQRT2; // Distance to nearest solid line.

    across = floor(across); // Offset for dash.
    float along = wrap(0.5*(coords.x + coords.y + across));
    const float halflength = 0.25;
    along = abs(along) - halflength; // Distance along line.

    dist = max(dist, along) - halfwidth;
  }
  else if (hatch_pattern == hatch_horizontal_wave) {
    float wrapx = wrap(coords.x);
    float wrapy = wrap(coords.y - 0.25 + abs(wrapx));
    dist = abs(wrapy) / SQRT2 - halfwidth;
  }
  else if (hatch_pattern == hatch_vertical_wave) {
    float wrapy = wrap(coords.y);
    float wrapx = wrap(coords.x - 0.25 + abs(wrapy));
    dist = abs(wrapx) / SQRT2 - halfwidth;
  }
  else if (hatch_pattern == hatch_criss_cross) {
    float plus = min(abs(wrap(coords.x)), abs(wrap(coords.y)));

    coords = vec2(coords.x + coords.y + 0.5, coords.x - coords.y + 0.5);
    float X = min(abs(wrap(coords.x)), abs(wrap(coords.y))) / SQRT2;

    dist = min(plus, X) - halfwidth;
  }

  return distance_to_fraction(dist*scale);
}
#endif

void main()
{
  int line_cap = int(v_line_cap + 0.5);
  int line_join = int(v_line_join + 0.5);
#ifdef HATCH
  int hatch_pattern = int(v_hatch_pattern + 0.5);
#endif

  float dist = marker_distance(v_coords, line_cap, line_join);

#ifdef LINE_ONLY
  vec4 color = vec4(0.0, 0.0, 0.0, 0.0);
#else
  float fill_frac = fill_fraction(dist);
  vec4 color = fractional_color(v_fill_color, fill_frac);
#endif

#if defined(HATCH) && !defined(LINE_ONLY)
  if (hatch_pattern > 0 && fill_frac > 0.0) {
    float hatch_frac = hatch_fraction(v_hatch_coords, hatch_pattern);
    vec4 hatch_color = fractional_color(v_hatch_color, hatch_frac*fill_frac);
    color = blend_colors(hatch_color, color);
  }
#endif

  float line_frac = line_fraction(dist);

#ifdef APPEND_DOT
  line_frac = max(line_frac, dot_fraction(v_coords));
#endif
#ifdef APPEND_CROSS
  line_frac = max(line_frac, line_fraction(one_cross(v_coords, line_cap, 0.5*v_size.x)));
#endif
#ifdef APPEND_CROSS_2
  vec2 lengths = vec2(v_size.x/3.0, v_size.x/2.0);
  line_frac = max(line_frac, line_fraction(one_cross_2(v_coords, line_cap, lengths)));
#endif
#ifdef APPEND_X
  vec2 p = vec2((v_coords.x + v_coords.y)/SQRT2, (v_coords.x - v_coords.y)/SQRT2);
  line_frac = max(line_frac, line_fraction(one_cross(p, line_cap, APPEND_X_LEN)));
#endif
#ifdef APPEND_Y
  line_frac = max(line_frac, line_fraction(one_y(v_coords, line_cap, 0.5*v_size.x)));
#endif

  if (line_frac > 0.0) {
    vec4 line_color = fractional_color(v_line_color, line_frac);
    color = blend_colors(line_color, color);
  }

  gl_FragColor = color;
}
