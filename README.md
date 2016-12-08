[![build status](https://img.shields.io/travis/chunkiat82/timedfile/master.svg?style=flat-square)](https://travis-ci.org/chunkiat82/timedfile)
[![npm version](https://img.shields.io/npm/v/timedfile.svg?style=flat-square)](https://www.npmjs.com/package/timedfile)
[![npm downloads](https://img.shields.io/npm/dm/timedfile.svg?style=flat-square)](https://www.npmjs.com/package/timedfile)
[![npm downloads](https://img.shields.io/coveralls/chunkiat82/timedfile/master.svg?style=flat-square)](https://coveralls.io/github/chunkiat82/timedfile)
## TimedFile

If you need a single file to be versioned, this wrapper for you.

## Features

You can `save`, `rollback`, `fastforward`, `reset` and `clean`

* `save` to create a version on the timeline which you rollback, fastforward or reset to.
* `rollback` to go back to a version which you have saved before
* `fastforward` to fast forward to a version during a rollback
* `reset` to remove all existing changes to the current version on the timeline (not always the latest)
* `clean` to remove all existing versioning data (including commits and rollbacks), as good a new timedfile.

## Basic Usage

Examples of how to use the wrapper - Using Async/Await

For more usage examples, you can refer to the full documentation unit tests

#### To Save
```js
const timedFile = new TimedFile({fileFullPath: 'PathToFile'});
```
Here is where you write something to the file 
```js
fs.appendFileSync(pathToFile, 'Some New Line');
```
* Saving

```js
await timedFile.save(author);
```

#### To Rollback

```js
const timedFile = new TimedFile({fileFullPath: 'PathToFile'});
```
Here is where you write and save to the file a few times.

```js
fs.appendFileSync(pathToFile, 'Some Line');
await timedFile.save(author);
fs.appendFileSync(pathToFile, 'Some Line Again');
await timedFile.save(author);
```
* Rollback

```js
await timedFile.rollback();
```
It rollbacks to a version without the last entry of `Some Line Again`

#### To FastForward

*Continuing from the Rollback scenario*

* Fastforward 

```js
await timedFile.fastforward();
```
It rollbacks to a version with the last entry of `Some Line Again`

#### To Reset

Regardless of the contents in the file, 

* Reset

```js
await timedFile.reset();
```

* Clean

```js
await timedFile.clean();
```










