const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 5000;

//const buyProof = require('../zokrates-proof/buy-proof/proof.json')
const sellProof = require('../zokrates-proof/sell-proof/proof.json')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/world', (req, res) => {
  console.log(req.body.post[0]);
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`,
  );
//   res.send({ express: 'Creating proof for the buy condition' });
//     exec(__dirname + '/createProof.sh', (error, stdout, stderr) => {
//     if (error) {
//         console.error(`error: ${error.message}`);
//         return;
//     }

//     if (stderr) {
//         console.error(`stderr: ${stderr}`);
//         return;
//     }

//     console.log(`stdout:\n${stdout}`);
// });
});

app.post('/api/proof', (req, res) => {
    console.log('Running the script to generate a buy condition proof');
    console.log(req.body.post[0]);
    var proofType = '';
    var proof = {a: '', b: '', c: '', inputs: ''};
    if(req.body.post[0] == 'buy-proof') {
        proofType = 'buy-proof';
        proof.a = buyProof.proof.a;
        proof.b = buyProof.proof.b;
        proof.c = buyProof.proof.c;
        proof.inputs = buyProof.inputs;
    } else if(req.body.post[0] == 'sell-proof') {
        proofType = 'sell-proof';
        proof.a = sellProof.proof.a;
        proof.b = sellProof.proof.b;
        proof.c = sellProof.proof.c;
        proof.inputs = sellProof.inputs;
    }
    exec(__dirname + '/createProof.sh ' + proofType + ' ' + req.body.post[1] + ' ' + req.body.post[2] + ' ' + req.body.post[3], (error, stdout, stderr) => {
    if (error) {
        console.error(`error: ${error.message}`);
        return;
    }

    if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
    }

    console.log(`stdout:\n${stdout}`);
    res.send(proof)
});
})

app.listen(port, () => console.log(`Listening on port ${port}`));