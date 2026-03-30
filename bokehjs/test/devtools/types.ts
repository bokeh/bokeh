import type {Box, State} from "./baselines.js"

export interface CallFrame {
  name: string
  url: string
  line: number
  col: number
}

export interface Err {
  text: string
  url: string
  line: number
  col: number
  trace: CallFrame[]
}

export class Exit extends Error {
  constructor(public code: number) {
    super(`exit: ${code}`)
  }
}

export class TimeoutError extends Error {
  constructor() {
    super("timeout")
  }
}

export type Suite = {description: string, suites: Suite[], tests: Test[]}
export type Test = {description: string, skip: boolean, omit?: boolean, threshold?: number, retries?: number, dpr?: number, scale?: number, no_image?: boolean}

export type Result = {error: {str: string, stack?: string} | null, time: number, state?: State, bbox?: Box}

export type TestRunContext = {
  chromium_version: number
}

export type Version = [number, number, number, number]
