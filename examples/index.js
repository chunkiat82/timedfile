const fs = require('fs');
const TimedFile = require('../dist/timedfile.min');
console.log('Start Example');

const fileFullPath = [__dirname, 'tmp', 'testfile.js'].join('/');
const versionsPath = [__dirname, 'tmp', 'git'].join('/');

const timedfile = new TimedFile({
  fileFullPath,
  versionsPath
});

const author = {
  name: "raymond",
  email: "chunkiat82@gmail.com"
};

console.log(`Created TimedFile`);

fs.writeFile(fileFullPath, 'Hello World', async function (err) {
  if (err) return console.log(err);

  await timedfile.save(author);

  console.log(`Saved TimedFile`);

  fs.appendFile(fileFullPath, 'Hello World Again', async function (err) {
    if (err) return console.log(err);

    await timedfile.reset();

    console.log(`Reset TimedFile`);

    const retrievedText = fs.readFileSync(fileFullPath).toString();

    console.log(`(retrievedText===TextInFile)\n(${retrievedText}===${'Hello World'})`);

    await timedfile.clean();

    console.log('Completed Example');
  });
});

