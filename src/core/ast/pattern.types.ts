import type * as RS from '&/utils/recursion-scheme';
import type { Name } from './base.types';
import type { Particle } from './expression.types';

export type PatternNode<RM extends RS.Map = RS.Map> = Pattern<RM>;

export type PatternNodeRM<S extends RS.RecSafe<RS.Map>> = (
  [NamePattern, NamePattern<RS.RecExtract<S>>] |

  [TuplePattern, TuplePattern<RS.RecExtract<S>>] |
  [ParticlePattern, ParticlePattern<RS.RecExtract<S>>] |

  [WildcardPattern, WildcardPattern<RS.RecExtract<S>>]
);

export type PatternNodeRMExcluding<Pat, S extends RS.RecSafe<RS.Map>> = (
  RS.Ex<Pat, NamePattern, [NamePattern, NamePattern<RS.RecExtract<S>>]> |

  RS.Ex<Pat, TuplePattern, [TuplePattern, TuplePattern<RS.RecExtract<S>>]> |
  RS.Ex<Pat, ParticlePattern, [ParticlePattern, ParticlePattern<RS.RecExtract<S>>]> |

  RS.Ex<Pat, WildcardPattern, [WildcardPattern, WildcardPattern<RS.RecExtract<S>>]>
);

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
