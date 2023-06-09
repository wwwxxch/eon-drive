#!/bin/sh
if [ $# -eq 1 ] && [ $1 -eq 1 ]; then
  echo "merge develop branch to docs_readme, main and push to github"
  
  git switch docs_readme
  git merge develop
  git push
  
  git switch main
  git merge develop
  git push
  
  git switch develop

  echo "done"
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
