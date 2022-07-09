import type * as RS from '&/utils/recursion-scheme';
import type { Name } from './base.types';
import type { Particle } from './expression.types';

export type PatternNode<RM extends RS.Map = RS.Map> = Pattern<RM>;

// // TODO - pattern doesn't handle unioned nodes, eg can't do [Pattern, Pattern]
// // can derive it though? distribute the union?
// export type ProgramNodeM<S extends RS.RecSafe<RS.Map>> = (
//   [Pattern, Pattern<RS.RecExtract<S>>]
// );

// export type PatternNodeM<S extends RS.RecSafe<RS.Map>> =
//   RS.MakeRM<PatternNode, [PatternNode<RS.RecExtract<S>>]>;

export type PatternNodeRM<S extends RS.RecSafe<RS.Map>> =
  RS.MakeRM<PatternNode, [PatternNode<RS.RecExtract<S>>]>;

export type Pattern<RM extends RS.Map = RS.Map> = (
  NamePattern<RM> |
  TuplePattern<RM> |
  ParticlePattern<RM> |
  WildcardPattern<RM>
);

export type NamePattern<RM extends RS.Map = RS.Map> = {
  type: 'name-pattern';
  name: Name<RM>;
};

export type TuplePattern<RM extends RS.Map = RS.Map> = {
  type: 'tuple-pattern';
  members: Pattern<RM>[];
};

export type ParticlePattern<RM extends RS.Map = RS.Map> = {
  type: 'particle-pattern';
  value: Particle<RM>;
};

export type WildcardPattern<_RM extends RS.Map = RS.Map> = {
  type: 'wildcard-pattern';
};
