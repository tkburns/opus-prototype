import { TokenBase } from '../lexer';
import { UnrestrainedLeftRecursion } from './errors';
import { ConsumeHandle, Mark } from './handles';

export interface LRecHandleCore {
  getSavedLRecNode: (n: string) => unknown;
}

export type LRecHandle<Handle extends ConsumeHandle<TokenBase>> =
  Handle & LRecHandleCore;

const isLRecHandle = (
  handle: object
): handle is LRecHandleCore =>
  'getSavedLRecNode' in handle;


export const createEmptyLRecHandle = <Handle extends ConsumeHandle<TokenBase>>(handle: Handle):
  LRecHandle<Handle> =>
{
  const getSavedLRecNode = () => undefined;

  return { ...handle, getSavedLRecNode };
};


const ensureLRecHandle = <Handle extends ConsumeHandle<TokenBase>>(handle: Handle):
  Handle & LRecHandleCore =>
{
  if (isLRecHandle(handle)) {
    return handle;
  } else {
    return createEmptyLRecHandle(handle);
  }
};

export const createBaseLRecHandle =
  <Handle extends ConsumeHandle<TokenBase>>(name: string, _handle: Handle):
    LRecHandle<Handle> =>
  {
    const handle = ensureLRecHandle(_handle);
    const start = handle.mark();

    const getSavedLRecNode = (n: string) => {
      const current = handle.mark();

      if (start.position === current.position && n === name) {
        throw new UnrestrainedLeftRecursion(name);
      } else {
        return handle.getSavedLRecNode(n);
      }
    };

    return {
      ...handle,
      getSavedLRecNode: getSavedLRecNode as (n: string) => never
    };
  };

type Prev<Node = unknown> = {
  node: Node;
  endMark: Mark;
};
export const createAccLRecHandle =
  <Handle extends ConsumeHandle<TokenBase>>(name: string, prev: Prev, _handle: Handle):
    LRecHandle<Handle> =>
  {
    const handle = ensureLRecHandle(_handle);
    const start = handle.mark();

    const getSavedLRecNode = (n: string) => {
      const current = handle.mark();

      if (start.position === current.position && n === name) {
        handle.reset(prev.endMark);
        return prev.node;
      } else {
        return handle.getSavedLRecNode(n);
      }
    };

    return {
      ...handle,
      getSavedLRecNode
    };
  };

export const LRecHandle = {
  createEmpty: createEmptyLRecHandle,
  createBase: createBaseLRecHandle,
  createAcc: createAccLRecHandle,
};


type RDParser<T extends TokenBase, R, H extends ConsumeHandle<T>> = (handle: H) => R;

/*
  requires that all parsers be *pure* & *referentially transparent*
  stops when the parser stops consuming additional input (end position <= prev end position)
  essentially calculates the fixpoint of the parser given the input (not exactly... only compares the position/mark, not the result)
*/
export const lrec = <T extends TokenBase, R, H extends ConsumeHandle<T>>(name: string, parser: RDParser<T, R, H>): RDParser<T, R, H> =>
  (handle: H) => {
    if (isLRecHandle(handle)) {
      const saved = handle.getSavedLRecNode(name) as R | undefined;
      if (saved) {
        return saved;
      }
    }

    const startMark = handle.mark();

    const baseHandle = LRecHandle.createBase(name, handle);
    const base = parser(baseHandle);
    let prev = { node: base, endMark: handle.mark() };

    let failed = false;
    while (!failed) {
      try {
        handle.reset(startMark);

        const lrecHandle = LRecHandle.createAcc(name, prev, handle);
        const node = parser(lrecHandle);

        const endMark = handle.mark();
        if (endMark.position > prev.endMark.position) {
          prev = { node, endMark };
        } else {
          failed = true;
        }

      } catch (e) {
        failed = true;
      }
    }

    handle.reset(prev.endMark);
    return prev.node;
  };
