var oauthSignature = require('oauth-signature');
var crypto = require('crypto');
var request = require('request');

Sage.BASE_URL = "https://api.sageone.com/accounts/v1/";

/* Constructor */
function Sage(clientId, clientSecret, signingSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.signingSecret = signingSecret;
    this.redirectUri = redirectUri;
    this.oauth = null;
    this.authCode = null;
}

/* Helper Functions */
function getNonce(nonceLength) {
    return crypto.randomBytes(Math.ceil(nonceLength * 3 / 4)).toString('base64').slice(0, nonceLength).replace(/\+/g, '0').replace(/\//g, '0');
}

function SageOAuthSignature(httpMethod, url, parameters, nonce, signingSecret, accessToken, options) {
    var signatureBaseString = new oauthSignature.SignatureBaseString(httpMethod, url, parameters).generate() + '&' + nonce;
    var encodeSignature = true;
    if (options) encodeSignature = options.encodeSignature;

    return new oauthSignature.HmacSha1Signature(signatureBaseString, signingSecret, accessToken).generate(encodeSignature);
};

module.makeRequest = function (context, httpMethod, url, parameters, callback) {
    console.log('context:', context);
    var nonce = getNonce(32);
    var signingSecret = context.signingSecret;
    var accessToken = context.oauth.access_token;
    var OAuthSignature = SageOAuthSignature(httpMethod, url, parameters, nonce, signingSecret, accessToken, { encodeSignature: false });
    var options = {
        method: httpMethod,
        url: url,
        // qs: { config_setting: "foo" },
        headers: {
            'Authorization': 'Bearer ' + accessToken,
            'X-Signature': OAuthSignature,
            'X-Nonce': nonce,
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'freshbooks'
        },
        form: parameters
    };

    // Making HTTP Request
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200 || response.statusCode == 201) {
            console.log("**********SUCCESS*********");
            callback(null, body);
        } else {
            console.log("**********ERROR*********");
            console.log('response code:', response.statusCode);
            console.log(error);
            callback(error, response.body)
        }
        console.log(response.request.uri)
        console.log(response.request.headers);
        console.log(response.request.body);
    });
}

/* Public Functions */
Sage.prototype.query = function (httpMethod, url, parameters, callback) {
    url = Sage.BASE_URL + url
    module.makeRequest(this, httpMethod, url, parameters, callback)
};
Sage.prototype.setAuthCode = function (code) {
    this.authCode = code;
}
Sage.prototype.authorize = function (code, callback) {
    var self = this;
    var postData = {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: this.redirectUri
    }
    request.post({
        url: 'https://api.sageone.com/oauth2/token',
        formData: postData
    }, function (error, response, body) {
        if (error) {
            return console.error('upload failed:', error);
        }
        console.log('Authorization successful!: ', body);
        var oauth = JSON.parse(body);
        self.oauth = oauth;
        callback(error, oauth)
    });
};

Sage.prototype.getAuthUrl = function () {
    return "https://www.sageone.com/oauth2/auth?response_type=code&client_id=" + this.clientId
        + "&redirect_uri=" + this.redirectUri + "&scope=full_access"
};

module.exports = Sage;