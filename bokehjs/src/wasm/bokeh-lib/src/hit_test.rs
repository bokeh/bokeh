pub enum Direction {H, V}

pub enum Geometry<'a> {
  Point {
    sx: f64,
    sy: f64,
  },
  Span {
    direction: Direction,
    sx: f64,
    sy: f64,
  },
  Rect {
    sx0: f64,
    sx1: f64,
    sy0: f64,
    sy1: f64,
  },
  Poly {
    sxs: &'a [f64],
    sys: &'a [f64],
  },
}

pub struct Selection {}

pub trait HitTest {
  fn hit_test(geometry: Geometry) -> Selection;
}

pub enum Anchor {
  TopLeft,
  Top,
  TopCenter,
  TopRight,
  BottomLeft,
  Bottom,
  BottomCenter,
  BottomRight,
  Left,
  CenterLeft,
  Center,
  CenterCenter,
  Right,
  CenterRight,
}

pub struct Point {
  pub x: f64,
  pub y: f64,
}

pub struct LRTBGlyph {
  pub sleft: Vec<f64>,
  pub sright: Vec<f64>,
  pub stop: Vec<f64>,
  pub sbottom: Vec<f64>,
}

pub fn get_anchor_point(glyph: LRTBGlyph, anchor: Anchor, i: usize, _spt: Point) -> Option<Point> {
  let left = f64::min(glyph.sleft[i], glyph.sright[i]);
  let right = f64::max(glyph.sright[i], glyph.sleft[i]);
  let top = f64::min(glyph.stop[i], glyph.sbottom[i]);
  let bottom = f64::max(glyph.sbottom[i], glyph.stop[i]);

  let hcenter = (left + right)/2.0;
  let vcenter = (top + bottom)/2.0;

  let (x, y) = match anchor {
    Anchor::TopLeft                       => (left, top),
    Anchor::Top    | Anchor::TopCenter    => (hcenter, top),
    Anchor::TopRight                      => (right, top),
    Anchor::BottomLeft                    => (left, bottom),
    Anchor::Bottom | Anchor::BottomCenter => (hcenter, bottom),
    Anchor::BottomRight                   => (right, bottom),
    Anchor::Left   | Anchor::CenterLeft   => (left, vcenter),
    Anchor::Center | Anchor::CenterCenter => (hcenter, vcenter),
    Anchor::Right  | Anchor::CenterRight  => (right, vcenter),
  };

  Some(Point {x, y})
}

pub enum Uniform {
  Scalar,
  Vector,
}

use crate::scales::Scale;

pub struct SPoint {
  pub sx: f64,
  pub sy: f64,
}

pub fn invert_pt(pt: &SPoint, x_scale: &impl Scale, y_scale: &impl Scale) -> (f64, f64) {
  let x = x_scale.invert(pt.sx);
  let y = y_scale.invert(pt.sy);
  (x, y)
}

pub fn invert(pt: &SPoint) -> Vec<(f64, f64)> {
  use crate::scales::{LinearScale, LogScale, Range};

  let x_source_range = Range {start: 0.0, end: 10.0};
  let y_source_range = Range {start: 1.0, end: 10000.0};

  let x_target_range = Range {start: 0.0, end: 300.0};
  let y_target_range = Range {start: 1.0, end: 300.0};

  let x0_scale = LinearScale::new(&x_source_range, &x_target_range);
  let y0_scale = LinearScale::new(&y_source_range, &y_target_range);

  let x1_scale = LinearScale::new(&x_source_range, &x_target_range);
  let y1_scale = LogScale::new(&y_source_range, &y_target_range);

  let mut result: Vec<_> = Default::default();
  result.push(invert_pt(pt, &x0_scale, &y0_scale));
  result.push(invert_pt(&SPoint {sx: 5.0, sy: 7.0}, &x0_scale, &y0_scale));
  result.push(invert_pt(pt, &x1_scale, &y1_scale));
  result.push(invert_pt(&SPoint {sx: 5.0, sy: 7.0}, &x1_scale, &y1_scale));
  result
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::scales::{LinearScale, LogScale, Range};

  #[test]
  fn test_invert_pt() {
    let x_range = Range {start: 0.0, end: 10.0};
    let y_range = Range {start: 1.0, end: 10000.0};
    let xt_range = Range {start: 0.0, end: 300.0};
    let yt_range = Range {start: 1.0, end: 300.0};
    let x_scale = LinearScale::new(&x_range, &xt_range);
    let y_scale = LogScale::new(&y_range, &yt_range);
    invert_pt(&SPoint {sx: 0.0, sy: 0.0}, &x_scale, &y_scale);
  }
}
