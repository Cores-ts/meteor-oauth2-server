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
accessTokenCollection = new Meteor.Collection('OAuth2AccessTokens');
clientsCollection = new Meteor.Collection('OAuth2Clients');

oAuth2Server.collections.accessToken = accessTokenCollection;
oAuth2Server.collections.client = clientsCollection;

/**
 * Set up handler and model
 */

const oauth = new OAuth2Server({
    model: MeteorModel
});

/**
 * Handle routes
 * This code tests use of WebApp for middleware will be removed and shouldn't be a template for futher development
 */

/**
 * Reimplement authorize here instead of the method
 */

WebApp.connectHandlers
    .use(bodyParser.urlencoded({ extended: true }))
    .use(bodyParser.json())
    .use((req, res, next) => {
        if (req.headers['content-type'] !== 'application/x-www-form-urlencoded' && req.method === 'POST') {
            req.headers['content-type'] = 'application/x-www-form-urlencoded';
            req.body = Object.assign({}, req.body, req.query);
        }
        next()
    })
    .use('/oauth/token', (req, res, next) => {
        let request = new Request(req);
        let response = new Response(res);
        oauth.token(request, response, {
            requireClientAuthentication: { password: false }
        }).then(function (token) {
            res.locals.oauth = { token: token };
        }).catch(function (error) {
            throw new Meteor.Error(error)
        })
        next()
    })
    .use('/oauth/authorize', (req, res, next) => {
        var request = new Request(req);
        var response = new Response(res);
        var options = {};
        // options.allowEmptyState = true;

        oauth.authenticate(request, response, options)
            .then(function (token) {
                res.locals.oauth = { token: token };
                // next();
            })
            .catch(function (error) {
                throw new Meteor.Error(error)
            });
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

/**
 * Meteor methods
 */

Meteor.methods({
    'oauth2/authorize': (client_id, redirect_uri, response_type, scope, state) => {
        // validate parameters.
        check(client_id, String);
        check(redirect_uri, String);
        check(response_type, String);
        check(scope, Match.Optional(Match.OneOf(null, [String])));
        check(state, Match.Optional(Match.OneOf(null, String)));

        // oauth.authorize(request, response, options)
        //     .then(function (code) {
        //         console.log('I neeed to KNOW!!')
        //         res.locals.oauth = { code: code };
        //         next();
        //     })
        //     .catch(function (error) {
        //         console.log('Error Authorize');
        //         throw new Meteor.Error(error)
        //     });

    },
});
