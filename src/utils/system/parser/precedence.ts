import { choice } from '.';
import { ExtendedRDParser, RDParser } from './common.types';
import { ConsumeHandle } from './handles';

export type PrecedenceParser<H extends ConsumeHandle, C, R> =
  ExtendedRDParser<H, C, [precedence: number], R>;

type ParserTable<H extends ConsumeHandle, C, R> =
  PrecedenceParser<H, C, R>[][];

type PrecedenceTable<H extends ConsumeHandle, C, R> =
  RDParser<H, C, R>[];


const nextLevel = <H extends ConsumeHandle, C, R>(
  rec: PrecedenceParser<H, C, R>,
  level: number
): RDParser<H, C, R> =>
    (h, c) => rec(h, c, level + 1);

const buildPrecedenceTable = <H extends ConsumeHandle, C, R>(
  parserTable: ParserTable<H, C, R>,
  rec?: PrecedenceParser<H, C, R>
): PrecedenceTable<H, C, R> => {

  const parserTableWithContext = parserTable.map((parsers, level) =>
    parsers.map<RDParser<H, C, R>>(parser =>
      (h, c) => parser(h, c, level)
    )
  );

  const choices = parserTableWithContext.reduceRight<RDParser<H, C, R>[]>((precedenceLevels, parsers, level) => {
    let nextPrecedenceLevel: RDParser<H, C, R> | undefined = undefined;

    if (level < parserTableWithContext.length - 1) {
      nextPrecedenceLevel = rec
        ? nextLevel(rec, level)
        : precedenceLevels[0];
    }

    const currentChoices = nextPrecedenceLevel
      ? [...parsers, nextPrecedenceLevel]
      : parsers;

    const currentPrecedenceLevel: RDParser<H, C, R> = (handle, context) => {
      return choice(handle, context, currentChoices);
    };

    return [currentPrecedenceLevel, ...precedenceLevels];
  }, [] as RDParser<H, C, R>[]);

  return choices;
};


type PrecedentedOptions<H extends ConsumeHandle, C, R> = {
  precedence: number;
  rec?: PrecedenceParser<H, C, R>;
};

export const precedented = <H extends ConsumeHandle, C, R, Ps extends ParserTable<H, C, R>>(
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
