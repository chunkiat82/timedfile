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
      fs.writeFileSync(fileFullPath, 'Line 1\n');
      try {
        timedFile.save(author).then(() => {
          fs.appendFileSync(fileFullPath, 'Line 2\n');
          timedFile.diff();
          timedFile.save(author).then(() => {
            fs.appendFileSync(fileFullPath, 'Line 3\n');
            timedFile.diff();
          });
        });
      } catch (e) {
        console.log(e);
      }

    });
  });

  // after('Tear Down', () => {
  //   setTimeout(()=>{fs.removeSync(gitTestFolder)}, 200);
  // });

});
