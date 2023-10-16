export type Graph<T> = Map<T, T[]>

type State<T> = Map<T, {visited: boolean, explored: boolean}>

export function detect_cycles<T>(graph: Graph<T>): T[][] {
  const cycles: T[][] = []

  const state: State<T> = new Map()
  for (const node of graph.keys()) {
    state.set(node, {visited: false, explored: false})
  }

  function detect_cycle(nodes: T[]): boolean {
    const node = nodes[0]

    const entry = state.get(node)!
    if (entry.visited) {
      return false
    }
    if (entry.explored) {
      cycles.push(nodes)
      return true
    }

    entry.explored = true

    const neighbors = graph.get(node)!
    for (const neighbor of neighbors) {
      const {visited} = state.get(neighbor)!
      if (!visited) {
        const cycle = detect_cycle([neighbor, ...nodes])
        if (cycle) {
          break
        }
      }
    }

    entry.explored = false
    entry.visited = true
    return false
  }

  for (const node of graph.keys()) {
    detect_cycle([node])
  }

  return cycles
}
