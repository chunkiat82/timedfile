import path from 'path';
import TimedFile from '../../src/lib/index';
import {
  log
} from 'mocha-logger';

const PATH_DELIMITER = '/';

describe('TimedFile', () => {
  describe('Class Functionalities', () => {
    it('class created', () => {
      const timedFile = new TimedFile(`${__dirname}/LICENSE`);
      expect(timedFile).to.have.property('save');
      expect(timedFile).to.have.property('diff');
      expect(timedFile).to.have.property('rollForward');
      expect(timedFile).to.have.property('rollBack');
    });

  });

  describe('Greet function', () => {

    const gitTestFolder = [__dirname, '..', 'testcases', 'git'].join(PATH_DELIMITER);

    it('class created', () => {
      const timedFile = new TimedFile([gitTestFolder, 'testfile.js'].join(PATH_DELIMITER));
      log(timedFile);
    });
  });
});
