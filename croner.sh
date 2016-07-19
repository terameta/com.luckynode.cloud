#!/bin/bash
cd ~/cloud.luckynode.com
pwd
date
git fetch origin
reslog=$(git log HEAD..origin/master --oneline)
echo $reslog
if [ "$reslog" != "" ] ; then
    echo thereischange
    git reset --hard origin/master
    git merge origin/master
    forever restart cloudluckynode
    bower install
    npm install
else
    echo nochange
fi
