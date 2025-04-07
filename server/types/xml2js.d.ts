declare module 'xml2js' {
  export interface ParserOptions {
    explicitArray?: boolean;
    mergeAttrs?: boolean;
    trim?: boolean;
    normalizeTags?: boolean;
    normalize?: boolean;
    explicitRoot?: boolean;
    emptyTag?: any;
    explicitCharkey?: boolean;
    charkey?: string;
    includeWhiteChars?: boolean;
    async?: boolean;
    strict?: boolean;
    attrkey?: string;
    attrNameProcessors?: Array<(name: string) => string>;
    attrValueProcessors?: Array<(value: string, name: string) => any>;
    tagNameProcessors?: Array<(name: string) => string>;
    valueProcessors?: Array<(value: string, name: string) => any>;
    charsAsChildren?: boolean;
  }

  export class Parser {
    constructor(options?: ParserOptions);
    parseString(str: string, callback?: (err: Error, result: any) => void): void;
    parseStringPromise(str: string): Promise<any>;
  }

  export function parseString(str: string, options: ParserOptions, callback: (err: Error, result: any) => void): void;
  export function parseString(str: string, callback: (err: Error, result: any) => void): void;
}