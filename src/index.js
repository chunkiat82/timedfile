var git = require('git-node');
var basename = require('path').basename;

var pathname = `${__dirname}/gitFolder`;
// Create a local repo
var path = basename(pathname);
var repo = git.repo(path);

function saveAsBlob(tree, commit) {
  return new Promise((resolve, reject) => {
    repo.saveAs("blob", commit.contents, function(err, contentHash) {
      if (err) return reject(err);
      tree[commit.filename] = {
        mode: 644,
        hash: contentHash
      };
      resolve(contentHash);
    });
  });
}

function saveAsCommit(tree, parent, commit) {
  return new Promise((resolve, reject) => {
    repo.saveAs("tree", tree, function(err, filenameHash) {
      if (err) return reject(err);
      var gitCommmit = {
        tree: filenameHash,
        parent: parent,
        author: commit.author,
        committer: commit.committer,
        message: commit.message
      };
      if (!parent) delete commit.parent;
      repo.saveAs("commit", gitCommmit, function(err, parentHash) {
        if (err) return reject(err);
        repo.updateHead(parentHash);
        resolve(parentHash);
      });
    });
  });
}

function loadCommit(parentHash) {
  return new Promise((resolve, reject) => {
    repo.loadAs("commit", parentHash, (err, commit) => {
      if (err) return reject(err);
      resolve(commit);
    });
  });
}

function loadTree(commit) {
  var treeHash = commit.tree;
  return new Promise((resolve, reject) => {
    repo.loadAs("tree", treeHash, (err, tree) => {
      //console.log("TREE", hash, tree);
      if (err) return reject(err);
      resolve(tree);
    });
  });
}

function printTree(tree) {
  tree.forEach((entry) => {
    repo.loadAs("blob", entry.hash, function(err, blob) {
      if (err) throw err;
      console.log("BLOB", entry.hash, blob);
    //   var bufferBase64 = new Buffer( blob ).toString('base64');
      console.log("CONTENT", blob.toString('utf8'));
    });
  });
}

function run() {

  var author = {
    name: "Raymond Ho",
    email: "chunkiat82@gmail.com"
  };
  var committer = {
    name: "Raymond Ho",
    email: "chunkiat82@gmail.com"
  };
  var filename = "README.md";

  var commit1 = {
    author,
    committer,
    message: "Initial Commit\n",
    filename,
    contents: "# This is a test Repo\n\nIt's generated entirely by JavaScript\n"
  };

  var commit2 = {
    author,
    committer,
    message: "Second Commit\n",
    filename,
    contents: "# This is a test Repo\n\nIt's generated entirely by JavaScript\n Commit 2"
  };

  var commit3 = {
    author,
    committer,
    message: "Third Commit\n",
    filename,
    contents: "# Hello World People. Time to sleep."
  };

  repo.setHead("master", async function(err) {
    if (err) throw err;
    console.log("Git database Initialized");

    try {
      var tree = {};

      var contentHash1 = await saveAsBlob(tree, commit1);
      console.log(`tree at commit 1=${JSON.stringify(tree)}`);
      var parentHash1 = await saveAsCommit(tree, null, commit1);
      console.log(`contentHash1=${contentHash1} parentHash1=${parentHash1}`);

      var contentHash2 = await saveAsBlob(tree, commit2);
      console.log(`tree at commit 2=${JSON.stringify(tree)}`);
      var parentHash2 = await saveAsCommit(tree, parentHash1, commit2);
      console.log(`contentHash2=${contentHash2} parentHash2=${parentHash2}`);

      var contentHash3 = await saveAsBlob(tree, commit3);
      console.log(`tree at commit 3=${JSON.stringify(tree)}`);
      var parentHash3 = await saveAsCommit(tree, parentHash2, commit3);
      console.log(`contentHash3=${contentHash3} parentHash3=${parentHash3}`);

      /* reverse loop up */
      let nextParentHash = parentHash3;
      while (true) {
        const loadedCommit = await loadCommit(nextParentHash);
        const tree = await loadTree(loadedCommit);
        printTree(tree);
        if (Array.isArray(loadedCommit.parents) && loadedCommit.parents.length > 0) {
          nextParentHash = loadedCommit.parents[0];
        } else {
          break;
        }
      }



    } catch (e) {
      console.error(e);
    }

    // printTree(tree);
  });
}

run();
