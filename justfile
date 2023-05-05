
merge-upstream:
  git fetch upstream
  git checkout main
  git merge upstream/main
  git push

