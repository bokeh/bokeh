export type RevisionDomain = "geometry" | "mapping" | "visuals" | "selection"

export type RevisionSnapshot = Readonly<Record<RevisionDomain, number>>

const domains: RevisionDomain[] = ["geometry", "mapping", "visuals", "selection"]

/** Independent revision clocks for GPU upload domains.
 *
 * Consumers keep named cursors, allowing geometry, mapping, visuals, and
 * selection uploads to advance independently without a web of dirty flags. */
export class RevisionState {
  private readonly _revisions = new Map<RevisionDomain, number>(domains.map((domain) => [domain, 0]))
  private readonly _consumers = new Map<string, Map<RevisionDomain, number>>()
  private _selection: number[] | null = null

  revision(domain: RevisionDomain): number {
    return this._revisions.get(domain)!
  }

  get snapshot(): RevisionSnapshot {
    return {
      geometry: this.revision("geometry"),
      mapping: this.revision("mapping"),
      visuals: this.revision("visuals"),
      selection: this.revision("selection"),
    }
  }

  bump(domain: RevisionDomain): number {
    const revision = this.revision(domain) + 1
    this._revisions.set(domain, revision)
    return revision
  }

  changed(domain: RevisionDomain, consumer: string = "default"): boolean {
    return this._consumer(consumer).get(domain) != this.revision(domain)
  }

  consume(domain: RevisionDomain, consumer: string = "default"): number {
    const revision = this.revision(domain)
    this._consumer(consumer).set(domain, revision)
    return revision
  }

  sync_selection(indices: readonly number[]): boolean {
    const changed = this._selection?.length != indices.length ||
      !indices.every((index, i) => this._selection![i] == index)
    if (changed) {
      this._selection = [...indices]
      this.bump("selection")
    }
    return changed
  }

  private _consumer(name: string): Map<RevisionDomain, number> {
    let consumer = this._consumers.get(name)
    if (consumer == null) {
      consumer = new Map(domains.map((domain) => [domain, 0]))
      this._consumers.set(name, consumer)
    }
    return consumer
  }
}
