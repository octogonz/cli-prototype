export type CliParameterKind = 'flag' | 'string';

export interface ICliParameterBase {
  kind: CliParameterKind;

  /**
   * The long name of the flag including double dashes, e.g. "--do-something"
   */
  longName: string;

  /**
   * An optional short name for the flag including the dash, e.g. "-d"
   */
  shortName?: string;

  /**
   * Documentation for the parameter that will be shown when invoking the tool with "--help"
   */
  description: string;

  /**
   * If true, then an error occurs if the parameter was not included on the command-line.
   */
  required?: boolean;
}

export interface ICliParameterWithArgumentBase extends ICliParameterBase {
  /**
   * The name of the argument, which will be shown in the command-line help.
   *
   * @remarks
   * For example, if the parameter name is '--count" and the argument name is "NUMBER",
   * then the command-line help would display "--count NUMBER".  The argument name must
   * be comprised of upper-case letters, numbers, and underscores.  It should be kept short.
   */
  argumentName: string;
}

export interface ICliFlagParameter extends ICliParameterBase {
  kind: 'flag';
}

export interface ICliStringParameter extends ICliParameterWithArgumentBase {
  kind: 'string';
}

export type CliParameter = ICliFlagParameter | ICliStringParameter;

export interface ICliAction {
  /**
   * The name of the action.  For example, if the tool is called "example",
   * then the "build" action might be invoked as: "example build -q --some-other-option"
   */
  actionName: string;

  /**
   * A detailed description that is shown on the action help page, which is displayed
   * by the command "example build --help", e.g. for actionName="build".
   */
  description: string;

  /**
   * A quick summary that is shown on the main help page.  If omitted,
   * the "description" is used, but truncated to
   */
  summary?: string;

  associatedParameterLongNames: string[];
}

export interface ICliSpec {
  toolName: string;

  globalParameters: CliParameter[];

  actionParameters: CliParameter[];

  actions: ICliAction[];
}
