import fs from 'fs-extra';
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
      const timedFile = new TimedFile({ fileFullPath: `${__dirname}/LICENSE` });
      expect(timedFile).to.have.property('save');
      expect(timedFile).to.have.property('diff');
      expect(timedFile).to.have.property('rollForward');
      expect(timedFile).to.have.property('rollBack');
    });

  });

  describe('Able to Save', () => {
    const fileFullPath = [gitTestFolder, 'saveTest.js'].join(PATH_DELIMITER);
    it('class created', () => {

      const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
      const timedFile = new TimedFile({ fileFullPath });
      fs.createFile(fileFullPath, 'Line 1\n');
      timedFile.save(author);
      fs.appendFileSync(fileFullPath, 'Line 2\n');
      timedFile.save(author);
    });
  });

  // after('Tear Down', () => {
  //   // setTimeout(()=>{fs.removeSync(gitTestFolder)}, 200);
  // });

});
