/**
 * Load dependencies
 */
const bodyParser = Npm.require('body-parser')
const OAuth2Server = Npm.require('oauth2-server')
const Request = OAuth2Server.Request;
const Response = OAuth2Server.Response;

/**
 * Configure server-side collections
 */
var accessTokenCollection = new Meteor.Collection('OAuth2AccessTokens');
clientsCollection = new Meteor.Collection('OAuth2Clients');

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
 * This code tests use of WebApp for middleware will be removed and shouldn't be a template for futher development
 */

/**
 * Reimplement authorize here instead of the method
 */

// WebApp.connectHandlers.use('/oauth/authorize', (req, res, next) => {
//     res.writeHead(200);
//     let request = new Request(req);
//     let response = new Response(res);
//     return oAuth2Server.oauthserver.authenticate(request, response)
//         .then(function (token) {
//             res.end(token)
//             next()
//         }).catch(function (err) {
//             console.error(err)
//             res.end()
//         });
// });


WebApp.connectHandlers
    .use(bodyParser.urlencoded({ extended: false }))
    .use('/oauth/token', (req, res, next) => {
        let request = new Request(req);
        let response = new Response(res);
        console.log(request)
        oAuth2Server.oauthserver.token(request, response, {
            requireClientAuthentication: { password: false }
        })
        next()
    })
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