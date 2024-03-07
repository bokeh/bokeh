import type {Equatable} from "./eq"
import {equals} from "./eq"

const version_re = /^(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:(?<type>-dev\.|-rc\.|.dev|rc)(?<revision>\d+))?(?:\+(?<build>\d+)\..+)?$/

export enum ReleaseType {
  Dev = 0,
  Candidate = 1,
  Release = 2,
}

export class Version implements Equatable {
  constructor(
    readonly major: number,
    readonly minor: number,
    readonly patch: number,
    readonly type: ReleaseType = ReleaseType.Release,
    readonly revision: number = 0,
    readonly build: number = 0,
  ) {}

  static from(version: string): Version | null {
    return parse_version(version)
  }

  toString(): string {
    const {major, minor, patch, type, revision, build} = this
    let version = `${major}.${minor}.${patch}`
    switch (type) {
      case ReleaseType.Dev:       version += `-dev.${revision}`
      case ReleaseType.Candidate: version += `-rc.${revision}`
      case ReleaseType.Release:
    }
    if (build != 0) {
      version += `+${build}`
    }
    return version
  }

  [equals](that: this): boolean {
    // ignore build field, because bokehjs doesn't provide it
    const {major, minor, patch, type, revision} = this
    return major == that.major &&
           minor == that.minor &&
           patch == that.patch &&
           type == that.type &&
           revision == that.revision
  }
}

function parse_version(version: string): Version | null {
  const result = version_re.exec(version)
  if (result == null || result.groups == null) {
    return null
  }
  const {groups} = result
  const major = Number(groups.major)
  const minor = Number(groups.minor)
  const patch = Number(groups.patch)
  const type = (() => {
    switch (groups.type) {
      case "-dev.":
      case ".dev": return ReleaseType.Dev
      case "-rc.":
      case "rc":   return ReleaseType.Candidate
      default:     return ReleaseType.Release
    }
  })()
  // typeof due to bad stdlib typings or enable exactOptionalPropertyTypes
  const revision = typeof groups.revision == "undefined" ? 0 : Number(groups.revision)
  const build = typeof groups.build == "undefined" ? 0 : Number(groups.build)
  return new Version(major, minor, patch, type, revision, build)
}
