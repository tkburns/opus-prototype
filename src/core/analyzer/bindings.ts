import { mapByType } from '&/utils/nodes';
import type * as RS from '&/utils/recursion-scheme';
import * as AST from '../ast';
import type { AnnotatedM, Meta } from './meta.types';

export type BindingsMeta = {
  'name-pattern': Meta<{ bound: Set<string> }>
};

// TODO - use interfaces?
// TODO add TM<N, R> = { [T in N['type']]: R } util?
// export type BindingsM = AST.NodeRM<[BindingsM]> & BindingsMeta;

// util to shorten func signatures below
type AGet<N extends AST.NodeF, M extends RS.Map> = AST.Get<N, AnnotatedM<M>>;
type AGetT<Tp extends AST.NodeF['type'], M extends RS.Map> = AST.GetT<Tp, AnnotatedM<M>>;

// ----------------------------------------------------------
  
// TODO - abstract this..?

type Bindings = Set<string>;
type WithBindings<T> = [T, Bindings]; // TODO - use obj instead of tuple??

const mapWithState = <T, S, U>(list: T[], state: S, mapper: (elem: T, state: S) => [U, S]): [U[], S] => {
  type Acc = [elems: U[], state: S];

  const acc = list.reduce<Acc>(([processedElems, state], elem) => {
    const [updatedElem, updatedState] = mapper(elem, state);
    return [
      [...processedElems, updatedElem],
      updatedState,
    ];
  }, [[], state]);

  return acc;
};

const append = <T>(set: Set<T>, el: T): Set<T> =>
  new Set([...set, el]);

// -----------------------------------------------

// TODO - type checking is REALLY slow with generics
// might need to tweak Bindings definition (use code generator...?)

const program = <M extends RS.Map>(node: AGet<AST.Program, M>): AGet<AST.Program, M & BindingsMeta> => {
  return {
    // ...(node as RS.GetT<'program', AnnotatedM<M & BindingsMeta>>),
    ...node,
    entries: block(node.entries, new Set())
  } as AGet<AST.Program, M & BindingsMeta>;
};

const block = <M extends RS.Map>(nodes: AGet<AST.Declaration | AST.Expression, M>[], bindings: Bindings):
  AGet<AST.Declaration | AST.Expression, M & BindingsMeta>[] =>
{
  const [updatedNodes, _] = mapWithState(nodes, bindings, (entry, bindings) =>
    blockEntry(entry, bindings)
  );

  return updatedNodes;
};


const blockEntry = <M extends RS.Map>(entry: AGet<AST.Declaration | AST.Expression, M>, bindings: Bindings):
  WithBindings<AGet<AST.Declaration | AST.Expression, M & BindingsMeta>> =>
{
  if (entry.type === 'declaration') {
    return declaration(entry, bindings);
  } else {
    return [expression<M>(entry, bindings), bindings];
  }
};


// TODO - attach bindings to declaration node; know if name is shadowing..?
const declaration = <M extends RS.Map>(node: AGet<AST.Declaration, M>, bindings: Bindings):
  WithBindings<AGet<AST.Declaration, M & BindingsMeta>> =>
{
  const updatedNode = {
    ...node,
    name: name(node.name),
    expression: expression(node.expression, bindings)
  } as AGet<AST.Declaration, M & BindingsMeta>;

  const updateBindings = append(bindings, node.name.value);

  return [updatedNode, updateBindings];
};


const expression = <M extends RS.Map, Tp extends AST.Expression['type'] = AST.Expression['type']>(node: AGetT<Tp, M>, bindings: Bindings): AGetT<Tp, M & BindingsMeta> =>
  translate(node as AST.Expression<AnnotatedM<M>>, bindings) as AGetT<Tp, M & BindingsMeta>;


const blockExpression = <M extends RS.Map>(node: AGet<AST.BlockExpression, M>, bindings: Bindings): AGet<AST.BlockExpression, M & BindingsMeta> => {
  return {
    ...node,
    entries: block(node.entries, bindings)
  } as AGet<AST.BlockExpression, M & BindingsMeta>;
};


const funcApplication = <M extends RS.Map>(node: AGet<AST.FuncApplication, M>, bindings: Bindings): AGet<AST.FuncApplication, M & BindingsMeta> =>
  ({
    ...node,
    arg: expression(node.arg, bindings),
    func: expression(node.func, bindings),
  }) as AGet<AST.FuncApplication, M & BindingsMeta>;

const thunkForce = <M extends RS.Map>(node: AGet<AST.ThunkForce, M>, bindings: Bindings): AGet<AST.ThunkForce, M & BindingsMeta> =>
  ({
    ...node,
    thunk: expression(node.thunk, bindings)
  }) as AGet<AST.ThunkForce, M & BindingsMeta>;



const match = <M extends RS.Map>(node: AGet<AST.Match, M>, bindings: Bindings): AGet<AST.Match, M & BindingsMeta> => {
  const [updatedClauses, _] = mapWithState(node.clauses, bindings, (clause, bindings) => {
    const [updatedPattern, patternBindings] = pattern(clause.pattern, bindings);
    const updatedClause = {
      ...clause,
      pattern: updatedPattern,
      body: expression(clause.body, patternBindings)
    };

    return [updatedClause, bindings];
  });

  return {
    ...node,
    principal: expression(node.principal, bindings),
    clauses: updatedClauses
  } as AGet<AST.Match, M & BindingsMeta>;
};

// TODO - mark if name exists yet
const namePattern = <M extends RS.Map>(node: AGet<AST.NamePattern, M>, bindings: Bindings): WithBindings<AGet<AST.NamePattern, M & BindingsMeta>> => {
  const updatedNode = {
    ...node,
    meta: { bound: bindings }
  } as AGet<AST.NamePattern, M & BindingsMeta>;
  const updatedBindings = append(bindings, node.name.value);

  return [updatedNode, updatedBindings];
};

const tuplePattern = <M extends RS.Map>(node: AGet<AST.TuplePattern, M>, bindings: Bindings): WithBindings<AGet<AST.TuplePattern, M & BindingsMeta>> => {
  const [updatedMembers, updatedBindings] = mapWithState(node.members, bindings,
    (member, bindings): [AGet<AST.Pattern, M & BindingsMeta>, Bindings] =>
      pattern(member, bindings)
  );

  return [
    { ...node, members: updatedMembers } as AGet<AST.TuplePattern, M & BindingsMeta>,
    updatedBindings
  ];
};

const particlePattern = <M extends RS.Map>(node: AGet<AST.ParticlePattern, M>, bindings: Bindings): WithBindings<AGet<AST.ParticlePattern, M & BindingsMeta>> =>
  [
    { ...node, value: particle(node.value) } as AGet<AST.ParticlePattern, M & BindingsMeta>,
    bindings
  ];

const wildcardPattern = <M extends RS.Map>(node: AGet<AST.WildcardPattern, M>, bindings: Bindings): WithBindings<AGet<AST.WildcardPattern, M & BindingsMeta>> =>
  [node, bindings];

// const patternMT = mapByType({
//   'name-pattern': namePattern,
//   'tuple-pattern': tuplePattern,
//   'particle-pattern': particlePattern,
//   'wildcard-pattern': wildcardPattern
// });

// const pattern = <Tp extends AST.Pattern['type'], M extends RS.Map>(node: AGetT<Tp, M>, bindings: Bindings): AGetT<Tp, M & BindingsMeta> =>
//   patternMT(node as AGetT<Tp, RS.Map>, bindings) as AGetT<Tp, M & BindingsMeta>;

const pattern = <M extends RS.Map>(node: AGet<AST.Pattern, M>, bindings: Bindings): WithBindings<AGet<AST.Pattern, M & BindingsMeta>> => {
  if (node.type === 'name-pattern') {
    return namePattern(node, bindings);
  } else if (node.type === 'particle-pattern') {
    return particlePattern(node, bindings);
  } else if (node.type === 'tuple-pattern') {
    return tuplePattern(node, bindings);
  } else {
    return wildcardPattern(node, bindings);
  }
}


const func = <M extends RS.Map>(node: AGet<AST.Func, M>, bindings: Bindings): AGet<AST.Func, M & BindingsMeta> =>
  ({
    ...node,
    body: expression(node.body, append(bindings, node.arg.value))
  }) as AGet<AST.Func, M & BindingsMeta>;

const thunk = <M extends RS.Map>(node: AGet<AST.Thunk, M>, bindings: Bindings): AGet<AST.Thunk, M & BindingsMeta> =>
  ({
    ...node,
    body: expression(node.body, bindings)
  }) as AGet<AST.Thunk, M & BindingsMeta>;

// TODO - attach bindings to name node; know if name is bound yet ??
const name = <M extends RS.Map>(node: AGet<AST.Name, M>): AGet<AST.Name, M & BindingsMeta> => node;

const tuple = <M extends RS.Map>(node: AGet<AST.Tuple, M>, bindings: Bindings): AGet<AST.Tuple, M & BindingsMeta> =>
  ({
    ...node,
    members: node.members.map(n => expression(n, bindings))
  }) as AGet<AST.Tuple, M & BindingsMeta>;

const particle = <M extends RS.Map, Tp extends AST.Particle['type'] = AST.Particle['type']>(node: AGetT<Tp, M>): AGetT<Tp, M & BindingsMeta> =>
  translate(node as AST.Particle<AnnotatedM<M>>) as AGetT<Tp, M & BindingsMeta>;

const atom = <M extends RS.Map>(node: AGet<AST.Atom, M>): AGet<AST.Atom, M & BindingsMeta> => node;
const bool = <M extends RS.Map>(node: AGet<AST.Bool, M>): AGet<AST.Bool, M & BindingsMeta> => node;
const number = <M extends RS.Map>(node: AGet<AST.Numeral, M>): AGet<AST.Numeral, M & BindingsMeta> => node;
const text = <M extends RS.Map>(node: AGet<AST.Text, M>): AGet<AST.Text, M & BindingsMeta> => node;

const translate = mapByType({
  program,
  declaration,
  'block-expression': blockExpression,
  'function': func,
  'function-application': funcApplication,
  thunk,
  'thunk-force': thunkForce,
  match,
  name,
  tuple,
  atom,
  bool,
  number,
  text
});


export const analyze = program;

