# LsSpikes repository
### By Bill Ticehurst

This repo is for experimenting with various language service implementations.

Install "bower", then run `npm install` and `bower install` to install the dev dependencies. e.g.

```
npm install -g bower
npm install
bower install
```

To ensure the TypeScript submodule is sync'ed and up to date run `git submodule update`, then change into the TypeScript folder and ensure it's dependencies are installed and it is built locally by running `npm install` and `jake local`.

Build back in the './src' folder in the main repo by running `tsc`.  Launch the web site with `npm start` and browse to http://localhost:3000.

## Working with the submodule
This project contains a TypeScript fork as a submodule for experimenting with. Submodules in Git are tricky. To keep it up to date with the official Microsoft repo:

 - Ensure any changes you want to keep are committed locally on a working branch.
 - Change directory to the `./TypeScript` submodule folder.
 - Ensure the 'upstream' remote points to the official repo (`git remote -v`)
 - If not, add it (`git remote add upstream https://github.com/Microsoft/TypeScript.git`)
 - Fetch the changes from upstream (`git fetch upstream`)
 - Check out the master branch (`git checkout master`)
 - Merge the changes from upstream master in (`git merge upstream/master`)
 - You may then want to merge the latest `master` into your working branch (`git checkout <branch>`, `git merge master`).
 - Update the remote fork (`git push origin`)

To keep the submodule up to date in the parent:

 - Do any work required in a branch in the TypeScript submodule. (Ensure you are on a branch before doing the work, and not a detached HEAD - as if often the case in submodules).
 - Ensure the submodule changes are pushed up to the remote (so anyone else using the repo can pull the submodule commit).
 - Change to the root of this repo, do a `git status` and `git diff` to ensure the submodule commit has changed.
 - Add and commit the change in the parent repo (`git add TypeScript` and `git commit`).
 - Push the changes to the remote.
