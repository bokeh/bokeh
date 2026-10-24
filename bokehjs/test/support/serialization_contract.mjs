function equal(actual, expected, context) {
  if (actual !== expected) {
    throw new Error(`${context}: expected ${expected}, got ${actual}`)
  }
}

function wire_names(value, names = new Map()) {
  if (value != null && typeof value == "object") {
    if (value.type == "object" && typeof value.id == "string" && typeof value.name == "string") {
      names.set(value.id, value.name)
    }
    for (const child of Object.values(value)) {
      wire_names(child, names)
    }
  }
  return names
}

export function check_serialization_contract(runtime, fixture) {
  const doc = runtime.Document.from_json(fixture.document)
  try {
    for (const [name, {class_name, qualified_name}] of Object.entries(fixture.models)) {
      const model = doc.get_model_by_name(name)
      equal(model?.constructor.name, class_name, `${name} class name`)
      equal(model.type, qualified_name, `${name} wire name`)
      equal(runtime.Models.get(qualified_name), model.constructor, `${name} registry identity`)
    }

    const source = doc.get_model_by_name("source")
    const renderer = doc.get_model_by_name("renderer")
    const table = doc.get_model_by_name("table")
    equal(renderer.data_source, source, "renderer source")
    equal(table.source, source, "table source")
    equal(table.source.selected, renderer.data_source.selected, "shared selection")

    // Different copies of core's serialization Symbol fail here even when
    // minification preserved every model's class name.
    const encoded = doc.to_json(false)
    const actual = wire_names(encoded)
    const expected = wire_names(fixture.document)
    equal(actual.size, expected.size, "serialized model count")
    for (const [id, name] of expected) {
      equal(actual.get(id), name, `serialized model ${id}`)
    }
    const restored = runtime.Document.from_json(encoded)
    try {
      const restored_renderer = restored.get_model_by_name("renderer")
      const restored_table = restored.get_model_by_name("table")
      equal(restored_renderer.data_source, restored_table.source, "restored source identity")
      equal(JSON.stringify(restored_table.source.data), JSON.stringify({x: [1, 2], y: [3, 4]}), "restored data")
    } finally {
      restored.clear()
    }
  } finally {
    doc.clear()
  }
}
