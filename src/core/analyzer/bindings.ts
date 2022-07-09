import type * as RS from '&/utils/recursion-scheme';
import * as AST from '../ast';


type Meta<T> = { meta: T };

// TODO - doesn't work exactly... - [AST.NamePattern] gets & onto everything...
export type Bindings = AST.NodeM<[AST.NamePattern, Meta<{ bound: string[] }>]>;

export type DecoratedAST = AST.ASTF<Bindings>;



export const program = <R extends RS.Map>(node: AST.Program<R>): AST.Program<R & Bindings> => {
  return {
    ...node,
    entries: node.entries.map(n => {
      if (n.type === 'declaration') {
        return declaration(n);
      } else {
        return expression(n);
      }
    })
  };
};


export const declaration = <R extends AST.NodeM>(node: AST.Declaration<R>): AST.Declaration<R & Bindings> =>
  ({
    ...node,
    name: name<R>(node.name),
    expression: expression<R>(node.expression)
  });


const expression = <R extends RS.Map>(node: AST.Expression<R>): AST.Expression<R & Bindings> =>
  translate(node);


export const blockExpression = <R extends RS.Map>(node: AST.BlockExpression<R>):
  AST.BlockExpression<R & Bindings> => {
  const body = funcBlock(node);
  return js.iife(body);
};


export const funcApplication = <R extends RS.Map>(node: AST.FuncApplication<R>): AST.FuncApplication<R & Bindings> =>
  js.funcCall(expression(node.func), [expression(node.arg)]);

export const thunkForce = <R extends RS.Map>(node: AST.ThunkForce<R>): AST.ThunkForce<R & Bindings> =>
  js.funcCall(expression(node.thunk), []);



export const match = <R extends RS.Map>(node: AST.Match<R>): AST.Match<R & Bindings> => {
  const subject = js.identifier(subjectName);
  const exhaustive = last(node.clauses)?.pattern.type === 'wildcard-pattern';

  const clauses = node.clauses.map((clause) => ({
    clause,
    condition: pattern(clause.pattern, { subject }),
    body: funcBlock(clause.body)
  }));

  let body: js.Statement<js.StatementContext.Func>[];
  if (exhaustive) {
    const lastClause = last(clauses);
    if (lastClause?.clause.pattern.type === 'wildcard-pattern') {
      body = [js.ifElse(
        clauses.slice(0, -1).map(clause =>
          js.ifElse.clause<js.StatementContext.Func>(clause.condition, clause.body)
        ),
        lastClause.body
      )];
    } else {
      body = [js.ifElse(
        clauses.map(clause =>
          js.ifElse.clause<js.StatementContext.Func>(clause.condition, clause.body)
        )
      )];
    }
  } else {
    body = [js.ifElse(
      clauses.map(clause =>
        js.ifElse.clause<js.StatementContext.Func>(clause.condition, clause.body)
      ),
      [js.raw`throw new Error(\`no match for \${${subject}}\`);`]
    )];
  }

  const arg = {
    name: subject,
    value: expression(node.principal)
  };

  return js.iife(body, [arg]);
};

const namePattern = <R extends RS.Map>(node: AST.NamePattern<R>): AST.NamePattern<R & Bindings> =>
  js.raw`__opus_internals__.match.name(${subject}, ${name(node.name)})`;

const tuplePattern = <R extends RS.Map>(node: AST.TuplePattern<R>): AST.TuplePattern<R & Bindings> => {
  const memberMatches = node.members.map((member, index) => {
    const subjectMember = js.raw`${subject}._${index}`;
    return js.func([], [
      js.retrn(pattern(member, { subject: subjectMember }))
    ]);
  });

  return js.raw`
    __opus_internals__.match.tuple(${subject}, [
      ${memberMatches.map(mbr => js.raw`${mbr},`)}
    ])
  `;
};

const particlePattern = <R extends RS.Map>(node: AST.ParticlePattern<R>): AST.ParticlePattern<R & Bindings> =>
  js.raw`__opus_internals__.match.particle(${subject}, ${expression(node.value)})`;

const wildcardPattern = <R extends RS.Map>(node: AST.WildcardPattern<R>): AST.WildcardPattern<R & Bindings> =>
  js.raw`true /* wildcard */`;

// TODO - update this ???
export const pattern = mapByType({
  'name-pattern': namePattern,
  'tuple-pattern': tuplePattern,
  'particle-pattern': particlePattern,
  'wildcard-pattern': wildcardPattern
});



export const func = <R extends RS.Map>(node: AST.Func<R>): AST.Func<R & Bindings> => {
  const body = funcBlock(node.body);
  return js.func([name(node.arg)], body);
};

export const thunk = <R extends RS.Map>(node: AST.Thunk<R>): AST.Thunk<R & Bindings> => {
  const body = funcBlock(node.body);
  return js.func([], body);
};




export const name = <R extends RS.Map>(node: AST.Name<R>): AST.Name<R & Bindings> => js.identifier(node.value);


export const tuple = <R extends RS.Map>(node: AST.Tuple<R>): AST.Tuple<R & Bindings> => {
  const memberFields = node.members.reduce((obj, member, index) => ({
    ...obj,
    [`_${index}`]: expression(member)
  }), {});

  return js.object({
    '__opus_kind__': js.string('tuple'),
    size: js.number(node.members.length.toString()),
    ...memberFields
  });
};

export const atom = <R extends RS.Map>(node: AST.Atom<R>): AST.Atom<R & Bindings> => js.symbol(node.value);
export const bool = <R extends RS.Map>(node: AST.Bool<R>): AST.Bool<R & Bindings> => js.boolean(node.value);
export const number = <R extends RS.Map>(node: AST.Numeral<R>): AST.Numeral<R & Bindings> => js.number(node.token.source);
export const text = <R extends RS.Map>(node: AST.Text<R>): AST.Text<R & Bindings> => js.string(node.value);


const translators = {
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
};

export type TranslatableTypes = keyof typeof translators;
export const translatableTypes = Object.keys(translators) as TranslatableTypes[];

export type Translatable = Extract<AST.Node, Typed<TranslatableTypes>>;
export const translate = mapByType(translators);

// export const analyzeBindings = defaultedWalker<AST.Node>().create({
// });

