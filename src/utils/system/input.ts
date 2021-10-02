
export type Source = string;
export type Input = {
  content: string;
  source: Source;
};

export const Input = {
  fromString: (source: Source, content: string): Input =>
    ({ source, content })
};
