#!/bin/bash
cd ~/cloud.luckynode.com
forever -a --minUptime 1000 --spinSleepTime 5000 --uid "cloudluckynode" -c "--trace_gc" start server/app.js