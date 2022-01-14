import { choice } from '.';
import { ExtendedRDParser, RDParser } from './common.types';
import { ConsumeHandle } from './handles';

export type PrecedenceContext = {
  precedence: number;
};

type ParserTable<H extends ConsumeHandle, C, R> =
  RDParser<H, C & PrecedenceContext, R>[][];

type PrecedenceTable<H extends ConsumeHandle, C, R> =
  RDParser<H, C, R>[];

type PrecedenceRec<H extends ConsumeHandle, C, R> =
  ExtendedRDParser<H, C, [precedence: number], R>;

const nextLevel = <H extends ConsumeHandle, C, R>(
  rec: PrecedenceRec<H, C, R>,
  level: number
): RDParser<H, C, R> =>
    (h, c) => rec(h, c, level + 1);

const buildPrecedenceTable = <H extends ConsumeHandle, C, R>(
  parserTable: ParserTable<H, C, R>,
  rec?: PrecedenceRec<H, C, R>
): PrecedenceTable<H, C, R> => {

  const parserTableWithContext = parserTable.map((parsers, level) =>
    parsers.map<RDParser<H, C, R>>(parser =>
      (h, c) => parser(h, { ...c, precedence: level })
    )
  );

  const choices = parserTableWithContext.reduceRight<RDParser<H, C, R>[]>((precedenceLevels, parsers, level) => {
    const nextPrecedenceLevel: RDParser<H, C, R> | undefined = rec
      ? nextLevel(rec, level)
      : precedenceLevels[0];

    const currentChoices = nextPrecedenceLevel
      ? [...parsers, nextPrecedenceLevel]
      : parsers;

    const currentPrecedenceLevel: RDParser<H, C, R> = (handle, context) =>
      choice(handle, context, currentChoices);

    return [currentPrecedenceLevel, ...precedenceLevels];
  }, [] as RDParser<H, C, R>[]);

  return choices;
};

type PrecedentedOptions<H extends ConsumeHandle, C, R> = {
  precedence: number;
  rec?: PrecedenceRec<H, C, R>;
};

export const precedented = <H extends ConsumeHandle, C, R, Ps extends RDParser<H, C & PrecedenceContext, R>[][]>(
  handle: H,
  context: C,
  { precedence, rec }: PrecedentedOptions<H, C, R>,
  parserTable: Ps
): R => {
  if (precedence < 0 || precedence >= parserTable.length) {
    throw new Error(`precedence out of bounds of parserTable (0 .. ${parserTable.length - 1})`);
  }

  const precedenceTable = buildPrecedenceTable(parserTable, rec);

  const precedenceParser: RDParser<H, C, R> = precedenceTable[precedence];

  return precedenceParser(handle, context);
};
