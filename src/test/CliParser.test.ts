import * as path from 'path';
import { JsonFile, JsonObject } from '@rushstack/node-core-library'

const cliSpecsPath: string = path.join(__dirname, 'cli-specs.json');

const cliSpecs: JsonObject = JsonFile.load(cliSpecsPath);

describe('CliParser Test', () => {
  it('Correctly tests stuff', () => {
    expect(cliSpecs).toMatchSnapshot();
  });
});
