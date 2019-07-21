// get the node modules.
var express = Npm.require('express'),
    bodyParser = Npm.require('body-parser'),
    OAuth2Server = Npm.require('oauth2-server');

const Request = Npm.require('oauth2-server').Request;
const Response = Npm.require('oauth2-server').Response;

// configure the server-side collections. The rest of the collections
// exist in common.js and are for both client and server.
var accessTokenCollection = new Meteor.Collection('OAuth2AccessTokens');

var debug = !!process.env.DEBUG_APP;

// setup the node oauth2 model.
var meteorModel = new MeteorModel(
    accessTokenCollection,
    refreshTokensCollection,
    clientsCollection,
    authCodesCollection,
    debug
);

const oauthserverOptions = {
    model: meteorModel,
    grants: ['authorization_code'],
    accessTokenLifetime: 60 * 60 * 24, // 24 hours, or 1 day
    allowEmptyState: true,
    allowExtendedTokenAttributes: false
}

// setup the exported object.
oauth.oauthserver = new OAuth2Server(oauthserverOptions);

oauth.collections.accessToken = accessTokenCollection;
oauth.collections.client = clientsCollection;

// configure a url handler for the /oauth/token path.
var app = express();

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: false
}));
/*
app.use(oauth.oauthserver.authorize({
    authenticateHandler: {
        handle: req => {
            console.log('Authenticate Handler Called')
            console.group()
            console.log('some_other_user_info_stuff:', req.body.some_other_user_info_stuff)
            console.groupEnd()
            return {
                userId: 1
            }
        }
    }
}));
*/

/*
// create check callback that returns the user.
var checkAUTHCallback = function (req, result) {
    console.log("checkAUTHCallback>>>>>", req, result)
    return result
};

app.use(
    function (req, res, next) {
        let nreq = new Request(req);
        let nres = new Response(res);
        oauth.oauthserver.authorize(nreq, nres, {
            authenticateHandler: {
                handle: req => {
                    return {
                        userId: userId
                    }
                }
            }
        }, checkAUTHCallback)
    }
);
*/

const transformRequestsNotUsingFormUrlencodedType = (req, res, next) => {
    if (req.headers['content-type'] !== 'application/x-www-form-urlencoded' && req.method === 'POST') {
        req.headers['content-type'] = 'application/x-www-form-urlencoded';
        req.body = Object.assign({}, req.body, req.query)
    }

    next()
};
/*
app.all('/oauth/token',
    transformRequestsNotUsingFormUrlencodedType,
    oauth.oauthserver.token()
);
*/
// create check callback that returns the user.
var checkTokenCallback = function (req, result) {
    console.log("checkcallback>>>>>", req, result)
    return result
};

app.all('/oauth/token',
    function (req, res, next) {
        let nreq = new Request(req);
        let nres = new Response(res);
        oauth.oauthserver.token(nreq, nres, {
            authenticateHandler: {
                handle: req => {
                    return {
                        userId: userId
                    }
                }
            }
        }, checkTokenCallback)
    }
);

WebApp.rawConnectHandlers.use(app);

/////////////////////
// Configure really basic identity service
////////////////////

/*
JsonRoutes.Middleware.use(
    '/oauth/getIdentity',
    oauth.oauthserver.authenticate()
);

JsonRoutes.add('get', '/oauth/getIdentity', function (req, res, next) {

    if (debug) {
        console.log('GET /oauth/getIdentity');
    }

    var accessTokenStr = (req.params && req.params.access_token) || (req.query && req.query.access_token);
    var accessToken = oauth.collections.accessToken.findOne({
        accessToken: accessTokenStr
    });
    var user = Meteor.users.findOne(accessToken.userId);

    JsonRoutes.sendResult(
        res, {
            data: {
                id: user._id,
                username: user.username
            }
        }
    );
});
*/

////////////////////
// Meteor publish.
///////////////////
Meteor.publish(oauth.pubSubNames.authCodes, function () {
    if (!this.userId) {
        return this.ready();
    }

    return oauth.collections.authCode.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    });
});

Meteor.publish(oauth.pubSubNames.refreshTokens, function () {
    if (!this.userId) {
        return this.ready();
    }

    return oauth.collections.refreshToken.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    });
});

Meteor.publish(oauth.pubSubNames.client, function () {
    //console.log('this', this, this.userId);
    if (!this.userId) {
        return this.ready();
    }

    return oauth.collections.client.find({
        'owner.uid': this.userId
    });
});

////////////
// configure the meteor methods.
//////////////
var methods = {};
methods[oauth.methodNames.authorize] = function (client_id, redirect_uri, response_type, scope, state) {

    console.log("authorizemethid")
    // validate parameters.
    check(client_id, String);
    check(redirect_uri, String);
    check(response_type, String);
    check(scope, Match.Optional(Match.OneOf(null, [String])));
    check(state, Match.Optional(Match.OneOf(null, String)));

    if (!scope) {
        scope = [];
    }

    // validate the user is authenticated.
    var userId = this.userId;
    if (!userId) {
        return {
            success: false,
            error: 'User not authenticated.'
        };
    }

    // The oauth2-server project relies heavily on express to validate and
    // manipulate the oauth2 grant. A forthcoming version will abstract this
    // behaviour into promises.
    // That being the case, we need to get run an authorization grant as if
    // it were a promise. Warning, the following code is difficult to follow.
    // What we are doing is mocking and express app but never attaching it to
    // Meteor. This allows oauth2-server to behave as it would as if it was
    // natively attached to the webapp. The following code mocks express,
    // request, response, check and next in order to retrive the data we need.
    // Further, we are also running this in a synchronous manner. Enjoy! :)

    // retrieve the grant function from oauth2-server. This method setups up the
    // this context and such. The returned method is what express would normally
    // expect when handling a URL. eg. function(req, res, next)
    //var authorizeFn = oauth.oauthserver.authorize(checkCallback);

    // run the auth code grant function in a synchronous manner.

    let req = new Request({
        method: 'GET',
        body: {
            client_id: client_id,
            response_type: response_type,
            redirect_uri: redirect_uri,
            scope: scope,
            state: state
        },
        query: {},
        headers: {
            //Authorization: 'Bearer foobar'
        }
    });

    let res = new Response({
        headers: {},
        body: {
            success: false,
            error: null,
            authorizationCode: null,
            redirectToUri: redirect_uri
        }
    });

    // create check callback that returns the user.
    var checkCallback = function (req, result) {
        console.log("checkcallback>>>>>", req, result)
        return result
    };

    var resultFn = oauth.oauthserver.authorize(req, res, {
            authenticateHandler: {
                handle: req => {
                    return {
                        userId: userId
                    }
                }
            }
        }, checkCallback)
        .then(function (code) {
            console.log("CODE>>>", code, "RES>>>", res)
            if (code.authorizationCode) {
                res.body.success = true
                delete res.body.error
            }

            return res
        })
        .catch(function (err) {
            // handle error condition
            console.log("ERRORPROMISE", err)
        });

    return resultFn

};

Meteor.methods(methods);