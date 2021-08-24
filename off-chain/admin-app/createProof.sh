#!/bin/bash
# go to the proof directory
export PATH=$PATH:/Users/ceren/.zokrates/bin
# compile
cd ../zokrates-proof/decision-proof
# execute the program
echo $1 $2 $3 $4 $5
zokrates compute-witness -a $1 $2 $3 $4 $5
# generate a proof of computation
zokrates generate-proof
