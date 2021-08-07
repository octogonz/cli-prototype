import * as path from 'path';
import { JsonFile } from '@rushstack/node-core-library';
import { ICliSpec } from '../CliSpec';
import { CliParser } from '../CliParser';

export interface ITestProfile {
  testName: string;
  testInputs: string[][];
  spec: ICliSpec;
}

export interface ITestProfileSet {
  testProfiles: ITestProfile[];
}

describe('CliParser', () => {
  const testDataPath: string = path.join(__dirname, 'test-profiles.json');
  const testProfileSet: ITestProfileSet = JsonFile.load(testDataPath);

  for (const testProfile of testProfileSet.testProfiles) {
    let cliParser: CliParser | undefined = undefined;

    test('parseSpec', () => {
      cliParser = CliParser.createFromSpec(testProfile.spec);
    });

    test(testProfile.testName, () => {
      if (cliParser) {
        for (const testInput of testProfile.testInputs) {
          expect({
            _testInput: testInput,
            result: cliParser.parse(testInput)
          }).toMatchSnapshot();
        }
      }
    });
  }
});
