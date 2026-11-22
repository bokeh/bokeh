export type Graph<T> = Map<T, T[]>

/**
 * Computes strongly connected components of `graph` (Tarjan's algorithm), i.e.
 * maximal sets of nodes, where each node is reachable from every other node.
 * Components and their nodes are ordered by the order of nodes in `graph`.
 */
export function strongly_connected_components<T>(graph: Graph<T>): T[][] {
  const order = new Map([...graph.keys()].map((node, i) => [node, i]))
  const index = new Map<T, number>()
  const lowlink = new Map<T, number>()
  const stack: T[] = []
  const on_stack = new Set<T>()
  const components: T[][] = []

  // iterative, because module graphs can be deep
  for (const root of graph.keys()) {
    if (index.has(root)) {
      continue
    }
    const work: {node: T, next: number}[] = [{node: root, next: 0}]
    index.set(root, index.size)
    lowlink.set(root, index.get(root)!)
    stack.push(root)
    on_stack.add(root)

    while (work.length != 0) {
      const frame = work[work.length - 1]
      const neighbors = graph.get(frame.node) ?? []
      if (frame.next < neighbors.length) {
        const neighbor = neighbors[frame.next++]
        if (!index.has(neighbor)) {
          index.set(neighbor, index.size)
          lowlink.set(neighbor, index.get(neighbor)!)
          stack.push(neighbor)
          on_stack.add(neighbor)
          work.push({node: neighbor, next: 0})
        } else if (on_stack.has(neighbor)) {
          lowlink.set(frame.node, Math.min(lowlink.get(frame.node)!, index.get(neighbor)!))
        }
      } else {
        work.pop()
        if (work.length != 0) {
          const parent = work[work.length - 1].node
          lowlink.set(parent, Math.min(lowlink.get(parent)!, lowlink.get(frame.node)!))
        }
        if (lowlink.get(frame.node) == index.get(frame.node)) {
          const component: T[] = []
          let node: T
          do {
            node = stack.pop()!
            on_stack.delete(node)
            component.push(node)
          } while (node != frame.node)
          components.push(component.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0)))
        }
      }
    }
  }

  return components.sort((a, b) => (order.get(a[0]) ?? 0) - (order.get(b[0]) ?? 0))
}

/** Finds a shortest cycle through `start` that stays within `nodes`. */
function shortest_cycle<T>(graph: Graph<T>, start: T, nodes: Set<T>): T[] {
  const previous = new Map<T, T>()
  const queue = [start]
  while (queue.length != 0) {
    const node = queue.shift()!
    for (const neighbor of graph.get(node) ?? []) {
      if (neighbor == start) {
        const cycle = [node]
        for (let n = node; n != start; n = previous.get(n)!) {
          cycle.push(previous.get(n)!)
        }
        return cycle.reverse()
      }
      if (nodes.has(neighbor) && !previous.has(neighbor)) {
        previous.set(neighbor, node)
        queue.push(neighbor)
      }
    }
  }
  return []
}

/**
 * Returns one cycle for each group of mutually dependent nodes (strongly
 * connected component), as a list of nodes `[a, b, ..., z]` where `z`
 * depends on `a`. With `filter`, returns only cycles through nodes that
 * match it, i.e. a shortest cycle through the first matching node of each
 * group, and nothing for groups whose cycles avoid matching nodes.
 */
export function detect_cycles<T>(graph: Graph<T>, filter: (node: T) => boolean = () => true): T[][] {
  const cycles: T[][] = []
  for (const component of strongly_connected_components(graph)) {
    // Each node of a group is on a cycle within the group, unless it's a single node
    // that doesn't depend on itself, in which case there's no cycle.
    const start = component.find(filter)
    if (start != null) {
      const cycle = shortest_cycle(graph, start, new Set(component))
      if (cycle.length != 0) {
        cycles.push(cycle)
      }
    }
  }
  return cycles
}
