#!/bin/bash

while :
do
    ip link set dev eth2 down
    sleep 1
    ip link set dev eth2 up
    sleep 1
done

