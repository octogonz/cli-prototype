import { InternalError } from '@rushstack/node-core-library';
import { TokenSyntax } from './TokenSyntax';

export const enum TokenKind {
  LongParameter = 'LongParameter',
  ShortParameter = 'ShortParameter',
  Error = 'Error',
  Literal = 'Literal',
  EndOfStream = 'EndOfStream'
}

export interface IToken {
  kind: TokenKind;
  value: string;
  errorMessage?: string;
  tokenIndex: number;
}

export class TokenStream {
  public readonly shellArgs: readonly string[];

  private _currentToken: IToken;
  private _tokenIndex: number;

  public constructor(shellArgs: string[]) {
    this.shellArgs = shellArgs;
    this._tokenIndex = 0;
    this._currentToken = this._makeCurrentToken();
  }

  public get currentToken(): IToken {
    return this._currentToken;
  }

  public advance(): void {
    if (this._tokenIndex >= this.shellArgs.length) {
      throw new InternalError('TokenStream cannot advance past the end of the stream');
    } else {
      ++this._tokenIndex;
    }
    this._currentToken = this._makeCurrentToken();
  }

  private _makeCurrentToken(): IToken {
    if (this._tokenIndex >= this.shellArgs.length) {
      return {
        kind: TokenKind.EndOfStream,
        tokenIndex: this._tokenIndex,
        value: ''
      };
    }

    const arg: string = this.shellArgs[this._tokenIndex];

    if (arg.startsWith('--')) {
      if (TokenSyntax.parameterLongNameRegExp.test(arg)) {
        return {
          kind: TokenKind.LongParameter,
          tokenIndex: this._tokenIndex,
          value: arg
        };
      }

      return {
        kind: TokenKind.Error,
        errorMessage:
          `The argument ${JSON.stringify(arg)} looks like a long parameter name but has incorrect syntax: ` +
          'The name must be lower-case and use dash delimiters (e.g. "--do-a-thing")',
        tokenIndex: this._tokenIndex,
        value: arg
      };
    }

    if (arg.startsWith('-')) {
      if (TokenSyntax.parameterShortNameRegExp.test(arg)) {
        return {
          kind: TokenKind.ShortParameter,
          tokenIndex: this._tokenIndex,
          value: arg
        };
      }

      return {
        kind: TokenKind.Error,
        errorMessage:
          `The argument ${JSON.stringify(arg)} looks like a short parameter name but has incorrect syntax: ` +
          'The name must be a dash followed by a single upper-case or lower-case letter (e.g. "-a")',
        tokenIndex: this._tokenIndex,
        value: arg
      };
    }

    return {
      kind: TokenKind.Literal,
      tokenIndex: this._tokenIndex,
      value: arg
    };
  }
}
