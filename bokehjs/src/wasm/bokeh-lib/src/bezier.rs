#[derive(PartialEq, Debug)]
pub struct Rect {
  pub x0: f64,
  pub x1: f64,
  pub y0: f64,
  pub y1: f64,
}

#[derive(Debug)]
pub struct QBezier {
  pub x0: f64, pub y0: f64,
  pub x1: f64, pub y1: f64,
  pub cx: f64, pub cy: f64,
}

#[derive(Debug)]
pub struct CBezier {
  pub x0: f64,  pub y0: f64,
  pub x1: f64,  pub y1: f64,
  pub cx0: f64, pub cy0: f64,
  pub cx1: f64, pub cy1: f64,
}

/*
 * Formula from: http://pomax.nihongoresources.com/pages/bezier/
 *
 * if segment is quadratic bezier do:
 *   for both directions do:
 *     if control between start and end, compute linear bounding box
 *     otherwise, compute
 *       bound = u(1-t)^2 + 2v(1-t)t + wt^2
 *         (with t = ((u-v) / (u-2v+w)), with {u = start, v = control, w = end})
 *       if control precedes start, min = bound, otherwise max = bound
 */
pub fn qbb(path: &QBezier) -> Rect {

  fn _qbb(u: f64, v: f64, w: f64) -> (f64, f64) {
    if v == (u + w)/2.0 {
      (u, w)
    } else {
      let t = (u - v) / (u - 2.0*v + w);
      let bd = u*(1.0 - t).powi(2) + 2.0*v*(1.0 - t)*t + w*t.powi(2);
      (u.min(w).min(bd), u.max(w).max(bd))
    }
  }

  let &QBezier {x0, x1, y0, y1, cx, cy} = path;

  let (x_min, x_max) = _qbb(x0, cx, x1);
  let (y_min, y_max) = _qbb(y0, cy, y1);

  Rect {
    x0: x_min, x1: x_max,
    y0: y_min, y1: y_max,
  }
}

// algorithm adapted from http://stackoverflow.com/a/14429749/3406693
pub fn cbb(path: &CBezier) -> Rect {
  let &CBezier {
    x0, y0,
    cx0: x1, cy0: y1,
    cx1: x2, cy1: y2,
    x1: x3, y1: y3,
  } = path;

  let mut tvalues: Vec<f64> = Vec::new();

  for i in 0..=2 {
    let a: f64;
    let b: f64;
    let c: f64;

    if i == 0 {
      b = 6.0*x0 - 12.0*x1 + 6.0*x2;
      a = -3.0*x0 + 9.0*x1 - 9.0*x2 + 3.0*x3;
      c = 3.0*x1 - 3.0*x0;
    } else {
      b = 6.0*y0 - 12.0*y1 + 6.0*y2;
      a = -3.0*y0 + 9.0*y1 - 9.0*y2 + 3.0*y3;
      c = 3.0*y1 - 3.0*y0;
    }

    if a.abs() < 1e-12 { // Numerical robustness
      if b.abs() < 1e-12 { // Numerical robustness
        continue
      }
      let t = -c / b;
      if 0.0 < t && t < 1.0 {
        tvalues.push(t)
      }
      continue
    }

    let b2ac = b.powi(2) - 4.0*c*a;
    let sqrtb2ac = b2ac.sqrt();

    if b2ac < 0.0 {
      continue
    }

    let t1 = (-b + sqrtb2ac) / (2.0*a);
    if 0.0 < t1 && t1 < 1.0 {
      tvalues.push(t1);
    }

    let t2 = (-b - sqrtb2ac) / (2.0*a);
    if 0.0 < t2 && t2 < 1.0 {
      tvalues.push(t2);
    }
  }

  let n = tvalues.len() + 2;
  let mut x_bounds: Vec<f64> = Vec::with_capacity(n);
  let mut y_bounds: Vec<f64> = Vec::with_capacity(n);

  for t in tvalues {
    let t2 = t*t;
    let t3 = t2*t;

    let mt = 1.0 - t;
    let mt2 = mt*mt;
    let mt3 = mt2*mt;

    let x = mt3*x0 + 3.0*mt2*t*x1 + 3.0*mt*t2*x2 + t3*x3;
    let y = mt3*y0 + 3.0*mt2*t*y1 + 3.0*mt*t2*y2 + t3*y3;

    x_bounds.push(x);
    y_bounds.push(y);
  }

  x_bounds.push(x0); x_bounds.push(x3);
  y_bounds.push(y0); y_bounds.push(y3);

  let (x_min, x_max) = minmax(&x_bounds);
  let (y_min, y_max) = minmax(&y_bounds);

  Rect {
    x0: x_min, x1: x_max,
    y0: y_min, y1: y_max,
  }
}

fn minmax(v: &[f64]) -> (f64, f64) {
  let mut min =  f64::INFINITY;
  let mut max = -f64::INFINITY;

  for &value in v {
    if !value.is_nan() {
      if value < min {
        min = value;
      }
      if value > max {
        max = value;
      }
    }
  }

  (min, max)
}
