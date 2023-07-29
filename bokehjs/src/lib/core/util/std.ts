export class OurSet<T> extends Set<T> {
  extend(values: Iterable<T>): this {
    for (const value of values) {
      this.add(value)
    }
    return this
  }
}
