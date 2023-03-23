use bokeh_lib::bezier::{qbb, cbb, QBezier, CBezier, Rect};

#[test]
fn test_qbb() {
  let r0 = qbb(&QBezier {x0: 0.0, y0: 0.0, cx: 1.0, cy: 0.0, x1: 2.0, y1: 0.0});
  assert_eq!(r0, Rect {x0: 0.0, x1: 2.0, y0: 0.0, y1: 0.0});

  let r1 = qbb(&QBezier {x0: 0.0, y0: 0.0, cx: 0.0, cy: 1.0, x1: 0.0, y1: 2.0});
  assert_eq!(r1, Rect {x0: 0.0, x1: 0.0, y0: 0.0, y1: 2.0});

  let r2 = qbb(&QBezier {x0: 0.0, y0: 0.0, cx: 1.0, cy: 2.0, x1: 2.0, y1: 0.0});
  assert_eq!(r2, Rect {x0: 0.0, x1: 2.0, y0: 0.0, y1: 1.0});

  let r3 = qbb(&QBezier {x0: 0.0, y0: 0.0, cx: 1.0, cy: -2.0, x1: 2.0, y1: 0.0});
  assert_eq!(r3, Rect {x0: 0.0, x1: 2.0, y0: -1.0, y1: 0.0});

  //let r4 = qbb(&QBezier {x0: 0.0, y0: 0.0, cx: -1.0, cy: 2.0, x1: 2.0, y1: 1.0});
  //assert_eq!(r4, Rect {x0: -0.25, x1: 2.0, y0: 0.0, y1: 4.0/3.0});
}

#[test]
fn test_cbb() {
  let r0 = cbb(&CBezier {x0: 0.0, y0: 0.0, cx0: 1.0,  cy0: 0.0, cx1: 2.0,  cy1: 0.0, x1: 3.0, y1: 0.0});
  assert_eq!(r0, Rect {x0: 0.0, x1: 3.0, y0:  0.0, y1: 0.0});

  let r1 = cbb(&CBezier {x0: 0.0, y0: 0.0, cx0: 0.0,  cy0: 1.0, cx1: 0.0,  cy1: 2.0, x1: 0.0, y1: 3.0});
  assert_eq!(r1, Rect {x0: 0.0, x1: 0.0, y0:  0.0, y1: 3.0});

  let r2 = cbb(&CBezier {x0: 0.0, y0: 0.0, cx0: 0.0,  cy0: 2.0, cx1: 3.0,  cy1: 2.0, x1: 3.0, y1: 0.0});
  assert_eq!(r2, Rect {x0: 0.0, x1: 3.0, y0:  0.0, y1: 1.5});

  let r3 = cbb(&CBezier {x0: 0.0, y0: 0.0, cx0: 0.0, cy0: -2.0, cx1: 3.0, cy1: -2.0, x1: 3.0, y1: 0.0});
  assert_eq!(r3, Rect {x0: 0.0, x1: 3.0, y0: -1.5, y1: 0.0});
}
