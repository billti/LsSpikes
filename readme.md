# LsSpikes repository
### By Bill Ticehurst

Install "bower" and "grunt-cli" globally, then "npm install" and "bower install" to install the dev dependencies. e.g.

npm install -g grunt-cli
npm install -g bower
npm install
bower install

Build the site by running "grunt".  Launch it with "npm start".

This project contains a TypeScript fork as a submodule for experimenting with. To keep it up to date with the official repo:

 - Ensure any changes you want to keep are committed locally
 - Change directory to the ./TypeScript submodule folder.
 - Ensure the 'upstream' remote points to the official repo ("git remote -v")
 - If not, add it ("git remote add upstream https://github.com/Microsoft/TypeScript.git")
 - Fetch the changes from upstream ("git fetch upstream")
 - Check out the master branch ("git checkout master")
 - Merge the changes from upstream master in ("git merge upstream/master")
 - Update the remote fork ("git push origin")

To keep the submodule up to date in the parent:

 - Do any work required in a branch in the TypeScript submodule.
 - Ensure this is pushed up to the remote
 - Change to the root of this repo, do a "git status" and "git diff" to ensure the submodule commit has changed.
 - Add and commit the change in the parent repo ("git add TypeScript" and "git commit").
 - Push the changes to the remote.  (Ensure the submodule changes have been pushed first).
