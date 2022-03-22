const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 3000;

// const buyProof = require('../zokrates-proof/buy-proof/proof.json')
// const sellProof = require('../zokrates-proof/sell-proof/proof.json')

const fs = require('fs');

let jsonData = require('../../performance.json');

var memory = {
    table: []
 };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/proof', (req, res) => {
    // console.log('Running the script to generate a buy condition proof');
    // console.log(req.body.post[0]);
    //var proof = {a: '', b: '', c: '', inputs: ''};
    exec(__dirname + '/createProof.sh ' + req.body.post[0] + ' ' + req.body.post[1] + ' ' + req.body.post[2] + ' ' + req.body.post[3] + ' ' + req.body.post[4], (error, stdout, stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            return;
        }
    
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
    
        console.log(`createProof stdout:\n${stdout}`);
        
        const rawProofdata = fs.readFileSync('../zokrates-proof/decision-proof/proof.json')
        const proof = JSON.parse(rawProofdata)

        console.log(proof)
        res.send({proof: proof})
    });
})

app.post('/api/performance', (req, res) => {
    // console.log('Taking the performance values')
    console.log('performance api req', req.body.post)
    jsonData.table.push({deltaGetIndicators: req.body.post[0], deltaMakeTradeDecision: req.body.post[1], deltaProofGenTime: req.body.post[2], deltaProofVerifTime: req.body.post[3], deltaTradingTime: req.body.post[4], deltaTotalTime: req.body.post[5], gasUsedOnBot: req.body.post[6], gasUsedOnVerification: req.body.post[7], gasUsed: req.body.post[8]})
    //console.log(jsonData)
    var json = JSON.stringify(jsonData);
    fs.writeFile('../performance.json', json, 'utf8', function(err) {
        if (err) throw err;
        console.log('complete');
        return;
        }); 
    res.send()
})

app.post('/api/end-performance', (res, req) => {
    // console.log('Ending performance evaluations')
})

app.listen(port, () => console.log(`Listening on port ${port}`));