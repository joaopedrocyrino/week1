#!/bin/bash

cd contracts/circuits

mkdir Multipler3groth16

if [ -f ./powersOfTau28_hez_final_10.ptau ]; then
    echo "powersOfTau28_hez_final_10.ptau already exists. Skipping."
else
    echo 'Downloading powersOfTau28_hez_final_10.ptau'
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_10.ptau
fi

echo "Compiling Multiplier3.circom..."

# compile circuit

circom Multiplier3.circom --r1cs --wasm --sym -o Multipler3groth16
snarkjs r1cs info Multipler3groth16/Multiplier3.r1cs

# Start a new zkey and make a contribution

snarkjs groth16 setup Multipler3groth16/Multiplier3.r1cs powersOfTau28_hez_final_10.ptau Multipler3groth16/circuit_0000.zkey
snarkjs zkey contribute Multipler3groth16/circuit_0000.zkey Multipler3groth16/circuit_final.zkey --name="1st Contributor Name" -v -e="random text"
snarkjs zkey export verificationkey Multipler3groth16/circuit_final.zkey Multipler3groth16/verification_key.json

# generate solidity contract
snarkjs zkey export solidityverifier Multipler3groth16/circuit_final.zkey ../Multipler3groth16Verifier.sol

cd ../..