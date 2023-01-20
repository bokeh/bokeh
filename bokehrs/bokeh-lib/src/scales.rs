#[derive(Clone, Copy)]
pub struct Range {
  start: f64,
  end: f64,
}

pub trait Scale {
  fn new(source: &Range, target: &Range) -> Self;
  fn compute(&self, x: f64) -> f64;
  fn invert(&self, sx: f64) -> f64;
}

pub struct LinearScale {
  factor: f64,
  offset: f64,
}

impl Scale for LinearScale {
  fn new(source: &Range, target: &Range) -> Self {
    let (factor, offset) = Self::_compute_state(source, target);
    Self {factor, offset}
  }

  fn compute(&self, x: f64) -> f64 {
    self.factor*x + self.offset
  }

  fn invert(&self, sx: f64) -> f64 {
    (sx - self.offset) / self.factor
  }
}

impl LinearScale {
  fn _compute_state(source: &Range, target: &Range) -> (f64, f64) {
    let factor = (target.end - target.start)/(source.end - source.start);
    let offset = -factor*source.start + target.start;
    (factor, offset)
  }
}

pub struct LogScale {
  factor: f64,
  offset: f64,
  inter_factor: f64,
  inter_offset: f64,
}

impl Scale for LogScale {
  fn new(source: &Range, target: &Range) -> Self {
    Self::_compute_state(source, target)
  }

  fn compute(&self, x: f64) -> f64 {
    if self.inter_factor == 0.0 {
      0.0
    } else {
      let value = (x.ln() - self.inter_offset) / self.inter_factor;
      if value.is_finite() {
        value*self.factor + self.offset
      } else {
        f64::NAN
      }
    }
  }

  fn invert(&self, sx: f64) -> f64 {
    let value = (sx - self.offset) / self.factor;
    (self.inter_factor*value + self.inter_offset).exp()
  }
}

impl LogScale {
  fn _get_safe_factor(orig_start: f64, orig_end: f64) -> (f64, f64) {
    let start = orig_start.max(0.0);
    let end = orig_end.max(0.0);

    if start != end {
      (start, end)
    } else if start == 0.0 {
      (1.0, 10.0)
    } else {
      let log_val = start.log10();
      let start = 10.0_f64.powi(log_val.floor() as i32);

      let end = {
        if log_val.ceil() != log_val.floor() {
          10.0_f64.powi(log_val.ceil() as i32)
        } else {
          10.0_f64.powi(log_val.ceil() as i32 + 1)
        }
      };

      (start, end)
    }
  }

  fn _compute_state(source: &Range, target: &Range) -> Self {
    let (start, end) = Self::_get_safe_factor(source.start, source.end);

    let (inter_factor, inter_offset) =
      if start == 0.0 {
        (end.ln(), 0.0)
      } else {
        ((end / start).ln(), start.ln())
      };

    Self {
      factor: target.end - target.start,
      offset: target.start,
      inter_factor,
      inter_offset,
    }
  }
}
