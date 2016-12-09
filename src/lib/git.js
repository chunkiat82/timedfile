const FIXED_MESSAGE = 'Raymond Ho @ 2016';
const debug = require('debug')('timedfile');

import git from 'git-node';

import {
  writeFilePromise,
  readFilePromise,
  appendFilePromise,
  readFileSync,
  removePromise
} from './file';

function initRepo(repoPath){
  return git.repo(repoPath);
}

function saveBlob(commit) {
  const that = this;
  const {
    filename,
    repo,
    tree
  } = that;

  const {
    contents,
    author
  } = commit;

  const message = FIXED_MESSAGE;

  const gitCommit = {
    author,
    committer: author,
    filename,
    contents,
    message
  };

  return new Promise((resolve, reject) => {
    repo.saveAs("blob", contents, function (err, contentsHash) {
      if (err) return reject(err);
      tree[filename] = {
        mode: 644,
        hash: contentsHash
      };
      resolve(contentsHash);
    });
  });
}

async function saveCommit(commit) {

  const that = this;
  const {
    filename,
    tree,
    repo,
    repoPath,
    commitHash
  } = that;

  const {
    contents,
    author
  } = commit;

  const message = FIXED_MESSAGE;

  debug('saveCommit - commitHash = %s', commitHash);

  const gitCommit = {
    author,
    parent: commitHash,
    committer: author,
    filename,
    contents,
    message
  };

  return new Promise((resolve, reject) => {
    //get a new parent

    repo.saveAs('tree', tree, function (err, treeHash) {
      if (err) return reject(err);
      debug('treeHash = %s', treeHash);
      const treeCommit = Object.assign({}, gitCommit, {
        tree: treeHash
      });
      if (commitHash === null) delete treeCommit.parent;
      debug('commitHash = %s', commitHash);
      repo.saveAs("commit", treeCommit, async(err, commitHash) => {
        if (err) return reject(err);
        debug('aftersave commitHash = %s', commitHash);
        await saveCommitHead.call(that,commitHash);
        debug('aftersave saveCommitHead');
        resolve(commitHash);
      });
    });
  });
}

/* this loads the tree of files, not really needed for single file repo */
async function loadTree(commitTreeHash) {
  const that = this;
  const {
    repo
  } = that;

  return new Promise((resolve, reject) => {
    // debug(`repo=${repo}`);
    repo.loadAs('tree', commitTreeHash, (err, tree) => {

      if (err) return reject(err);
      resolve(tree);
    });
  });
}

async function loadCommit(commitHash) {
  const that = this;
  const {
    repo
  } = that;
  return new Promise((resolve, reject) => {
    repo.loadAs('commit', commitHash, (err, commit) => {
      if (err) return reject(err);
      return resolve(commit);
    });
  });
}

async function saveCommitHead(commitHash) {
  const that = this;
  const {
    headCommitFile
  } = that;
  return await writeFilePromise(headCommitFile, commitHash);
};

async function saveRolls() {
  const that = this;
  const {
    rolls,
    rollsFile
  } = that;

  debug('saveRolls rolls = %s', rolls.length);
  return await writeFilePromise(rollsFile, JSON.stringify(rolls));
};

async function loadText(blobHash) {
  const that = this;
  const {
    repo
  } = that;
  return new Promise((resolve, reject) => {
    repo.loadAs('text', blobHash, (err, text) => {
      if (err) return reject(err);
      return resolve(text);
    });
  });
}

export default {
  initRepo,
  saveBlob,
  saveCommit,
  loadTree,
  loadCommit,
  saveCommitHead,
  saveRolls,
  loadText
}
