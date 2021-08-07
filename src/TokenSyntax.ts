export class TokenSyntax {
  // Example: "--do-something"
  public static parameterLongNameRegExp: RegExp = /^-(-[a-z0-9]+)+$/;

  // Example: "-d"
  public static parameterShortNameRegExp: RegExp = /^-[a-zA-Z]$/;

  // "Environment variable names used by the utilities in the Shell and Utilities volume of
  // IEEE Std 1003.1-2001 consist solely of uppercase letters, digits, and the '_' (underscore)
  // from the characters defined in Portable Character Set and do not begin with a digit."
  // Example: "THE_SETTING"
  public static environmentVariableRegExp: RegExp = /^[A-Z_][A-Z0-9_]*$/;

  // Example: "do-something"
  public static actionNameRegExp: RegExp = /^[a-z][a-z0-9]*([-:][a-z0-9]+)*$/;

  /**
   * Given an input string like `--example-flag-123-456` this returns `exampleFlag_123_456`
   */
  public static convertParameterLongNameToIdentifier(parameterLongName: string): string {
    let result: string = '';

    for (const part of parameterLongName.split('-')) {
      if (part.length > 0) {
        const firstCharacter: string = part[0];
        if (/[a-zA-Z]/.test(firstCharacter)) {
          if (result.length === 0) {
            // camelCase has lower case for the first part
            result += part;
          } else {
            // camelCase has a capitalized first letter for the remaining parts
            result += firstCharacter.toUpperCase();
            result += part.substr(1);
          }
        } else {
          // If the part starts with a number, add an underscore to make this mapping a bijection
          result += '_';
          result += part;
        }
      }
    }
    return result;
  }
}
