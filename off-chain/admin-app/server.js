const express = require('express');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 5000;

// const buyProof = require('../zokrates-proof/buy-proof/proof.json')
// const sellProof = require('../zokrates-proof/sell-proof/proof.json')

const fs = require('fs');

let jsonData = require('../performance.json');

var memory = {
    table: []
 };

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/proof', (req, res) => {
    // console.log('Running the script to generate a buy condition proof');
    // console.log(req.body.post[0]);
    //var proof = {a: '', b: '', c: '', inputs: ''};
    exec(__dirname + '/createProof.sh ' + req.body.post[0] + ' ' + req.body.post[1] + ' ' + req.body.post[2] + ' ' + req.body.post[3], (error, stdout, stderr) => {
        if (error) {
            console.error(`error: ${error.message}`);
            return;
        }
    
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
    
        console.log(`createProof stdout:\n${stdout}`);
        
        const rawdata = fs.readFileSync('../zokrates-proof/' + req.body.post[0] + '/proof.json')
        const proof = JSON.parse(rawdata)
        // proof.a = buyProof.proof.a;
        // proof.b = buyProof.proof.b;
        // proof.c = buyProof.proof.c;
        // proof.inputs = buyProof.inputs;
        console.log(proof);
        res.send(proof)
    });
})

app.post('/api/performance', (req, res) => {
    // console.log('Taking the performance values')
    
    jsonData.table.push({deltaBalance: req.body.post[0], deltaGetIndicators: req.body.post[1],  deltaProofGenTime: req.body.post[2], deltaProofVerifTime: req.body.post[3], deltaTradingTime: req.body.post[4], deltaTotalTime: req.body.post[5], gasUsed: req.body.post[6]})
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