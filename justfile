# useful tools and commands
# install from https://github.com/casey/just
# use `just` command on its own to see a summary

set export
set dotenv-load # load .env values to use in here
set ignore-comments := true

# list all recipes
default:
  @just --list

merge-upstream:
  git fetch upstream
  git checkout main
  git merge upstream/main
  git push

