import type * as RS from '&/utils/recursion-scheme';
import type { Name } from './base.types';
import type { Particle } from './expression.types';

export type PatternNode<RM extends RS.Map = RS.Map> = Pattern<RM>;

export type Pattern<RM extends RS.Map = RS.Map> = (
  NamePattern<RM> |
  TuplePattern<RM> |
  ParticlePattern<RM> |
  WildcardPattern<RM>
);

export type NamePattern<RM extends RS.Map = RS.Map> = {
  type: 'name-pattern';
  name: RS.Get<Name, RM>;
};

export type TuplePattern<RM extends RS.Map = RS.Map> = {
  type: 'tuple-pattern';
  members: RS.Get<Pattern, RM>[];
};

export type ParticlePattern<RM extends RS.Map = RS.Map> = {
  type: 'particle-pattern';
  value: RS.Get<Particle, RM>;
};

export type WildcardPattern<_RM extends RS.Map = RS.Map> = {
  type: 'wildcard-pattern';
};
