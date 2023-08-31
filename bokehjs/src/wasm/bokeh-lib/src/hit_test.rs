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
  fn hit_test(geometry: Geometry) -> Selection {
    match geometry {
      Geometry::Point {..} => Selection {},
      Geometry::Span {..} => Selection {},
      Geometry::Rect {..} => Selection {},
      Geometry::Poly {..} => Selection {},
    }
  }

  //fn hit_point(geometry: Geometry::Point) -> Selection;
  //fn hit_span(geometry: Geometry::Span) -> Selection;
  //fn hit_rect(geometry: Geometry::Rect) -> Selection;
  //fn hit_poly(geometry: Geometry::Poly) -> Selection;
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

pub enum Spec<'a, T> {
  Field {
    name: &'a str,
  },
  Value {
    value: T,
  },
}

pub struct XCoordinateSpec;
pub struct YCoordinateSpec;
pub struct NumberSpec;

pub enum LRTBGlyph {
  Block {
    x: XCoordinateSpec,
    y: YCoordinateSpec,
    width: NumberSpec,
    height: NumberSpec,
  },
  Quad {
    right: XCoordinateSpec,
    bottom: YCoordinateSpec,
    left: XCoordinateSpec,
    top: YCoordinateSpec,
  },
  HBar {
    left: XCoordinateSpec,
    y: YCoordinateSpec,
    height: NumberSpec,
    right: XCoordinateSpec,
  },
  VBar {
    x: XCoordinateSpec,
    bottom: YCoordinateSpec,
    width: NumberSpec,
    top: YCoordinateSpec,
  },
}

pub enum Uniform {
  Scalar,
  Vector,
}

pub struct LRTBData {
  pub sleft: Vec<f64>,
  pub sright: Vec<f64>,
  pub stop: Vec<f64>,
  pub sbottom: Vec<f64>,
}

pub trait Glyph {
}

pub trait Anchored {
  type Type;

  fn get_anchor_point(glyph: Self::Type, anchor: Anchor, i: usize, spt: Point) -> Option<Point>;
}

impl Anchored for LRTBGlyph {
  type Type = LRTBData;

  fn get_anchor_point(glyph: Self::Type, anchor: Anchor, i: usize, _spt: Point) -> Option<Point> {
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

use static_aabb2d_index::*;

pub fn spatial_index(n: usize) -> usize {
  // create builder for index containing 4 axis aligned bounding boxes
  // index also supports integers and custom types that implement the IndexableNum trait
  let mut builder: StaticAABB2DIndexBuilder<f64> = StaticAABB2DIndexBuilder::new(4 + n);
  // add bounding boxes to the index
  // add takes in (min_x, min_y, max_x, max_y) of the bounding box
  builder.add(0.0, 0.0, 2.0, 2.0);
  builder.add(-1.0, -1.0, 3.0, 3.0);
  builder.add(0.0, 0.0, 1.0, 3.0);
  builder.add(4.0, 2.0, 16.0, 8.0);

  for i in 0..n {
    let k = i as f64 + 1.0;
    builder.add(k*4.0, k*2.0, k*16.0, k*8.0);
  }
  // note build may return an error if the number of added boxes does not equal the static size
  // given at the time the builder was created or the type used fails to cast to/from a u16
  let index: StaticAABB2DIndex<f64> = builder.build().unwrap();
  // query the created index (min_x, min_y, max_x, max_y)
  let query_results = index.query(-1.0, -1.0, -0.5, -0.5);
  // query_results holds the index positions of the boxes that overlap with the box given
  // (positions are according to the order boxes were added the index builder)
  assert_eq!(query_results, vec![1]);
  // the query may also be done with a visiting function that can stop the query early
  let mut visited_results: Vec<usize> = Vec::new();
  let mut visitor = |box_added_pos: usize| -> Control<()> {
      visited_results.push(box_added_pos);
      // return continue to continue visiting results, break to stop early
      Control::Continue
  };

  index.visit_query(-1.0, -1.0, -0.5, -0.5, &mut visitor);
  visited_results.len()
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
