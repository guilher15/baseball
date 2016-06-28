#!/bin/sh

mkdir -p img teams
for f in $(<teams.txt); do
  mkdir -p teams/$f
  node teams.js $f
done
