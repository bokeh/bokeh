import {to_string} from "core/util/pretty"

// The default function for casting data to strings for CSV fields
export function default_cast(field: unknown): string {
  if (field instanceof Date) {
    return field.toISOString()
  } else if (typeof field === "object") {
    // includes null => 'null'
    return to_string(field)
  } else {
    return String(field)
  }
}
