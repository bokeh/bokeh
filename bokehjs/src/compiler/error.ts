export class BuildError extends Error {
  readonly component: string

  constructor(component: string, message: string) {
    super(message)
    this.component = component
  }
}
