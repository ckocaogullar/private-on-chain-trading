#!/bin/bash
# go to the proof directory
export PATH=$PATH:/Users/ceren/.zokrates/bin
# compile
cd ../zokrates-proof/$1
zokrates compile -i root.zok
# perform the setup phase
zokrates setup
# execute the program
zokrates compute-witness -a $2 $3 $4
# generate a proof of computation
zokrates generate-proof