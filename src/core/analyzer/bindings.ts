import { mapByType } from '&/utils/nodes';
import type * as RS from '&/utils/recursion-scheme';
import * as AST from '../ast';
// import { BaseNodeRM, ExpressionNodeRM, ProgramNodeRM } from '../ast';

// TODO - look into HKTs & see if that pattern works here...?


// TODO - is this the magic method to extend an existing RM...?
// type Extend<N, R> = N extends unknown
//   ? [N, R & Extract<AST.NodeF<Extend<N, R>>, N>] | AST.NodeMExcluding<N, [Extend<N, R>]>
//   : never;

// like Extract, but extends is flipped (still returns T though)
type Filter<T, U> = T extends unknown
  ? U extends T
    ? T
    : never
  : never;

// Node of BaseRM -> Node of BaseRM & Ext
type Combine<N extends AST.NodeF, Ext extends RS.Map> =
  N extends AST.NodeF<infer RM> // TODO - does this work...?
    ? AST.Get<Filter<AST.NodeF, N>, RM & Ext>  // TODO - & between RMs here
    : never;



// TODO - test with something that's not just BaseRM
type x = Combine<AST.Program, BindingsRM>;



// TODO - put this somewhere common ?? remove it ??
type Meta<T> = { meta: T };


// TODO - rename this??
export type BindingsRM =
  [AST.NamePattern, Meta<{ bound: Set<string> }> & AST.NamePattern<BindingsRM>] |
  AST.NodeMExcluding<AST.NamePattern, [BindingsRM]>;

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

const program = <N extends AST.Get<AST.Program>>(node: N): AST.Get<AST.Program, BindingsRM> => {
  return {
    ...node,
    entries: block(node.entries, new Set())
  };
};


const block = <R extends AST.BaseRM>(nodes: AST.Get<AST.Declaration | AST.Expression, R>[], bindings: Bindings):
  AST.Get<AST.Declaration | AST.Expression, R & BindingsRM>[] =>
{
  const [updatedNodes, _] = mapWithState(nodes, bindings, (entry, bindings) =>
    blockEntry(entry, bindings)
  );

  return updatedNodes;
};


const blockEntry = <R extends AST.BaseRM>(entry: AST.Get<AST.Declaration | AST.Expression, R>, bindings: Bindings):
  WithBindings<AST.Get<AST.Declaration | AST.Expression, R & BindingsRM>> =>
{
  if (entry.type === 'declaration') {
    return declaration(entry, bindings);
  } else {
    return [expression(entry, bindings), bindings];
  }
};


// TODO - attach bindings to declaration node; know if name is shadowing..?
const declaration = <R extends AST.BaseRM>(node: AST.Get<AST.Declaration, R>, bindings: Bindings):
  WithBindings<AST.Get<AST.Declaration, R & BindingsRM>> =>
{
  const updatedNode = {
    ...node,
    name: name(node.name),
    expression: expression(node.expression, bindings)
  };

  const updateBindings = append(bindings, node.name.value);

  return [updatedNode, updateBindings];
};


const expression = <N extends AST.Expression, R extends AST.BaseRM>(node: AST.Get<N, R>, bindings: Bindings): AST.Get<N, R & BindingsRM> =>
  translate(node as AST.Get<AST.Expression>, bindings) as AST.Get<N, R & BindingsRM>;


const blockExpression = <R extends AST.BaseRM>(node: AST.Get<AST.BlockExpression, R>, bindings: Bindings): AST.Get<AST.BlockExpression, R & BindingsRM> => {
  return {
    ...node,
    entries: block(node.entries, bindings)
  };
};


const funcApplication = <R extends AST.BaseRM>(node: AST.Get<AST.FuncApplication, R>, bindings: Bindings): AST.Get<AST.FuncApplication, R & BindingsRM> =>
  ({
    ...node,
    arg: expression(node.arg, bindings),
    func: expression(node.func, bindings),
  });

const thunkForce = <R extends AST.BaseRM>(node: AST.Get<AST.ThunkForce, R>, bindings: Bindings): AST.Get<AST.ThunkForce, R & BindingsRM> =>
  ({
    ...node,
    thunk: expression(node.thunk, bindings)
  });



const match = <R extends AST.BaseRM>(node: AST.Get<AST.Match, R>, bindings: Bindings): AST.Get<AST.Match, R & BindingsRM> => {
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
  };
};

// TODO - mark if name exists yet
const namePattern = <R extends AST.BaseRM>(node: AST.Get<AST.NamePattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.NamePattern, R & BindingsRM>> => {
  const updatedNode = {
    ...node,
    meta: { bound: bindings }
  };
  const updatedBindings = append(bindings, node.name.value);

  return [updatedNode, updatedBindings];
};

const tuplePattern = <R extends AST.BaseRM>(node: AST.Get<AST.TuplePattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.TuplePattern, R & BindingsRM>> => {
  const [updatedMembers, updatedBindings] = mapWithState(node.members, bindings,
    (member, bindings): [AST.Get<AST.Pattern, R & BindingsRM>, Bindings] =>
      pattern(member, bindings)
  );

  return [
    { ...node, members: updatedMembers },
    updatedBindings
  ];
};

const particlePattern = <R extends AST.BaseRM>(node: AST.Get<AST.ParticlePattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.ParticlePattern, R & BindingsRM>> =>
  [
    { ...node, value: particle(node.value) },
    bindings
  ];

const wildcardPattern = <R extends AST.BaseRM>(node: AST.Get<AST.WildcardPattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.WildcardPattern, R & BindingsRM>> =>
  [node, bindings];

const pattern = mapByType({
  'name-pattern': namePattern,
  'tuple-pattern': tuplePattern,
  'particle-pattern': particlePattern,
  'wildcard-pattern': wildcardPattern
});



const func = <R extends AST.BaseRM>(node: AST.Get<AST.Func, R>, bindings: Bindings): AST.Get<AST.Func, R & BindingsRM> =>
  ({
    ...node,
    body: expression(node.body, append(bindings, node.arg.value))
  });

const thunk = <R extends AST.BaseRM>(node: AST.Get<AST.Thunk, R>, bindings: Bindings): AST.Get<AST.Thunk, R & BindingsRM> =>
  ({
    ...node,
    body: expression(node.body, bindings)
  });

// TODO - attach bindings to name node; know if name is bound yet ??
const name = <R extends AST.BaseRM>(node: AST.Get<AST.Name, R>): AST.Get<AST.Name, R & BindingsRM> => node;

const tuple = <R extends AST.BaseRM>(node: AST.Get<AST.Tuple, R>, bindings: Bindings): AST.Get<AST.Tuple, R & BindingsRM> =>
  ({
    ...node,
    members: node.members.map(n => expression(n, bindings))
  });

const particle = <N extends AST.Particle, R extends AST.BaseRM>(node: AST.Get<N, R>): AST.Get<N, R & BindingsRM> =>
  translate(node as AST.Get<AST.Particle>) as AST.Get<N, R & BindingsRM>;

const atom = <R extends AST.BaseRM>(node: AST.Get<AST.Atom, R>): AST.Get<AST.Atom, R & BindingsRM> => node;
const bool = <R extends AST.BaseRM>(node: AST.Get<AST.Bool, R>): AST.Get<AST.Bool, R & BindingsRM> => node;
const number = <R extends AST.BaseRM>(node: AST.Get<AST.Numeral, R>): AST.Get<AST.Numeral, R & BindingsRM> => node;
const text = <R extends AST.BaseRM>(node: AST.Get<AST.Text, R>): AST.Get<AST.Text, R & BindingsRM> => node;

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

