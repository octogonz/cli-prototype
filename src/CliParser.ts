import { ICliSpec } from './CliSpec';

export interface ICliParserResult {}

export class CliParser {
  public static createFromSpec(cliSpec: ICliSpec): CliParser {
    return new CliParser();
  }

  public parse(input: string): ICliParserResult {
    return {};
  }
}
