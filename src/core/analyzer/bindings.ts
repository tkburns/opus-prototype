import { mapByType } from '&/utils/nodes';
import type * as RS from '&/utils/recursion-scheme';
import * as AST from '../ast';
// import { BaseNodeRM, ExpressionNodeRM, ProgramNodeRM } from '../ast';

// TODO - put this somewhere common ?? remove it ??
type Meta<T> = { meta: T };

// TODO - use interfaces?
// TODO add TM<N, R> = { [T in N['type']]: R } util?
export type BindingsM = AST.NodeRM<[BindingsM]> & {
  'name-pattern': Meta<{ bound: Set<string> }>
};

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

const program = <N extends AST.Get<AST.Program>>(node: N): AST.Get<AST.Program, BindingsM> => {
  return {
    ...node,
    entries: block(node.entries, new Set())
  };
};


const block = <R extends AST.ASTM>(nodes: AST.Get<AST.Declaration | AST.Expression, R>[], bindings: Bindings):
  AST.Get<AST.Declaration | AST.Expression, R & BindingsM>[] =>
{
  const [updatedNodes, _] = mapWithState(nodes, bindings, (entry, bindings) =>
    blockEntry(entry, bindings)
  );

  return updatedNodes;
};


const blockEntry = <R extends AST.ASTM>(entry: AST.Get<AST.Declaration | AST.Expression, R>, bindings: Bindings):
  WithBindings<AST.Get<AST.Declaration | AST.Expression, R & BindingsM>> =>
{
  if (entry.type === 'declaration') {
    return declaration(entry, bindings);
  } else {
    return [expression(entry, bindings), bindings];
  }
};


// TODO - attach bindings to declaration node; know if name is shadowing..?
const declaration = <R extends AST.ASTM>(node: AST.Get<AST.Declaration, R>, bindings: Bindings):
  WithBindings<AST.Get<AST.Declaration, R & BindingsM>> =>
{
  const updatedNode = {
    ...node,
    name: name(node.name),
    expression: expression(node.expression, bindings)
  };

  const updateBindings = append(bindings, node.name.value);

  return [updatedNode, updateBindings];
};


const expression = <N extends AST.Expression, R extends AST.ASTM>(node: AST.Get<N, R>, bindings: Bindings): AST.Get<N, R & BindingsM> =>
  translate(node as AST.Get<AST.Expression>, bindings) as AST.Get<N, R & BindingsM>;


const blockExpression = <R extends AST.ASTM>(node: AST.Get<AST.BlockExpression, R>, bindings: Bindings): AST.Get<AST.BlockExpression, R & BindingsM> => {
  return {
    ...node,
    entries: block(node.entries, bindings)
  };
};


const funcApplication = <R extends AST.ASTM>(node: AST.Get<AST.FuncApplication, R>, bindings: Bindings): AST.Get<AST.FuncApplication, R & BindingsM> =>
  ({
    ...node,
    arg: expression(node.arg, bindings),
    func: expression(node.func, bindings),
  });

const thunkForce = <R extends AST.ASTM>(node: AST.Get<AST.ThunkForce, R>, bindings: Bindings): AST.Get<AST.ThunkForce, R & BindingsM> =>
  ({
    ...node,
    thunk: expression(node.thunk, bindings)
  });



const match = <R extends AST.ASTM>(node: AST.Get<AST.Match, R>, bindings: Bindings): AST.Get<AST.Match, R & BindingsM> => {
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
const namePattern = <R extends AST.ASTM>(node: AST.Get<AST.NamePattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.NamePattern, R & BindingsM>> => {
  const updatedNode = {
    ...node,
    meta: { bound: bindings }
  };
  const updatedBindings = append(bindings, node.name.value);

  return [updatedNode, updatedBindings];
};

const tuplePattern = <R extends AST.ASTM>(node: AST.Get<AST.TuplePattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.TuplePattern, R & BindingsM>> => {
  const [updatedMembers, updatedBindings] = mapWithState(node.members, bindings,
    (member, bindings): [AST.Get<AST.Pattern, R & BindingsM>, Bindings] =>
      pattern(member, bindings)
  );

  return [
    { ...node, members: updatedMembers },
    updatedBindings
  ];
};

const particlePattern = <R extends AST.ASTM>(node: AST.Get<AST.ParticlePattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.ParticlePattern, R & BindingsM>> =>
  [
    { ...node, value: particle(node.value) },
    bindings
  ];

const wildcardPattern = <R extends AST.ASTM>(node: AST.Get<AST.WildcardPattern, R>, bindings: Bindings): WithBindings<AST.Get<AST.WildcardPattern, R & BindingsM>> =>
  [node, bindings];

const pattern = mapByType({
  'name-pattern': namePattern,
  'tuple-pattern': tuplePattern,
  'particle-pattern': particlePattern,
  'wildcard-pattern': wildcardPattern
});



const func = <R extends AST.ASTM>(node: AST.Get<AST.Func, R>, bindings: Bindings): AST.Get<AST.Func, R & BindingsM> =>
  ({
    ...node,
    body: expression(node.body, append(bindings, node.arg.value))
  });

const thunk = <R extends AST.ASTM>(node: AST.Get<AST.Thunk, R>, bindings: Bindings): AST.Get<AST.Thunk, R & BindingsM> =>
  ({
    ...node,
    body: expression(node.body, bindings)
  });

// TODO - attach bindings to name node; know if name is bound yet ??
const name = <R extends AST.ASTM>(node: AST.Get<AST.Name, R>): AST.Get<AST.Name, R & BindingsM> => node;

const tuple = <R extends AST.ASTM>(node: AST.Get<AST.Tuple, R>, bindings: Bindings): AST.Get<AST.Tuple, R & BindingsM> =>
  ({
    ...node,
    members: node.members.map(n => expression(n, bindings))
  });

const particle = <N extends AST.Particle, R extends AST.ASTM>(node: AST.Get<N, R>): AST.Get<N, R & BindingsM> =>
  translate(node as AST.Get<AST.Particle>) as AST.Get<N, R & BindingsM>;

const atom = <R extends AST.ASTM>(node: AST.Get<AST.Atom, R>): AST.Get<AST.Atom, R & BindingsM> => node;
const bool = <R extends AST.ASTM>(node: AST.Get<AST.Bool, R>): AST.Get<AST.Bool, R & BindingsM> => node;
const number = <R extends AST.ASTM>(node: AST.Get<AST.Numeral, R>): AST.Get<AST.Numeral, R & BindingsM> => node;
const text = <R extends AST.ASTM>(node: AST.Get<AST.Text, R>): AST.Get<AST.Text, R & BindingsM> => node;

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

