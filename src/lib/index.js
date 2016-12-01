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
    this.parentHash = null;  
    // this.save = this.save.bind(this);
    // this.diff = this.diff.bind(this);
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

    const { filename, tree, parentHash, repo } = that;

    const { contents, author } = commit;

    // const author = `${name} <${email}>`;

    const message = FIXED_MESSAGE;

    const gitCommit = { author, parent: parentHash, committer: author, filename, contents, message };

    return new Promise((resolve, reject) => {
      //get a new parent
      repo.saveAs("tree", tree, function (err, treeHash) {
        if (err) return reject(err);

        const treeCommit = Object.assign({}, gitCommit, { tree: treeHash });
        if (parentHash === null) delete commit.parent;

        repo.saveAs("commit", treeCommit, function (err, parentCommitHash) {
          if (err) return reject(err);
          repo.updateHead(parentCommitHash);
          resolve(parentCommitHash);
        });
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

      const contentsHash = await this._saveBlob(commit);
      const parentHash = await this._saveAsCommit(commit);
      that.parentHash = parentHash;

    } catch (e) {
      throw new Error(e);
    }

  }

  diff = () => { console.log(this.fileFullPath); }

  rollForward = () => { }

  rollBack = () => { }

}
