import { InternalError } from '@rushstack/node-core-library';

import { TokenStream, TokenKind, IToken } from './TokenStream';
import { ICliSpec, CliParameter, ICliAction } from './CliSpec';
import { TokenSyntax } from './TokenSyntax';

type ParameterDetail = CliParameter & {
  identifier: string;
};

interface IActionDetail extends ICliAction {
  associatedParameters: Set<ParameterDetail>;
}

export interface IParsedParameterResult {
  value: string | number | string[] | number[] | boolean | undefined;
  token: IToken | undefined;
}

export interface IParsedResult {
  parameterResultsByIdentifier: Record<string, IParsedParameterResult>;

  errorMessage: string | undefined;
}

class ParserState {
  public readonly tokenStream: TokenStream;

  public errorToken: IToken | undefined = undefined;

  public result: IParsedResult;

  public constructor(args: string[]) {
    this.tokenStream = new TokenStream(args);
    this.result = {
      parameterResultsByIdentifier: {},
      errorMessage: undefined
    };
  }
}

export class CliParser {
  private readonly _cliSpec: ICliSpec;

  private readonly _parametersByLongName: Map<string, ParameterDetail> = new Map();
  private readonly _parametersByShortName: Map<string, ParameterDetail> = new Map();

  private readonly _globalParameters: Set<ParameterDetail> = new Set();
  private readonly _actionParameters: Set<ParameterDetail> = new Set();

  private readonly _actionsByName: Map<string, IActionDetail> = new Map();

  private constructor(cliSpec: ICliSpec) {
    this._cliSpec = cliSpec;

    for (const parameter of cliSpec.globalParameters) {
      this._globalParameters.add(this._createParameterDetail(parameter));
    }

    for (const parameter of cliSpec.actionParameters) {
      this._actionParameters.add(this._createParameterDetail(parameter));
    }

    for (const action of cliSpec.actions) {
      const existingAction: IActionDetail | undefined = this._actionsByName.get(action.actionName);
      if (existingAction) {
        throw new Error(`The action name "${action.actionName}" is already defined`);
      }

      const actionDetail: IActionDetail = {
        ...action,
        associatedParameters: new Set()
      };

      for (const parameterLongName of action.associatedParameterLongNames) {
        const parameter: ParameterDetail | undefined = this._parametersByLongName.get(parameterLongName);
        if (!parameter) {
          throw new Error(
            `The action "${action.actionName}" is associated with a parameter` +
              ` "${parameterLongName}" that was not defined`
          );
        }
        actionDetail.associatedParameters.add(parameter);
      }

      this._actionsByName.set(action.actionName, actionDetail);
    }
  }

  private _createParameterDetail(parameter: CliParameter): ParameterDetail {
    let existingParameter: ParameterDetail | undefined = this._parametersByLongName.get(parameter.longName);
    if (existingParameter) {
      throw new Error(`The parameter name "${parameter.longName}" is already defined`);
    }
    if (parameter.shortName) {
      existingParameter = this._parametersByShortName.get(parameter.shortName);
      if (existingParameter) {
        throw new Error(
          `The short name "${parameter.shortName}" is already in use by "${existingParameter}"`
        );
      }
    }

    const parameterDetail: ParameterDetail = {
      ...parameter,
      identifier: TokenSyntax.convertParameterLongNameToIdentifier(parameter.longName)
    };

    this._parametersByLongName.set(parameter.longName, parameterDetail);
    if (parameter.shortName) {
      this._parametersByShortName.set(parameter.shortName, parameterDetail);
    }

    return parameterDetail;
  }

  public static createFromSpec(cliSpec: ICliSpec): CliParser {
    return new CliParser(cliSpec);
  }

  public parse(shellArgs: string[]): IParsedResult {
    const parserState: ParserState = new ParserState(shellArgs);

    this._createParameterValues(parserState, this._globalParameters);

    for (;;) {
      const currentToken: IToken = parserState.tokenStream.currentToken;
      if (currentToken.kind === TokenKind.EndOfStream) {
        parserState.errorToken = undefined; // success
        break;
      }
      parserState.errorToken = currentToken;

      switch (currentToken.kind) {
        case TokenKind.Error:
          parserState.result.errorMessage = currentToken.errorMessage!;
          break;
        case TokenKind.LongParameter: {
          parserState.tokenStream.advance();

          const parameter: ParameterDetail | undefined = this._parametersByLongName.get(currentToken.value);
          if (parameter === undefined) {
            parserState.result.errorMessage = `Unrecognized command line parameter "${currentToken.value}"`;
            break;
          }
          this._parseParameter(parameter, currentToken, parserState);
          break;
        }

        case TokenKind.ShortParameter: {
          parserState.tokenStream.advance();

          const parameter: ParameterDetail | undefined = this._parametersByShortName.get(currentToken.value);
          if (parameter === undefined) {
            parserState.result.errorMessage = `Unrecognized command line parameter "${currentToken.value}"`;
            break;
          }
          this._parseParameter(parameter, currentToken, parserState);
          break;
        }

        default:
          throw new InternalError('Unimplemented TokenKind');
      }

      if (parserState.result.errorMessage !== undefined) {
        break;
      }
    }

    return parserState.result;
  }

  private _createParameterValues(parserState: ParserState, parameters: Set<ParameterDetail>): void {
    const parameterValuesByIdentifier: Record<string, IParsedParameterResult> =
      parserState.result.parameterResultsByIdentifier;

    for (const parameter of parameters.values()) {
      if (parameterValuesByIdentifier[parameter.identifier]) {
        throw new InternalError(`The identifier "${parameter.identifier}" was already written`);
      }
      parameterValuesByIdentifier[parameter.identifier] = {
        value: undefined,
        token: undefined
      };
    }
  }

  private _parseParameter(
    parameter: ParameterDetail,
    parameterNameToken: IToken,
    parserState: ParserState
  ): void {
    const result: IParsedParameterResult =
      parserState.result.parameterResultsByIdentifier[parameter.identifier];

    result.token = parameterNameToken;

    switch (parameter.kind) {
      case 'flag':
        result.value = true;
        return;

      case 'string':
        const argumentToken: IToken = parserState.tokenStream.currentToken;

        if (argumentToken.kind !== TokenKind.Literal) {
          parserState.result.errorMessage = `Missing argument ${parameter.argumentName} for parameter "${result.token.value}"`;
          return;
        }
        parserState.tokenStream.advance();

        result.value = argumentToken.value;
        return;
      default:
        throw new InternalError(`Unimplemented parameter kind`);
    }
  }
}
