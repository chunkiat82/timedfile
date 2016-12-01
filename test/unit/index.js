import fs from 'fs';
import path from 'path';
import TimedFile from '../../src/lib/index';
import {
  log
} from 'mocha-logger';

const PATH_DELIMITER = '/';
const gitTestFolder = [__dirname, '..', 'testcases', 'git'].join(PATH_DELIMITER);

describe('TimedFile', () => {
  describe('Functionalities Present', () => {
    it('class created', () => {
      const timedFile = new TimedFile(`${__dirname}/LICENSE`);
      expect(timedFile).to.have.property('save');
      expect(timedFile).to.have.property('diff');
      expect(timedFile).to.have.property('rollForward');
      expect(timedFile).to.have.property('rollBack');
    });

  });

  describe('Able to Save', () => {
    const fullFilePath = [gitTestFolder, 'saveTest.js'].join(PATH_DELIMITER);
    it('class created', () => {
      const timedFile = new TimedFile(fullFilePath);
      fs.appendFileSync(fullFilePath, 'Line 1\n');
      timedFile.save({name:'Raymond Ho', email:'chunkiat82@gmail.com'});
      // timedFile.diff();
    });
  });
});
