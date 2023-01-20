#![allow(non_snake_case)]

struct Coeffs {
  h00: f64,
  h01: f64,
  h10: f64,
  h11: f64,
}

pub struct SplineOptions {
  T: usize,
  tension: f64,
  closed: bool,
}

impl Default for SplineOptions {
  fn default() -> Self {
    SplineOptions {T: 10, tension: 0.5, closed: false}
  }
}

pub fn catmullrom_spline(x: &[f64], y: &[f64], options: SplineOptions) -> (Vec<f64>, Vec<f64>) {
  /* Centripetal Catmull-Rom spline. */
  assert!(x.len() == y.len());

  let SplineOptions {T, tension, closed} = options;

  let n = x.len();
  let N = if closed { n + 1 } else { n };

  let mut xx: Vec<f64> = Vec::with_capacity(N + 2);
  let mut yy: Vec<f64> = Vec::with_capacity(N + 2);
  xx.resize(N + 2, 0.0);
  yy.resize(N + 2, 0.0);
  xx[1..=n].clone_from_slice(&x);
  yy[1..=n].clone_from_slice(&y);

  if closed {
    xx[0] = x[n-1];
    yy[0] = y[n-1];
    xx[N] = x[0];
    yy[N] = y[0];
    xx[N+1] = x[1];
    yy[N+1] = y[1];
  } else {
    xx[0] = x[0];
    yy[0] = y[0];
    xx[N+1] = x[n-1];
    yy[N+1] = y[n-1];
  }

  let mut basis: Vec<Coeffs> = Vec::with_capacity(T + 1);

  for j in 0..=T {
    let t = (j as f64)/(T as f64);
    let t_2 = t*t;
    let t_3 = t*t_2;

    basis.push(Coeffs {
      h00:  2.0*t_3 - 3.0*t_2     + 1.0,
      h01: -2.0*t_3 + 3.0*t_2,
      h10:      t_3 - 2.0*t_2 + t,
      h11:      t_3 -     t_2,
    })
  }

  let mut xt: Vec<f64> = Vec::with_capacity((N - 1)*(T + 1));
  let mut yt: Vec<f64> = Vec::with_capacity((N - 1)*(T + 1));

  xt.resize((N - 1)*(T + 1), 0.0);
  yt.resize((N - 1)*(T + 1), 0.0);

  let mut k = 0;

  for i in 1..N {
    let t0x = (xx[i+1] - xx[i-1])*tension;
    let t0y = (yy[i+1] - yy[i-1])*tension;
    let t1x = (xx[i+2] - xx[i])*tension;
    let t1y = (yy[i+2] - yy[i])*tension;

    for j in 0..=T {
      let Coeffs {h00, h01, h10, h11} = basis[j];

      xt[k] = h00*xx[i] + h01*xx[i+1] + h10*t0x + h11*t1x;
      yt[k] = h00*yy[i] + h01*yy[i+1] + h10*t0y + h11*t1y;

      k += 1;
    }
  }

  (xt, yt)
}

#[cfg(test)]
mod tests {
  use super::*;
  use approx::assert_ulps_eq;

  #[test]
  fn test_catmullrom_spline() {
    let x = [1.0, 3.0, 7.0, 8.0];
    let y = [1.0, 8.0, 3.0, 5.0];

    let options = SplineOptions {T: 20, ..Default::default()};
    let (xt, yt) = catmullrom_spline(&x, &y, options);

    let _xt = [
      1.0, 1.0525, 1.11, 1.1725, 1.24, 1.3125, 1.39, 1.4725, 1.56, 1.6525, 1.75, 1.8525, 1.96,
      2.0725, 2.19, 2.3125, 2.44, 2.5725, 2.71, 2.8525, 3.0, 3.0, 3.1584375, 3.3325, 3.5203125,
      3.72, 3.9296875, 4.1475, 4.3715625, 4.6, 4.8309375, 5.0625, 5.2928125, 5.52, 5.7421875,
      5.9575, 6.1640625, 6.36, 6.5434375, 6.7125, 6.8653125, 7.0, 7.0, 7.118875, 7.226,
      7.322124999999999, 7.408, 7.484375, 7.552, 7.611625, 7.664, 7.709874999999999, 7.75,
      7.785125, 7.816, 7.843375, 7.868, 7.890625, 7.912, 7.932874999999999, 7.954, 7.976125, 8.0,
    ];
    let _yt = [
      1.0, 1.2063125, 1.4705, 1.7854375, 2.144, 2.5390625, 2.9635, 3.4101874999999997, 3.872,
      4.3418125, 4.8125, 5.2769375, 5.728, 6.1585624999999995, 6.5615, 6.9296875, 7.256,
      7.533312499999998, 7.7545, 7.9124375, 8.0, 8.0, 8.012437499999999, 7.9545, 7.8333125,
      7.656, 7.4296875, 7.1615, 6.8585625, 6.528, 6.176937499999999, 5.8125, 5.441812499999999,
      5.072, 4.7101875, 4.3635, 4.0390625, 3.744, 3.4854375, 3.2705, 3.1063124999999987, 3.0,
      3.0, 2.9444375, 2.9255, 2.9398125, 2.984, 3.0546875, 3.1485, 3.2620624999999994, 3.392,
      3.5349375, 3.6875, 3.8463125, 4.008, 4.1691875, 4.3265, 4.4765625, 4.616, 4.741437499999999,
      4.8495, 4.9368125, 5.0,
    ];

    for (xi, xj) in xt.iter().zip(_xt.iter()) {
      assert_ulps_eq!(xi, xj);
    }

    for (yi, yj) in yt.iter().zip(_yt.iter()) {
      assert_ulps_eq!(yi, yj);
    }
  }
}
