#!/bin/sh
# mode 0 - ./update_branches.sh 0
# update docs in docs_reame branch, merge docs_readme branch to develop & main branches
if [ $# -eq 1 ] && [ $1 -eq 0 ]; then
  echo "merge docs_readme branch to develop, main and push to github"

  git switch develop
  git merge docs_readme
  git push

  git switch main
  git merge develop
  git push
  
  git switch develop

  echo "done"
# mode 1 - ./update_branches.sh 1
# update code in develop branch, merge develop branch to docs_readme & main branches
elif [ $# -eq 1 ] && [ $1 -eq 1 ]; then
  echo "merge develop branch to docs_readme, main and push to github"
  
  git switch docs_readme
  git merge develop
  git push
  
  git switch main
  git merge develop
  git push
  
  git switch develop

  echo "done"
# mode 2 - ./update_branches.sh 2 <feature branch name>
# merge new branch into doces_readme, develop, main branches
elif [ $# -eq 2 ] && [ $1 -eq 2 ] && [ -n "$2" ]; then
  echo "merge $2 branch to docs_readme, develop, and main and push them to github"
  
  git switch docs_readme
  git merge $2
  git push

  git switch develop
  git merge $2
  git push

  git switch main
  git merge $2
  git push

  git switch develop

  echo "done"
else
  echo "Invalid arguments or insufficient arguments provided"
  exit 1
fi
