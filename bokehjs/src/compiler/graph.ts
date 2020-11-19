export type Node<T> = {
  visited: boolean
  explored: boolean
  metadata: T
}
export type Graph<T> = Map<Node<T>, Node<T>[]>

export function detect_cycles<T>(graph: Graph<T>): T[][] {
  const vertices = graph.keys()
  const cycles: T[][] = []

  for (const vertex of vertices) {
    detect_cycle(graph, [vertex], cycles)
  }

  return cycles
}

function detect_cycle<T>(graph: Graph<T>, nodes: Node<T>[], cycles: T[][]): boolean {
  const node = nodes[0]
  if (node.visited)
    return false
  if (node.explored) {
    cycles.push(nodes.map((node) => node.metadata))
    return true
  }

  node.explored = true

  const neighbors = graph.get(node)!
  for (const neighbor of neighbors) {
    if (!neighbor.visited) {
      const cycle = detect_cycle(graph, [neighbor, ...nodes], cycles)
      if (cycle)
        break
    }
  }

  node.explored = false
  node.visited = true
  return false
}
