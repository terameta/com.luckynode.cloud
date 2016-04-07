#!/bin/bash
cd ~/cloud.luckynode.com
date
git fetch origin
reslog=$(git log HEAD..origin/master --oneline)
echo $reslog
if [ "$reslog" != "" ] ; then
    echo thereischange
    git reset --hard origin/master
    git merge origin/master
    forever restart cloudluckynode
else
    echo nochange
fi