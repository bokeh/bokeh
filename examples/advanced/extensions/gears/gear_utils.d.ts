export type Draw = "M" | "L" | "C" | "Q" | "A"

export function gear_tooth(module: number, teeth: number, pressure_angle: number): (Draw | number)[]
export function internal_gear_tooth(module: number, teeth: number, pressure_angle: number): (Draw | number)[]
