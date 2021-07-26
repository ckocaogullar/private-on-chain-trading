#!/bin/bash
# go to the proof directory
export PATH=$PATH:/Users/ceren/.zokrates/bin
# compile
cd zokrates-proof
zokrates compile -i root.zok
# perform the setup phase
zokrates setup
# execute the program
zokrates compute-witness -a 337 113569
# generate a proof of computation
zokrates generate-proof