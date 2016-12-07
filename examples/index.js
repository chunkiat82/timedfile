const fs = require('fs');
const TimedFile = require('../dist/timedfile.min');
console.log('Start Example');

const fileFullPath = [__dirname, 'tmp', 'testfile.js'].join('/');
const versionsPath = [__dirname, 'tmp', 'git'].join('/');

const timedfile = new TimedFile({
  fileFullPath,
  versionsPath
});

fs.writeFile(fileFullPath, 'Hello World', function(err){
    if (err) return console.log(err);
    timedfile.save();
    timedfile.reset();
});
console.log('Completed Example');