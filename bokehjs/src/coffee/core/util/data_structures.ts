import {difference, copy} from "./array"
import {isEqual} from "./eq"
import {isArray} from "./types"

export class MultiDict<T> {

  _dict: {[key: string]: T | T[]} = {}

  _existing(key: string): T | T[] | null {
    if (key in this._dict)
      return this._dict[key]
    else
      return null
  }

  add_value(key: string, value: T) {
    /*
    if value == null
      throw new Error("Can't put null in this dict")
    if isArray(value)
      throw new Error("Can't put arrays in this dict")
    */
    const existing = this._existing(key)
    if (existing == null) {
      this._dict[key] = value
    } else if (isArray(existing)) {
      existing.push(value)
    } else {
      this._dict[key] = [existing, value]
    }
  }

  remove_value(key: string, value: T) {
    const existing = this._existing(key)
    if (isArray(existing)) {
      const new_array = difference(existing, [value])
      if (new_array.length > 0)
        this._dict[key] = new_array
      else
        delete this._dict[key]
    } else if (isEqual(existing, value)) {
      delete this._dict[key]
    }
  }

  get_one(key: string, duplicate_error: string): T | null {
    const existing = this._existing(key)
    if (isArray(existing)) {
      if (existing.length === 1)
        return existing[0]
      else
        throw new Error(duplicate_error)
    } else
      return existing
  }
}

export class Set<T> {

  values: T[]

  constructor(obj?: T[] | Set<T>) {
    if (obj == null) {
      this.values = []
    } else if (obj instanceof Set) {
      this.values = copy(obj.values)
    } else {
      this.values = this._compact(obj)
    }
  }

  protected _compact(array: T[]): T[] {
    const newArray: T[] = []

    for (const item of array) {
      if (newArray.indexOf(item) === -1) {
        newArray.push(item)
      }
    }

    return newArray
  }

  push(item: T): void {
    if (this.missing(item))
      this.values.push(item)
  }

  remove(item: T): void {
    const i = this.values.indexOf(item)
    this.values = this.values.slice(0, i).concat(this.values.slice(i + 1))
  }

  length(): number {
    return this.values.length
  }

  includes(item: T): boolean {
    return this.values.indexOf(item) != -1
  }

  missing(item: T): boolean {
    return !this.includes(item)
  }

  slice(from: number, to: number): T[] {
    return this.values.slice(from, to)
  }

  join(str: string): string {
    return this.values.join(str)
  }

  toString(): string {
    return this.join(', ')
  }

  union(set: T[] | Set<T>): Set<T> {
    set = new Set<T>(set)
    return new Set(this.values.concat(set.values))
  }

  intersect(set: T[] | Set<T>): Set<T> {
    set = new Set<T>(set)
    const newSet = new Set<T>()

    for (const item of set.values) {
      if (this.includes(item) && set.includes(item))
        newSet.push(item)
    }

    return newSet
  }

  diff(set: T[] | Set<T>): Set<T> {
    set = new Set<T>(set)
    const newSet = new Set<T>()

    for (const item of this.values) {
      if (set.missing(item))
        newSet.push(item)
    }

    return newSet
  }
}
