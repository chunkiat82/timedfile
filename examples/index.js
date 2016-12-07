const TimedFile = require('../dist/index');

const fileFullPath = [__dirname, 'examples', 'content', 'testfile.js'].join('/');
const versionsPath = [__dirname, 'examples', 'git'].join('/');
const timedfile = new TimedFile({
  fileFullPath,
  versionsPath
});
timedfile.save();
timedfile.reset();
