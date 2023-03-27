use ndarray::prelude::*;

pub fn some(n: u32) -> f64 {
  let arr = Array::zeros((n as usize, 2).f());
  arr.mapv(f64::sin).sum()
}
