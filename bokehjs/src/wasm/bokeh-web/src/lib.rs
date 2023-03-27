use wasm_bindgen::prelude::*;
use js_sys::{Array, Float64Array, Object, Reflect};
use bokeh_lib::bezier::{qbb, QBezier, Rect};

#[wasm_bindgen]
extern "C" {
  fn console(s: &str);
}

#[wasm_bindgen(inline_js = "export function set_prop(obj, prop, val) { obj[prop] = val; }")]
extern "C" {
  fn set_prop(obj: &Object, prop: &str, val: &JsValue);
}

#[wasm_bindgen]
pub fn catmullrom_spline(x: &[f64], y: &[f64]) -> Array {
  use bokeh_lib::splines::catmullrom_spline;
  let (xt, yt) = catmullrom_spline(x, y, Default::default());
  Array::of2(
    &Float64Array::from(&xt[..]),
    &Float64Array::from(&yt[..]),
  )
}

#[wasm_bindgen]
pub fn invert(sx: f64, sy: f64) -> Array {
  use bokeh_lib::hit_test::{SPoint, invert};
  let values = invert(&SPoint {sx, sy});
  values.iter().map(|&(x, y)| {
    Array::of2(
      &JsValue::from(x),
      &JsValue::from(y),
    )
  }).collect()
}

#[wasm_bindgen]
pub struct AABB {
  pub x0: f64,
  pub y0: f64,
  pub x1: f64,
  pub y1: f64,
}

#[wasm_bindgen]
pub fn quadratic_bezier(x0: f64, y0: f64, cx: f64, cy: f64, x1: f64, y1: f64) -> AABB {
  let result = qbb(&QBezier {x0, y0, cx, cy, x1, y1});
  let Rect {x0, y0, x1, y1} = result;
  AABB {x0, y0, x1, y1}
}

#[wasm_bindgen]
pub fn quadratic_bezier_array(x0: f64, y0: f64, cx: f64, cy: f64, x1: f64, y1: f64) -> Array {
  let result = qbb(&QBezier {x0, y0, cx, cy, x1, y1});
  let Rect {x0, y0, x1, y1} = result;
  Array::of4(
    &JsValue::from(x0),
    &JsValue::from(y0),
    &JsValue::from(x1),
    &JsValue::from(y1),
  )
}

#[wasm_bindgen]
pub fn quadratic_bezier_object(x0: f64, y0: f64, cx: f64, cy: f64, x1: f64, y1: f64) -> Object {
  let result = qbb(&QBezier {x0, y0, cx, cy, x1, y1});
  let Rect {x0, y0, x1, y1} = result;
  let obj = Object::new();
  Reflect::set(&obj, &JsValue::from("x0"), &JsValue::from(x0)).unwrap();
  Reflect::set(&obj, &JsValue::from("x1"), &JsValue::from(x1)).unwrap();
  Reflect::set(&obj, &JsValue::from("y0"), &JsValue::from(y0)).unwrap();
  Reflect::set(&obj, &JsValue::from("y1"), &JsValue::from(y1)).unwrap();
  obj
}

#[wasm_bindgen]
pub fn quadratic_bezier_result_object(x0: f64, y0: f64, cx: f64, cy: f64, x1: f64, y1: f64) -> Result<Object, JsValue> {
  let result = qbb(&QBezier {x0, y0, cx, cy, x1, y1});
  let Rect {x0, y0, x1, y1} = result;
  let obj = Object::new();
  Reflect::set(&obj, &JsValue::from("x0"), &JsValue::from(x0))?;
  Reflect::set(&obj, &JsValue::from("x1"), &JsValue::from(x1))?;
  Reflect::set(&obj, &JsValue::from("y0"), &JsValue::from(y0))?;
  Reflect::set(&obj, &JsValue::from("y1"), &JsValue::from(y1))?;
  Ok(obj)
}

#[wasm_bindgen]
pub fn quadratic_bezier_custom_object(x0: f64, y0: f64, cx: f64, cy: f64, x1: f64, y1: f64) -> Object {
  let result = qbb(&QBezier {x0, y0, cx, cy, x1, y1});
  let Rect {x0, y0, x1, y1} = result;
  let obj = Object::new();
  set_prop(&obj, "x0", &JsValue::from(x0));
  set_prop(&obj, "x1", &JsValue::from(x1));
  set_prop(&obj, "y0", &JsValue::from(y0));
  set_prop(&obj, "y1", &JsValue::from(y1));
  obj
}

macro_rules! object {
  {$($key:expr => $val:expr),* $(,)?} => {
    {
      let obj = js_sys::Object::new();
      $(
        set_prop(&obj, $key, &JsValue::from($val));
      )*
      obj
    }
  };
}

#[wasm_bindgen]
pub fn quadratic_bezier_macro_object(x0: f64, y0: f64, cx: f64, cy: f64, x1: f64, y1: f64) -> Object {
  let result = qbb(&QBezier {x0, y0, cx, cy, x1, y1});
  let Rect {x0, y0, x1, y1} = result;
  object! {"x0" => x0, "x1" => x1, "y0" => y0, "y1" => y1}
}

#[wasm_bindgen]
pub fn some(n: u32) -> f64 {
  bokeh_lib::ndarrays::some(n)
}
