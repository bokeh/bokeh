#![allow(non_snake_case, clippy::assign_op_pattern)]

pub struct Point<T = f64> {
  pub x: T,
  pub y: T,
}

#[derive(Debug, PartialEq)]
pub struct AffineTransform {
  a: f64,
  b: f64,
  c: f64,
  d: f64,
  e: f64,
  f: f64,
}

impl AffineTransform {
  pub fn new() -> Self {
    AffineTransform {
      a: 1.0,
      b: 0.0,
      c: 0.0,
      d: 1.0,
      e: 0.0,
      f: 0.0,
    }
  }

  pub fn reset(&mut self) {
    self.a = 1.0;
    self.b = 0.0;
    self.c = 0.0;
    self.d = 1.0;
    self.e = 0.0;
    self.f = 0.0;
  }

  pub fn is_identity(&self) -> bool {
    let &AffineTransform {a, b, c, d, e, f} = self;
    a == 1.0 && b == 0.0 && c == 0.0 && d == 1.0 && e == 0.0 && f == 0.0
  }

  pub fn apply(&self, xy: &Point) -> Point {
    let &AffineTransform {a, b, c, d, e, f} = self;
    let &Point {x, y} = xy;
    Point {
      x: a*x + c*y + e,
      y: b*x + d*y + f,
    }
  }

  pub fn transform(mut self, a: f64, b: f64, c: f64, d: f64, e: f64, f: f64) -> Self {
    self.a = self.a*a + self.c*b;
    self.c = self.a*c + self.c*d;
    self.e = self.a*e + self.c*f + self.e;
    self.b = self.b*a + self.d*b;
    self.d = self.b*c + self.d*d;
    self.f = self.b*e + self.d*f + self.f;
    self
  }

  pub fn translate(self, tx: f64, ty: f64) -> Self {
    self.transform(1.0, 0.0, 0.0, 1.0, tx, ty)
  }

  pub fn scale(self, cx: f64, cy: f64) -> Self {
    self.transform(cx, 0.0, 0.0, cy, 0.0, 0.0)
  }

  pub fn skew(self, sx: f64, sy: f64) -> Self {
    self.transform(1.0, sy, sx, 1.0, 0.0, 0.0)
  }

  pub fn rotate(self, angle: f64) -> Self {
    if angle == 0.0 {
      return self
    }
    let (s, c) = angle.sin_cos();
    self.transform(c, s, -s, c, 0.0, 0.0)
  }

  pub fn rotate_ccw(self, angle: f64) -> Self {
    self.rotate(-angle)
  }

  pub fn rotate_around(self, xy: &Point, angle: f64) -> Self {
    let &Point {x, y} = xy;
    self.translate(x, y)
        .rotate(angle)
        .translate(-x, -y)
  }

  pub fn translate_x(self, tx: f64) -> Self {
    self.translate(tx, 0.0)
  }

  pub fn translate_y(self, ty: f64) -> Self {
    self.translate(0.0, ty)
  }

  pub fn flip(self) -> Self {
    self.scale(-1.0, -1.0)
  }

  pub fn flip_x(self) -> Self {
    self.scale(1.0, -1.0)
  }

  pub fn flip_y(self) -> Self {
    self.scale(-1.0, 1.0)
  }
}

impl Default for AffineTransform {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::AffineTransform;

  #[test]
  fn test_AffineTransform_new() {
    let tr = AffineTransform::new();
    assert_eq!(tr, AffineTransform {a: 1.0, b: 0.0, c: 0.0, d: 1.0, e: 0.0, f: 0.0});
  }

  #[test]
  fn test_AffineTransform_translate() {
    let tr = AffineTransform::new().translate(2.0, 3.0);
    assert_eq!(tr, AffineTransform {a: 1.0, b: 0.0, c: 0.0, d: 1.0, e: 2.0, f: 3.0});
  }
}
