var http = require('http'),
    port = process.env.PORT || 4000,
    express = require('express'),
    app = express(),
    Sage = require('sageone-wrapper');


var config = {
  "sageClientId": "***yourClientId***",
  "sageClientSecret": "***yourClientSecret",
  "sageSigningSecret": "***yourSigningSecret***",
  "sageRedirectUri": "http://localhost:"+port+"/callback/" //Add a Redirect Uri in your SageOne app
}

var sageRef = new Sage(config.sageClientId, config.sageClientSecret, config.sageSigningSecret, config.sageRedirectUri);

// GET: /
app.get("/", function (req, res) {
    res.redirect(sageRef.getAuthUrl());
});

// GET: callback/
app.get("/callback", function (req, res) {
    sageRef.authorize(req.query.code, function (err, data) {
        if (err) {
            console.log('Error:', err);
        } else {
            res.redirect('../ledgerAccounts');
        }
    });
});

// GET: ledgerAccounts/
app.get("/ledgerAccounts", function (req, res) {
    sageRef.query('GET', 'ledger_accounts', {}, function (err, data) {
        console.log(err)
        if (err) {
            console.log(err);
            return res.json(400, err);
        } else {
            console.log("Success");
            data = JSON.parse(data);
            console.log("Data:", data);
            return res.send(data["$resources"]);
        }
    });
});

app.listen(port, function () {
    console.log('Express server listening on port ' + port);
})
