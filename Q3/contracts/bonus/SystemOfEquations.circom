pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib-matrix/circuits/matMul.circom";
include "../../node_modules/circomlib-matrix/circuits/matElemSum.circom";

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution

    component matmul = matMul(n, n, 1);
    component equalElmSum = matElemSum(n, 1);
    component equal[n + 1];

    equal[n] = IsEqual();
    equal[n].in[0] <== n;

    for (var i=0; i < n; i++) {
        matmul.b[i][0] <== x[i];
    
        for (var j = 0; j < n; j++) {
            matmul.a[i][j] <== A[i][j];
        }
    }

    for (var k = 0; k < n; k++) {
        equal[k] = IsEqual();
        equal[k].in[0] <== matmul.out[k][0];
        equal[k].in[1] <== b[k];

        equalElmSum.a[k][0] <== equal[k].out;
    }

    equal[n].in[1] <== equalElmSum.out;

    out <== equal[n].out;
}

component main {public [A, b]} = SystemOfEquations(3);