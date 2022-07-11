import type * as AST from '&/core/ast';
import { last } from '&/utils/list';
import { mapByType, Typed } from '&/utils/nodes';
import * as js from './nodes';


export const program = (node: AST.Get<AST.Program>): js.Program => {
  return js.program(node.entries.map(statement));
};


export const declaration = (node: AST.Get<AST.Declaration>): js.Statement =>
  js.declaration(name(node.name), expression(node.expression));


const expression = (node: AST.Get<AST.Expression>): js.Expression =>
  translate(node);

const statement = (node: (AST.Get<AST.Declaration> | AST.Get<AST.Expression>)): js.Statement => {
  if (node.type === 'declaration') {
    return translate(node);
  } else {
    return js.expressionStatement(translate(node));
  }
};


export const blockExpression = (node: AST.Get<AST.BlockExpression>): js.IIFE => {
  const body = funcBlock(node);
  return js.iife(body);
};

const funcBlock = (node: AST.Get<AST.Expression>): js.Statement<js.StatementContext.Func>[] => {
  if (node.type === 'block-expression') {
    const lastEntry = last(node.entries);

    if (lastEntry && lastEntry.type !== 'declaration') {
      const body = node.entries.slice(0, -1)
        .map(statement);
      const ret = js.retrn(expression(lastEntry));

      return [...body, ret];
    }

    return node.entries.map(statement);
  } else {
    return [js.retrn(expression(node))];
  }
};

export const func = (node: AST.Get<AST.Func>): js.Func => {
  const body = funcBlock(node.body);
  return js.func([name(node.arg)], body);
};

export const thunk = (node: AST.Get<AST.Thunk>): js.Func => {
  const body = funcBlock(node.body);
  return js.func([], body);
};


export const funcApplication = (node: AST.Get<AST.FuncApplication>): js.FuncCall =>
  js.funcCall(expression(node.func), [expression(node.arg)]);

export const thunkForce = (node: AST.Get<AST.ThunkForce>): js.FuncCall =>
  js.funcCall(expression(node.thunk), []);


type MatchOptions = { subjectName: string };
export const match = (node: AST.Get<AST.Match>, { subjectName = 'subject' }: Partial<MatchOptions> = {}): js.IIFE => {
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

type PatternOptions = { subject: js.Expression };

const namePattern = (node: AST.Get<AST.NamePattern>, { subject }: PatternOptions) =>
  js.raw`__opus_internals__.match.name(${subject}, ${name(node.name)})`;

const tuplePattern = (node: AST.Get<AST.TuplePattern>, { subject }: PatternOptions): js.Raw => {
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

const particlePattern = (node: AST.Get<AST.ParticlePattern>, { subject }: PatternOptions) =>
  js.raw`__opus_internals__.match.particle(${subject}, ${expression(node.value)})`;

const wildcardPattern = (node: AST.Get<AST.WildcardPattern>) =>
  js.raw`true /* wildcard */`;

export const pattern = mapByType({
  'name-pattern': namePattern,
  'tuple-pattern': tuplePattern,
  'particle-pattern': particlePattern,
  'wildcard-pattern': wildcardPattern
});



export const name = (node: AST.Get<AST.Name>): js.Identifier => js.identifier(node.value);


export const tuple = (node: AST.Get<AST.Tuple>): js.Object => {
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

export const atom = (node: AST.Get<AST.Atom>): js.Symbol => js.symbol(node.value);
export const bool = (node: AST.Get<AST.Bool>): js.Boolean => js.boolean(node.value);
export const number = (node: AST.Get<AST.Numeral>): js.Number => js.number(node.token.source);
export const text = (node: AST.Get<AST.Text>): js.String => js.string(node.value);


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


