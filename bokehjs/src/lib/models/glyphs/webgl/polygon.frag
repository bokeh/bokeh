precision mediump float;

uniform float u_antialias;

varying vec4 v_fill_color;
varying float v_edge_distance;

// Hatch pattern code is duplicated from marker.frag. Keep both in sync.
#ifdef HATCH
const float SQRT2 = sqrt(2.0);
const float SQRT3 = sqrt(3.0);
const float PI = 3.14159265358979323846;

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

varying float v_hatch_pattern;
varying float v_hatch_scale;
varying float v_hatch_weight;
varying vec4 v_hatch_color;
varying vec2 v_hatch_coords;

float distance_to_fraction(in float dist)
{
  return 1.0 - smoothstep(-0.5*u_antialias, 0.5*u_antialias, dist);
}

vec4 fractional_color(in vec4 color, in float fraction)
{
  color.a *= fraction;
  color.rgb *= color.a;
  return color;
}

vec4 blend_colors(in vec4 src, in vec4 dest)
{
  return (1.0 - src.a)*dest + src;
}

float wrap(in float x)
{
  return fract(x) - 0.5;
}

vec2 wrap(in vec2 xy)
{
  return fract(xy) - 0.5;
}

float hatch_fraction(in vec2 coords, in int hatch_pattern)
{
  float scale = v_hatch_scale;

  coords = coords / scale;
  float halfwidth = 0.5*v_hatch_weight / scale;

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
    const float dr = PI/15.0;
    float radius = length(wrap2);
    float frac = fract((radius - dr*angle) / dr);
    dist = dr*(abs(frac - 0.5));
    dist = min(dist, radius) - halfwidth;
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
    dist = abs(wrap(across)) / SQRT2;

    across = floor(across);
    float along = wrap(0.5*(coords.x - coords.y + across));
    const float halflength = 0.25;
    along = abs(along) - halflength;

    dist = max(dist, along) - halfwidth;
  }
  else if (hatch_pattern == hatch_left_diagonal_dash) {
    float across = coords.x - coords.y + 0.5;
    dist = abs(wrap(across)) / SQRT2;

    across = floor(across);
    float along = wrap(0.5*(coords.x + coords.y + across));
    const float halflength = 0.25;
    along = abs(along) - halflength;

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
  vec4 color = v_fill_color;
  color = vec4(color.rgb * color.a, color.a);

#ifdef HATCH
  // Hatch is blended over fill in a single pass, then the combined result is
  // composited onto the background by hardware blending. This is mathematically
  // equivalent to the Canvas 2D two-pass approach (fill composited onto
  // background, then hatch composited on top) when the background is opaque.
  // Minor visual differences in hatch line edge sharpness may occur because
  // this shader computes hatch patterns analytically per-pixel using smoothstep
  // antialiasing, whereas Canvas 2D rasterizes a small pattern tile and tiles
  // it with the browser's image filtering.
  int hatch_pattern = int(v_hatch_pattern + 0.5);
  if (hatch_pattern > 0) {
    float hatch_frac = hatch_fraction(v_hatch_coords, hatch_pattern);
    vec4 hatch_color = fractional_color(v_hatch_color, hatch_frac);
    color = blend_colors(hatch_color, color);
  }
#endif

  // Edge anti-aliasing: fade alpha near polygon boundary edges.
  float edge_alpha = smoothstep(0.0, u_antialias, v_edge_distance);
  color *= edge_alpha;  // premultiplied alpha

  gl_FragColor = color;
}
