export class BuildError extends Error {
  constructor(readonly component: string, message: string) {
    super(message)
  }
}
