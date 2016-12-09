/* this file can be better with generator functions */
const debug = require('debug')('timedfile');
import fs from 'fs-extra';

export function writeFilePromise(fileFullPath, loadText) {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileFullPath, loadText, (err) => {
      if (err) return reject(err);
      return resolve();
    })
  });
}

export function readFilePromise(fileFullPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(fileFullPath, (err, contents) => {
      if (err) return reject(err);
      return resolve(contents);
    })
  });
}

export function appendFilePromise(fileFullPath, loadText) {
  return new Promise((resolve, reject) => {
    fs.appendFile(fileFullPath, loadText, (err) => {
      if (err) return reject(err);
      return resolve();
    })
  });
}

export function createFilePromise(fileFullPath) {
  return new Promise((resolve, reject) => {
    fs.createFile(fileFullPath, (err) => {
      if (err) return reject(err);
      return resolve();
    })
  });
}

export function readFileSync(headCommitFile){
    return fs.readFileSync(headCommitFile);
}

export function removePromise(fileFullPath) {
  debug('removePromise - removing - %s', fileFullPath)
  return new Promise((resolve, reject) => {
    fs.remove(fileFullPath, (err) => {
      if (err) return reject(err);
      return resolve();
    })
  });
}

export default {
    writeFilePromise, readFilePromise, appendFilePromise, createFilePromise, removePromise, readFileSync
}