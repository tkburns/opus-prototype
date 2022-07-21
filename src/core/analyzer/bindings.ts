import { mapByType } from '&/utils/nodes';
// import type * as RS from '&/utils/recursion-scheme';
import * as AST from '../ast';
// import { BaseNodeRM, ExpressionNodeRM, ProgramNodeRM } from '../ast';

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

const program = (node: AST.Get<AST.Program>): AST.Get<AST.Program, BindingsRM> => {
  return {
    ...node,
    entries: block(node.entries, new Set())
  };
};


const block = (nodes: AST.Get<AST.Declaration | AST.Expression>[], bindings: Bindings):
  AST.Get<AST.Declaration | AST.Expression, BindingsRM>[] =>
{
  const [updatedNodes, _] = mapWithState(nodes, bindings, (entry, bindings) =>
    blockEntry(entry, bindings)
  );

  return updatedNodes;
};


const blockEntry = (entry: AST.Get<AST.Declaration | AST.Expression>, bindings: Bindings):
  WithBindings<AST.Get<AST.Declaration | AST.Expression, BindingsRM>> =>
{
  if (entry.type === 'declaration') {
    return declaration(entry, bindings);
  } else {
    return [expression(entry, bindings), bindings];
  }
};


// TODO - attach bindings to declaration node; know if name is shadowing..?
const declaration = (node: AST.Get<AST.Declaration>, bindings: Bindings):
  WithBindings<AST.Get<AST.Declaration, BindingsRM>> =>
{
  const updatedNode = {
    ...node,
    name: name(node.name),
    expression: expression(node.expression, bindings)
  };

  const updateBindings = append(bindings, node.name.value);

  return [updatedNode, updateBindings];
};


const expression = <N extends AST.Expression>(node: AST.Get<N>, bindings: Bindings): AST.Get<N, BindingsRM> =>
  translate(node as AST.Get<AST.Expression>, bindings) as AST.Get<N, BindingsRM>;


const blockExpression = (node: AST.Get<AST.BlockExpression>, bindings: Bindings): AST.Get<AST.BlockExpression, BindingsRM> => {
  return {
    ...node,
    entries: block(node.entries, bindings)
  };
};


const funcApplication = (node: AST.Get<AST.FuncApplication>, bindings: Bindings): AST.Get<AST.FuncApplication, BindingsRM> =>
  ({
    ...node,
    arg: expression(node.arg, bindings),
    func: expression(node.func, bindings),
  });

const thunkForce = (node: AST.Get<AST.ThunkForce>, bindings: Bindings): AST.Get<AST.ThunkForce, BindingsRM> =>
  ({
    ...node,
    thunk: expression(node.thunk, bindings)
  });



const match = (node: AST.Get<AST.Match>, bindings: Bindings): AST.Get<AST.Match, BindingsRM> => {
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
const namePattern = (node: AST.Get<AST.NamePattern>, bindings: Bindings): WithBindings<AST.Get<AST.NamePattern, BindingsRM>> => {
  const updatedNode = {
    ...node,
    meta: { bound: bindings }
  };
  const updatedBindings = append(bindings, node.name.value);

  return [updatedNode, updatedBindings];
};

const tuplePattern = (node: AST.Get<AST.TuplePattern>, bindings: Bindings): WithBindings<AST.Get<AST.TuplePattern, BindingsRM>> => {
  const [updatedMembers, updatedBindings] = mapWithState(node.members, bindings,
    (member, bindings): [AST.Get<AST.Pattern, BindingsRM>, Bindings] =>
      pattern(member, bindings)
  );

  return [
    { ...node, members: updatedMembers },
    updatedBindings
  ];
};

const particlePattern = (node: AST.Get<AST.ParticlePattern>, bindings: Bindings): WithBindings<AST.Get<AST.ParticlePattern, BindingsRM>> =>
  [
    { ...node, value: particle(node.value) },
    bindings
  ];

const wildcardPattern = (node: AST.Get<AST.WildcardPattern>, bindings: Bindings): WithBindings<AST.Get<AST.WildcardPattern, BindingsRM>> =>
  [node, bindings];

const pattern = mapByType({
  'name-pattern': namePattern,
  'tuple-pattern': tuplePattern,
  'particle-pattern': particlePattern,
  'wildcard-pattern': wildcardPattern
});



const func = (node: AST.Get<AST.Func>, bindings: Bindings): AST.Get<AST.Func, BindingsRM> =>
  ({
    ...node,
    body: expression(node.body, append(bindings, node.arg.value))
  });

const thunk = (node: AST.Get<AST.Thunk>, bindings: Bindings): AST.Get<AST.Thunk, BindingsRM> =>
  ({
    ...node,
    body: expression(node.body, bindings)
  });

// TODO - attach bindings to name node; know if name is bound yet ??
const name = (node: AST.Get<AST.Name>): AST.Get<AST.Name, BindingsRM> => node;

const tuple = (node: AST.Get<AST.Tuple>, bindings: Bindings): AST.Get<AST.Tuple, BindingsRM> =>
  ({
    ...node,
    members: node.members.map(n => expression(n, bindings))
  });

const particle = <N extends AST.Particle>(node: AST.Get<N>): AST.Get<N, BindingsRM> =>
  translate(node as AST.Get<AST.Particle>) as AST.Get<N, BindingsRM>;

const atom = (node: AST.Get<AST.Atom>): AST.Get<AST.Atom, BindingsRM> => node;
const bool = (node: AST.Get<AST.Bool>): AST.Get<AST.Bool, BindingsRM> => node;
const number = (node: AST.Get<AST.Numeral>): AST.Get<AST.Numeral, BindingsRM> => node;
const text = (node: AST.Get<AST.Text>): AST.Get<AST.Text, BindingsRM> => node;

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

