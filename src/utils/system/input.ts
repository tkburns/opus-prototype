import fs from 'fs';

export type Source = string;
export type Input = {
  content: string;
  source: Source;
};

export const Input = {
  fromString: (source: Source, content: string): Input =>
    ({ source, content }),

  fromFile: (file: string): Input => {
    const content = fs.readFileSync(file, 'utf-8');
    return { source: `file:${file}`, content };
  },

  fromStdin: (): Input => {
    const content = fs.readFileSync(process.stdin.fd, 'utf-8');
    return { source: 'stdin', content };
  }
};
