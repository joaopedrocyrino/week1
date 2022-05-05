const fs = require('fs')
const solidityRegex = /pragma solidity \^\d+\.\d+\.\d+/

const verifierRegex = /contract Verifier/

const contracts = ['HelloWorldVerifier', 'Multipler3groth16Verifier']

contracts.forEach((e) => {
  const content = fs.readFileSync(`./contracts/${e}.sol`, { encoding: 'utf-8' })
  let bumped = content.replace(solidityRegex, 'pragma solidity ^0.8.0')
  bumped = bumped.replace(verifierRegex, `contract ${e}`)

  fs.writeFileSync(`./contracts/${e}.sol`, bumped)
})


