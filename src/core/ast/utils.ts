import { NodeF } from ".";

type Id = <T>(x: T) => T;
const id: Id = (x) => x;

// TODO - better type here?
export const ids: Record<NodeF['type'], Id> = {
    program: id,
    // ...
};

export const fmapWithState = () => {};

export const fmap = () => {};

export const transform = () => {};