import type { Name } from './base.types';
import type { Particle } from './expression.types';

export type PatternNode = Pattern;

export type Pattern = (
  NamePattern |
  TuplePattern |
  ParticlePattern |
  WildcardPattern
);

export type NamePattern = {
  type: 'name-pattern';
  name: Name;
};

export type TuplePattern = {
  type: 'tuple-pattern';
  members: Pattern[];
};

export type ParticlePattern = {
  type: 'particle-pattern';
  value: Particle;
};

export type WildcardPattern = {
  type: 'wildcard-pattern';
};
