export interface SplitterOptions {
  stringsBegins: string[];
  stringsEnds: { [begin: string]: string };
  stringEscapes: { [begin: string]: string };

  allowSemicolon: boolean;
  allowCustomDelimiter: boolean;
  allowGoDelimiter: boolean;
  allowDollarDollarString: boolean;
}

export const defaultSplitterOptions: SplitterOptions = {
  stringsBegins: ["'"],
  stringsEnds: { "'": "'" },
  stringEscapes: { "'": "'" },

  allowSemicolon: true,
  allowCustomDelimiter: false,
  allowGoDelimiter: false,
  allowDollarDollarString: false,
};

export const mysqlSplitterOptions: SplitterOptions = {
  ...defaultSplitterOptions,

  allowCustomDelimiter: true,
  stringsBegins: ["'", '`'],
  stringsEnds: { "'": "'", '`': '`' },
  stringEscapes: { "'": '\\', '`': '`' },
};

export const mssqlSplitterOptions: SplitterOptions = {
  ...defaultSplitterOptions,
  allowSemicolon: false,
  allowGoDelimiter: true,

  stringsBegins: ["'", '['],
  stringsEnds: { "'": "'", '[': ']' },
  stringEscapes: { "'": "'" },
};

export const postgreSplitterOptions: SplitterOptions = {
  ...defaultSplitterOptions,

  allowDollarDollarString: true,

  stringsBegins: ["'", '"'],
  stringsEnds: { "'": "'", '"': '"' },
  stringEscapes: { "'": "'", '"': '"' },
};
