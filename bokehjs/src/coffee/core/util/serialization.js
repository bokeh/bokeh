/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS103: Rewrite code to no longer use __guard__
 * DS202: Simplify dynamic range loops
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

let _order, v;
import {isArray, isObject} from "./types"
;

export const ARRAY_TYPES = {
  float32: Float32Array,
  float64: Float64Array,
  uint8: Uint8Array,
  int8: Int8Array,
  uint16: Uint16Array,
  int16: Int16Array,
  uint32: Uint32Array,
  int32: Int32Array
};

export const DTYPES = {};
for (const k in ARRAY_TYPES) {
  v = ARRAY_TYPES[k];
  DTYPES[v.name] = k;
}

// record endian-ness
let buf = new ArrayBuffer(2);
const buf8 = new Uint8Array(buf);
const buf16 = new Uint16Array(buf);
buf8[0] = 0xAA;
buf8[1] = 0xBB;
if (buf16[0] === 0xBBAA) {
  _order = "little";
} else {
  _order = "big";
}
export const BYTE_ORDER = _order;

export const swap16 = function(a) {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 2);
  for (let i = 0, end = x.length; i < end; i += 2) {
    const t = x[i];
    x[i] = x[i + 1];
    x[i + 1] = t;
  }
  return null;
};

export const swap32 = function(a) {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 4);
  for (let i = 0, end = x.length; i < end; i += 4) {
    let t = x[i];
    x[i] = x[i + 3];
    x[i + 3] = t;
    t = x[i + 1];
    x[i + 1] = x[i + 2];
    x[i + 2] = t;
  }
  return null;
};

export const swap64 = function(a) {
  const x = new Uint8Array(a.buffer, a.byteOffset, a.length * 8);
  for (let i = 0, end = x.length; i < end; i += 8) {
    let t = x[i];
    x[i] = x[i + 7];
    x[i + 7] = t;
    t = x[i + 1];
    x[i + 1] = x[i + 6];
    x[i + 6] = t;
    t = x[i + 2];
    x[i + 2] = x[i + 5];
    x[i + 5] = t;
    t = x[i + 3];
    x[i + 3] = x[i + 4];
    x[i + 4] = t;
  }
  return null;
};

export const process_buffer = function(spec, buffers) {
  const need_swap = (spec.order !== BYTE_ORDER);
  const { shape } = spec;
  let bytes = null;
  for (buf of buffers) {
    const header = JSON.parse(buf[0]);
    if (header.id === spec.__buffer__) {
      bytes = buf[1];
      break;
    }
  }
  const arr = new (ARRAY_TYPES[spec.dtype])(bytes);
  if (need_swap) {
    if (arr.BYTES_PER_ELEMENT === 2) {
      swap16(arr);
    } else if (arr.BYTES_PER_ELEMENT === 4) {
      swap32(arr);
    } else if (arr.BYTES_PER_ELEMENT === 8) {
      swap64(arr);
    }
  }
  return [arr, shape];
};

export const process_array = function(obj, buffers) {
  if (isObject(obj) && '__ndarray__' in obj) {
    return decode_base64(obj);
  } else if (isObject(obj) && '__buffer__' in obj) {
    return process_buffer(obj, buffers);
  } else if (isArray(obj)) {
    return [obj, []];
  }
};

export const arrayBufferToBase64 = function(buffer) {
  const bytes = new Uint8Array( buffer );
  const binary = (bytes.map((b) => String.fromCharCode(b)));
  return btoa( binary.join("") );
};

export const base64ToArrayBuffer = function(base64) {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array( len );
  for (let i = 0, end = len, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
};

export const decode_base64 = function(input) {
  let array;
  const bytes = base64ToArrayBuffer(input['__ndarray__']);
  const dtype = input['dtype'];
  if (dtype in ARRAY_TYPES) {
    array = new (ARRAY_TYPES[dtype])(bytes);
  }
  const shape = input['shape'];
  return [array, shape];
};

export const encode_base64 = function(array, shape) {
  const b64 = arrayBufferToBase64(array.buffer);
  const dtype = DTYPES[array.constructor.name];
  const data = {
    __ndarray__: b64,
    shape,
    dtype
  };
  return data;
};

export const decode_column_data = function(data, buffers) {
  const new_data = {};
  const new_shapes = {};

  for (k in data) {

    // might be array of scalars, or might be ragged array or arrays
    let arr, shape;
    v = data[k];
    if (isArray(v)) {

      // v is just a regular array of scalars
      if ((v.length === 0) || !(isObject(v[0]) || isArray(v[0]))) {
        new_data[k] = v;
        continue;
      }

      // v is a ragged array of arrays
      const arrays = [];
      const shapes = [];
      for (let obj of v) {
        [arr, shape] = process_array(obj, buffers);
        arrays.push(arr);
        shapes.push(shape);
      }

      new_data[k] = arrays;
      new_shapes[k] = shapes;

    // must be object or array (single array case)
    } else {
      [arr, shape] = process_array(v, buffers);
      new_data[k] = arr;
      new_shapes[k] = shape;
    }
  }

  return [new_data, new_shapes];
};

export const encode_column_data = function(data, shapes) {
  const new_data = {};
  for (k in data) {
    v = data[k];
    if ((v != null ? v.buffer : undefined) instanceof ArrayBuffer) {
      v = encode_base64(v, shapes != null ? shapes[k] : undefined);
    } else if (isArray(v)) {
      const new_array = [];
      for (let i = 0, end = v.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
        if ((v[i] != null ? v[i].buffer : undefined) instanceof ArrayBuffer) {
          new_array.push(encode_base64(v[i], __guard__(shapes != null ? shapes[k] : undefined, x => x[i])));
        } else {
          new_array.push(v[i]);
        }
      }
      v = new_array;
    }
    new_data[k] = v;
  }
  return new_data;
};

function __guard__(value, transform) {
  return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
