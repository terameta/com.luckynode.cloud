#!/bin/bash
cd ~/cloud.luckynode.com
forever -a --minUptime 1000 --spinSleepTime 5000 --uid "cloudluckynode" start server/app.js