const { expect } = require('chai')
const { ethers } = require('hardhat')
const { groth16, plonk } = require('snarkjs')

function unstringifyBigInts(o) {
    if (typeof o == 'string' && /^[0-9]+$/.test(o)) {
        return BigInt(o)
    } else if (typeof o == 'string' && /^0x[0-9a-fA-F]+$/.test(o)) {
        return BigInt(o)
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts)
    } else if (typeof o == 'object') {
        if (o === null) return null
        const res = {}
        const keys = Object.keys(o)
        keys.forEach((k) => {
            res[k] = unstringifyBigInts(o[k])
        })
        return res
    } else {
        return o
    }
}

const describeGroth16 = (verifierName, input, wasmFile, zkeyFileName, log) => (() => {
    let verifier, contract

    beforeEach(async () => {
        contract = await ethers.getContractFactory(verifierName)
        verifier = await contract.deploy()
        await verifier.deployed()
    })

    it('Should return true for correct proof', async () => {
        // proof cointains the G1 and G2 points of groth16
        // while publicSignal contains all the public signal of the circuit (in this case only the output)
        const { proof, publicSignals } = await groth16.fullProve(
            // The input provided by the prover
            input,
            // The wasm file path
            wasmFile,
            // The zkey file path
            zkeyFileName,
        )

        // Just prints if the output of the circuit is the expected
        console.log(`${log} =`, publicSignals[0])

        // Transforms the string array containing the public signals
        // into a bigInt array of the public signals
        const editedPublicSignals = unstringifyBigInts(publicSignals)

        // Transforms the G1 and G2 points from number strings to numbers
        const editedProof = unstringifyBigInts(proof)

        // The prover calculates the call data that
        // will be sent to the verifier smart contract
        // using the groth16 G1 and G2 points and the public signals
        const calldata = await groth16.exportSolidityCallData(
            editedProof,
            editedPublicSignals,
        )

        // Transforms the solidity call data to numbers on base 10
        const argv = calldata
            .replace(/["[\]\s]/g, '')
            .split(',')
            .map((x) => BigInt(x).toString())

        // Isolates the numbers that compose the first G1 point
        const a = [argv[0], argv[1]]

        // Isolates the numbers that compose the G2 point
        const b = [
            [argv[2], argv[3]],
            [argv[4], argv[5]],
        ]

        // Isolates the numbers that compose the second G1 point
        const c = [argv[6], argv[7]]

        // Isolates the public signals
        const Input = argv.slice(8)


        // Here we call the smart contract method to verify if
        // the proof were honestly computed
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true
    })

    it('Should return false for invalid proof', async () => {
        // Here invalid data is set to invalidate the proof
        let a = [0, 0]
        let b = [
            [0, 0],
            [0, 0],
        ]
        let c = [0, 0]
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false
    })
})

// RUN TESTS FOR HELLOWORLD
describe('HelloWorld circuit', describeGroth16(
    // The first param is the name of the verifier smart contract
    'HelloWorldVerifier',
    // The second param is the circuit input
    { a: '5', b: '2' },
    // The third param is the wasm file path
    'contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm',
    // The fourth param is the zkey file path
    'contracts/circuits/HelloWorld/circuit_final.zkey',
    // The last param is the log that should appear to check if output is the expected
    '5x2'
))

// RUN TESTS FOR MULTIPLIER3 WITH GROTH16
describe('Multiplier3 with Groth16 circuit', describeGroth16(
    // The first param is the name of the verifier smart contract
    'Multipler3groth16Verifier',
    // The second param is the circuit input
    { a: '5', b: '2', c: '3' },
    // The third param is the wasm file path
    'contracts/circuits/Multipler3groth16/Multiplier3_js/Multiplier3.wasm',
    // The fourth param is the zkey file path
    'contracts/circuits/Multipler3groth16/circuit_final.zkey',
    // The last param is the log that should appear to check if output is the expected
    '5x2x3'
))

describe('Multiplier3 with PLONK', function () {
    let verifier, contract

    beforeEach(async () => {
        contract = await ethers.getContractFactory('PlonkVerifier')
        verifier = await contract.deploy()
        await verifier.deployed()
    })

    it('Should return true for correct proof', async () => {
        const { proof, publicSignals } = await plonk.fullProve(
            { a: '5', b: '2', c: '3' },
            'contracts/circuits/Multipler3_plonk/Multiplier3_js/Multiplier3.wasm',
            'contracts/circuits/Multipler3_plonk/circuit_final.zkey',
        )

        console.log(`5X2x3 =`, publicSignals[0])

        const editedPublicSignals = unstringifyBigInts(publicSignals)

        const editedProof = unstringifyBigInts(proof)
        t
        const calldata = await plonk.exportSolidityCallData(
            editedProof,
            editedPublicSignals,
        )

        const argv = calldata
            .split(',')

        expect(await verifier.verifyProof(argv[0], JSON.parse(argv[1]))).to.be.true
    })

    it('Should return false for invalid proof', async () => {
        let a = [0], b = [0]
        expect(await verifier.verifyProof(a, b)).to.be.false
    })
})
