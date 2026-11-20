import {CompositeScale} from "./composite_scale"
import type {Scale} from "./scale"
import {CategoricalScale} from "./categorical_scale"
import {LogScale} from "./log_scale"
import type {Range} from "../ranges/range"
import {DataRange1d} from "../ranges/data_range1d"
import {FactorRange} from "../ranges/factor_range"

export function derive_scale(scale: Scale, source: Range, target: Range): Scale {
  if ((source instanceof FactorRange) != (scale instanceof CategoricalScale)) {
    throw new Error(`'${source.type}' is incompatible with '${scale.type}'`)
  }
  if (scale instanceof LogScale && source instanceof DataRange1d) {
    source.scale_hint = "log"
  }
  const derived = scale.clone()
  derived.setv({source_range: source, target_range: target})
  return derived
}

export function compose_scale(scale: Scale, source: Range, target: Range, parent: Scale): CompositeScale {
  const source_scale = derive_scale(scale, source, target)
  return CompositeScale.create({source_scale, source_range: source, target_scale: parent, target_range: parent.target_range})
}
