export const keys = Object.keys

export function values<T>(object: {[key: string]: T}): Array<T> {
  const keys = Object.keys(object)
  const length = keys.length
  const values = new Array<T>(length)
  for (let i = 0; i < length; i++) {
    values[i] = object[keys[i]]
  }
  return values
}

export function extend<T, T1>(dest: T, source: T1): T & T1;
export function extend<R>(dest: any, ...sources: Array<any>): R {
  for (const source of sources) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        dest[key] = source[key]
      }
    }
  }

  return dest
}

export function clone<T>(obj: T): T {
  return extend({}, obj)
}

export function isEmpty<T>(obj: T): boolean {
  return Object.keys(obj).length === 0
}
