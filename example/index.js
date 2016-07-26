var http = require('http'),
    port = process.env.PORT || 4000,
    express = require('express'),
    app = express(),
    session = require('express-session'),
    Sage = require('sageone-wrapper');


var config = {
    "sageClientId": "***yourClientId***",
    "sageClientSecret": "***yourClientSecret",
    "sageSigningSecret": "***yourSigningSecret***",
    "sageRedirectUri": "http://localhost:" + port + "/callback/" //Add a Redirect Uri in your SageOne app
}

var sageRef = new Sage(config.sageClientId, config.sageClientSecret, config.sageSigningSecret, config.sageRedirectUri);

app.use(session({ resave: false, saveUninitialized: false, secret: 'ammar' }));

// GET: /
app.get("/", function (req, res) {
    if (req.session.sageAuthCode)
        res.redirect('../ledgerAccounts')
    res.redirect(sageRef.getAuthUrl());
});

// GET: callback/
app.get("/callback", function (req, res) {
    sageRef.setAuthCode(req.query.code);
    req.session.sageAuthCode = req.query.code;
    res.redirect('../ledgerAccounts');
});

// GET: ledgerAccounts/
app.get("/ledgerAccounts", function (req, res) {
    if (!req.session.sageAuthCode)
        res.redirect('../');
    sageRef.query('GET', 'ledger_accounts', {}, function (err, data) {
        console.log(err)
        if (err) {
            console.log(err);
            return res.status(400).json(err);
        } else {
            console.log("Success");
            console.log("Data:", data);
            return res.send(data["$resources"]);
        }
    });
});

app.listen(port, function () {
    console.log('Express server listening on port ' + port);
})
