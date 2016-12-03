import fs from 'fs-extra';
import path from 'path';
import TimedFile from '../../src/lib/index';
import {
  log
} from 'mocha-logger';
const PATH_DELIMITER = '/';
const gitTestFolder = [__dirname, '..', 'testcases', 'git'].join(PATH_DELIMITER);
const contentTestFolder = [__dirname, '..', 'testcases', 'content'].join(PATH_DELIMITER);
const fileFullPath = [contentTestFolder, 'saveTest.js'].join(PATH_DELIMITER);

describe('TimedFile', () => {

  before('before TimeFile', () => {
    fs.createFileSync(fileFullPath);
  });

  describe('Functionalities Present', () => {
    it('class created', () => {
      const timedFile = new TimedFile({ fileFullPath: `${__dirname}/LICENSE`, versionsPath: `${gitTestFolder}` });
      expect(timedFile).to.have.property('save');
      expect(timedFile).to.have.property('diff');
      expect(timedFile).to.have.property('rollForward');
      expect(timedFile).to.have.property('rollBack');
    });

  });

  describe('Able to Save', () => {
    it('class created', async () => {
      const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
      const timedFile = new TimedFile({ fileFullPath, versionsPath: `${gitTestFolder}` });
      fs.writeFileSync(fileFullPath, 'Line 1\n');
      try {
        await timedFile.save(author);
        const jsDiffs = await timedFile.diff();
        expect(jsDiffs).to.eql([{ value: 'Line 1\n', count: 7 }]);
        
        // const diffs = [];
        // jsDiffs.forEach(function (part) {
        //   // green for additions, red for deletions 
        //   // grey for common parts 
        //   var color = part.added ? 'green' :
        //     part.removed ? 'red' : 'grey';
        //   diffs.push(part.value[color]);
        // });
        // console.log()
      } catch (e) {
        console.log(e);
      }
    });
  });

  // describe('Able to Diff', () => {
  //   it('class created', async () => {
  //     const author = { name: 'Raymond Ho', email: 'chunkiat82@gmail.com' };
  //     const timedFile = new TimedFile({ fileFullPath });
  //     fs.writeFileSync(fileFullPath, 'Line 2\n');
  //     try {
  //       await timedFile.save(author);
  //       const jsDiffs = await timedFile.diff();
  //       expect(jsDiffs).to.eql([{ value: 'Line 1\n', count: 7 }]);
        
  //       // const diffs = [];
  //       // jsDiffs.forEach(function (part) {
  //       //   // green for additions, red for deletions 
  //       //   // grey for common parts 
  //       //   var color = part.added ? 'green' :
  //       //     part.removed ? 'red' : 'grey';
  //       //   diffs.push(part.value[color]);
  //       // });
  //       // console.log()
  //     } catch (e) {
  //       console.log(e);
  //     }
  //   });
  // });

  // after('Tear Down', () => {
  //   setTimeout(() => { fs.removeSync(contentTestFolder) }, 200);
  //   setTimeout(() => { fs.removeSync(gitTestFolder) }, 200)
  // });

});
