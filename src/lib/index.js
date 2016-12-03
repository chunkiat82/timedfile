import { basename, dirname } from 'path';
import git from 'git-node';
import fs from 'fs';

const FIXED_MESSAGE = 'Raymond Ho @ 2016';

export default class TimedFile {
  constructor(options) {

    const {fileFullPath, author } = options;

    this.fileFullPath = fileFullPath;
    this.directory = dirname(this.fileFullPath);
    this.filename = basename(this.fileFullPath);
    this.repo = git.repo(this.directory);
    this.tree = {};
    this.headHash = null;
  }

  /* sample commit
      var commit1 = {
        author
        contents: "# This is a test Repo\n\nIt's generated entirely by JavaScript\n"
      };
  */
  _saveBlob = (commit) => {
    const that = this;

    const { filename, repo, tree } = that;

    const { contents, author } = commit;

    // const author = `${name} <${email}>`;

    const message = FIXED_MESSAGE;

    const gitCommit = { author, committer: author, filename, contents, message };

    return new Promise((resolve, reject) => {
      repo.saveAs("blob", contents, function (err, contentsHash) {
        if (err)
          return reject(err);
        tree[filename] = {
          mode: 644,
          hash: contentsHash
        };
        resolve(contentsHash);
      });
    });
  }

  _saveAsCommit = (commit) => {

    const that = this;

    const { filename, tree, headHash, repo } = that;

    const { contents, author } = commit;

    // const author = `${name} <${email}>`;

    const message = FIXED_MESSAGE;

    const gitCommit = { author, parent: headHash, committer: author, filename, contents, message };

    return new Promise((resolve, reject) => {
      //get a new parent

      repo.saveAs("tree", tree, function (err, treeHash) {
        if (err) return reject(err);

        const treeCommit = Object.assign({}, gitCommit, { tree: treeHash });
        if (headHash === null) delete commit.parent;

        console.log(`treeCommit=${JSON.stringify(treeCommit, null, 4)}`);

        repo.saveAs("commit", treeCommit, function (err, headHash) {
          if (err) return reject(err);          
          repo.updateHead(headHash);
          resolve(headHash);
        });
      });
    });
  }

  _loadTree = (commit) => {
    const that = this;
    const { repo } = that;

    const commitTreeHash = commit.tree;
    return new Promise((resolve, reject) => {
      // console.log(`repo=${repo}`);
      repo.loadAs("tree", commitTreeHash, (err, tree) => {

        if (err) {
          // console.log(`err=${JSON.stringify(err, null, 2)}`);
          return reject(err);
        }        
        // console.log(`tree=${JSON.stringify(tree, null, 2)}`);
        resolve(tree);
      });
    });
  }

  _loadCommit = (commitHash) => {
    const that = this;
    const { repo } = that;
    return new Promise((resolve, reject) => {
      repo.loadAs("commit", commitHash, (err, commit) => {
        if (err) return reject(err);
        resolve(commit);
      });
    });
  }

  save = async (author) => {
    var that = this;

    const { fileFullPath } = that;
    // console.log(`fullFilePath=${this.fileFullPath}`);
    try {
      // const { name, email } = author;
      const contents = fs.readFileSync(fileFullPath).toString();
      const commit = { author, contents };
      const contentsHash = await that._saveBlob(commit);
      const headCommitHash = await that._saveAsCommit(commit);
      that.headHash = headCommitHash;
      const headCommit = await that._loadCommit(headCommitHash);
      const loadTree = await that._loadTree(headCommit);
      console.log(`loadTree=${JSON.stringify(loadTree, null, 2)}`);
    } catch (e) {
      console.log(e);
      throw new Error(e);

    }

  }

  diff = () => { console.log(this.fileFullPath); }

  rollForward = () => { }

  rollBack = () => { }

}
