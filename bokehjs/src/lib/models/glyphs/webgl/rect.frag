precision mediump float;

const float SQRT2 = sqrt(2.0);
const float INVSQRT2 = 1.0/SQRT2;
const float PI = 3.14159265358979323846;

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

varying float v_linewidth;
varying vec2 v_size;
varying vec4 v_line_color;
varying vec4 v_fill_color;
varying float v_line_join;
varying vec2 v_coords;
#ifdef HATCH
varying float v_hatch_pattern;
varying float v_hatch_scale;
varying float v_hatch_weight;
varying vec4 v_hatch_color;
varying vec2 v_hatch_coords;
#endif

// Distance is zero on edge of marker, +ve outside and -ve inside.
float marker_distance(vec2 p, int line_join)
{
  vec2 dist2 = abs(p) - v_size/2.0;
  float dist = max(dist2.x, dist2.y);

  if (dist2.x > 0.0 && dist2.y > 0.0) {
    // Outside of corner needs correct join, default is miter.
    if (line_join == round_join)
      dist = length(dist2);
    else if (line_join == bevel_join) {
      vec2 normal = vec2(INVSQRT2, INVSQRT2);
      dist = dot(dist2, normal) + 0.5*v_linewidth*(1.0 - INVSQRT2);
    }
  }

  return dist;
}

// Convert distance from edge of marker to fraction in range 0 to 1, depending
// on antialiasing width.
float distance_to_fraction(float dist)
{
  return 1.0 - smoothstep(-0.5*u_antialias, 0.5*u_antialias, dist);
}

// Return fraction from 0 (no fill color) to 1 (full fill color).
float fill_fraction(float dist)
{
  return distance_to_fraction(dist);
}

// Return fraction in range 0 (no line color) to 1 (full line color).
float line_fraction(float dist)
{
  return distance_to_fraction(abs(dist) - 0.5*v_linewidth);
}

// Return fraction (in range 0 to 1) of a color, with premultiplied alpha.
vec4 fractional_color(vec4 color, float fraction)
{
  color.a *= fraction;
  color.rgb *= color.a;
  return color;
}

// Blend colors that have premultiplied alpha.
vec4 blend_colors(vec4 src, vec4 dest)
{
  return (1.0 - src.a)*dest + src;
}

#ifdef HATCH
// Wrap coordinate(s) by removing integer part to give distance from center of
// repeat, in the range -0.5 to +0.5.
float wrap(float x)
{
  return fract(x) - 0.5;
}

vec2 wrap(vec2 xy)
{
  return fract(xy) - 0.5;
}

// Return fraction from 0 (no hatch color) to 1 (full hatch color).
float hatch_fraction(vec2 coords, int hatch_pattern)
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
  int line_join = int(v_line_join + 0.5);
#ifdef HATCH
  int hatch_pattern = int(v_hatch_pattern + 0.5);
#endif

  float dist = marker_distance(v_coords, line_join);

  float fill_frac = fill_fraction(dist);
  vec4 color = fractional_color(v_fill_color, fill_frac);

#ifdef HATCH
  if (hatch_pattern > 0 && fill_frac > 0.0) {
    float hatch_frac = hatch_fraction(v_hatch_coords, hatch_pattern);
    vec4 hatch_color = fractional_color(v_hatch_color, hatch_frac*fill_frac);
    color = blend_colors(hatch_color, color);
  }
#endif

  float line_frac = line_fraction(dist);
  if (line_frac > 0.0) {
    vec4 line_color = fractional_color(v_line_color, line_frac);
    color = blend_colors(line_color, color);
  }

  gl_FragColor = color;
}
