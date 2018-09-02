/**
 * Load dependencies
 */
const OAuth2Server = Npm.require('oauth2-server')
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

/**
 * Configure server-side collections
 */
const accessTokenCollection = new Meteor.Collection('OAuth2AccessTokens');
const clientsCollection = new Meteor.Collection('OAuth2Clients');

oAuth2Server.collections.accessToken = accessTokenCollection;
oAuth2Server.collections.client = clientsCollection;

/**
 * Set up handler and model
 */

oAuth2Server.oauthserver = new OAuth2Server({
    model: MeteorModel
});


/**
 * Handle routes
 */

// This code tests use of WebApp for middleware will be removed and shouldn't be a template for futher development
WebApp.connectHandlers.use('/oauth/token', (req, res, next) => {
    res.writeHead(200);
    let request = new Request(req);
    let response = new Response(res);
    return oAuth2Server.oauthserver.token(request, response)
        .then(function (token) {
            next();
        }).catch(function (err) {
            res.end(`You should really authenticate your requests.`)
        });
});

/**
 * Publish data
 */

Meteor.publish(oAuth2Server.pubSubNames.authCodes, function () {
    if (!this.userId) {
        return this.ready();
    }

    return oAuth2Server.collections.authCode.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    });
});

Meteor.publish(oAuth2Server.pubSubNames.refreshTokens, function () {
    if (!this.userId) {
        return this.ready();
    }

    return oAuth2Server.collections.refreshToken.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    });
});

/**
 * Meteor methods
 */
