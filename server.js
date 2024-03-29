// get the node modules.
var express = Npm.require("express"),
    bodyParser = Npm.require("body-parser"),
    OAuth2Server = Npm.require("oauth2-server")

const Request = Npm.require("oauth2-server").Request
const Response = Npm.require("oauth2-server").Response

// configure the server-side collections. The rest of the collections
// exist in common.js and are for both client and server.
var accessTokenCollection = new Meteor.Collection("OAuth2AccessTokens")

var debug = !!process.env.DEBUG_APP

// setup the node oauth2 model.
var meteorModel = new MeteorModel(
    accessTokenCollection,
    refreshTokensCollection,
    clientsCollection,
    authCodesCollection,
    debug
)

const oauthserverOptions = {
    model: meteorModel,
    grants: ["authorization_code", "refresh_token", "client_credentials"],
    accessTokenLifetime: 60 * 60 * 24 * 30, // 30 days
    refreshTokenLifetime: 60 * 60 * 24 * 365, // 365 days
    allowEmptyState: true,
    allowExtendedTokenAttributes: false,
    allowBearerTokensInQueryString: true,
}

// setup the exported object.
oauth.oauthserver = new OAuth2Server(oauthserverOptions)

oauth.collections.accessToken = accessTokenCollection
oauth.collections.client = clientsCollection

var app = express()

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({
    extended: false
}))

app.use((req, res, next) => {
    if (req.headers["content-type"] !== "application/x-www-form-urlencoded" && req.method === "POST") {
        req.headers["content-type"] = "application/x-www-form-urlencoded"
        req.body = Object.assign({}, req.body, req.query)
    }
    next()
})

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

// configure a url handler for the /oauth/token path.
app.all(["/token"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        oauth.oauthserver.token(nreq, nres, null)
            .then((token) => {
                console.log(token)

                console.log("ts", Date.parse(token.accessTokenExpiresAt), new Date(token.accessTokenExpiresAt).getTime())
                // The resource owner granted the access request.
                let final_token = {
                    token_type: "bearer",
                    access_token: token.accessToken,
                    expires_in: Math.ceil((Date.parse(token.accessTokenExpiresAt) - new Date().getTime()) / 1000)
                }

                if (token.refreshToken) {
                    final_token.refresh_token = token.refreshToken
                    final_token.refresh_token_expires_in = Math.ceil((Date.parse(token.refreshTokenExpiresAt) - new Date().getTime()) / 1000)
                }

                if (token.scope && token.scope.isArray) {
                    final_token.scope = token.scope.join(",")
                } else if (token.scope) {
                    final_token.scope = token.scope
                }

                //id_token: "JWT token"

                res.status(200).send(final_token)
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                console.log(err)
                res.status(err.statusCode || 503).send({
                    error: err.message
                })
            })

    }
)

app.get(["/token/permissions"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)

        oauth.oauthserver.authenticate(nreq, nres)
            .then((token) => {
                res.status(200).send({
                    scope: token.scope
                })
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })

    }
)

app.get(["/token/debug"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)

        oauth.oauthserver.authenticate(nreq, nres)
            .then((token) => {
                token.client_id = token.client.id
                token.user_id = token.user.id
                delete token.user
                delete token.client
                res.status(200).send(token)
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })

    }
)

/////////////////////
// Configure really basic identity service
////////////////////

app.get(["/whoami", "/me"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        let options = {
            scope: "identity.basic"
        }

        oauth.oauthserver.authenticate(nreq, nres, options)
            .then((token) => {
                return Meteor.users.rawCollection().findOne({
                    _id: token.user.id
                }, {
                    fields: {
                        "username": 1,
                        "profile.name": 1,
                        "profile.uavatar": 1
                    }
                })
            })
            .then((user) => {
                // The resource owner granted the access request.
                res.status(200).send(user)
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                console.log(err)
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })

    }
)

app.get(["/personal-data"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        let options = {
            scope: "identity.basic"
        }

        oauth.oauthserver.authenticate(nreq, nres, options)
            .then(async (token) => {
                let user = await Meteor.users.rawCollection().findOne({
                    _id: token.user.id
                }, {
                    fields: {
                        "username": 1,
                        "profile.name": 1,
                        "profile.uavatar": 1,
                        "emails": 1
                    }
                })

                return {
                    username: user.username,
                    name_first: user.profile?.name?.first,
                    name_last: user.profile?.name?.last,
                    avatar: user.profile?.uavatar,
                    email: user.emails[0]?.address
                }
            })
            .then((user) => {
                // The resource owner granted the access request.
                res.status(200).send(user)
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                console.log(err)
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })

    }
)

app.get(["/whoami/emails", "/me/emails"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        let options = {
            scope: "identity.email"
        }

        oauth.oauthserver.authenticate(nreq, nres, options)
            .then((token) => {
                return Meteor.users.rawCollection().findOne({
                    _id: token.user.id
                }, {
                    fields: {
                        "username": 1,
                        "profile.name": 1,
                        "emails.address": 1,
                    }
                })
            })
            .then((user) => {
                // The resource owner granted the access request.
                res.status(200).send(user)
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                console.log(err)
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })

    }
)

app.get(["/whoami/contact-info", "/me/contact-info"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        let options = {
            scope: "identity.contact_info"
        }

        oauth.oauthserver.authenticate(nreq, nres, options)
            .then((token) => {
                return Meteor.users.rawCollection().findOne({
                    _id: token.user.id
                }, {
                    fields: {
                        "username": 1,
                        "profile.name": 1,
                        "emails.address": 1,
                    }
                })
            })
            .then((user) => {
                // The resource owner granted the access request.
                res.status(200).send(user)
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                console.log(err)
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })

    }
)

app.get(["/whoami/profile", "/me/profile"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        let options = {
            scope: "identity.profile"
        }

        oauth.oauthserver.authenticate(nreq, nres, options)
            .then((token) => {
                return Meteor.users.rawCollection().findOne({
                    _id: token.user.id
                }, {
                    fields: {
                        "username": 1,
                        "profile.name": 1,
                        "profile.uavatar": 1,
                        "profile.time_zone": 1,
                        "profile.timezone": 1,
                        "profile.country": 1,
                        "profile.headline": 1,
                        "profile.bio": 1,
                        "profile.company_name": 1,
                        "profile.company_type": 1,
                        "profile.company_profile": 1,
                        "profile.company_role": 1,
                        "profile.company_location": 1
                    }
                })
            })
            .then((user) => {
                // The resource owner granted the access request.
                res.status(200).send(user)
            })
            .catch((err) => {
                // The request was invalid or not authorized.
                console.log(err)
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })

    }
)

app.get(["/api/memberships/:_community"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        console.log(req.params, "communities.membership_info@" + req.params._community)

        let options = {
            scope: "communities.membership_info@" + req.params._community
        }

        oauth.oauthserver.authenticate(nreq, nres, options)
            .then((token) => {
                return Applications.rawCollection().findOne({
                    "owner.uid": token.user.id,
                    "opencall.slug": req.params._community
                }, {
                    fields: {
                        "updatesHistory": 0,
                        "status": 0,
                        "_version": 0,
                        "modifierId": 0,
                        "opencall": 0
                    }
                })
            })
            .then((data) => {
                if (data) {
                    res.status(200).send({
                        "ok": true,
                        "data": data
                    })
                    return
                }

                res.status(404).send({
                    "ok": false,
                    "error": "No memberships found"
                })
            })
            .catch((err) => {
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })
    }
)

app.get(["/api/applications/:_opencall"],
    function (req, res) {
        let nreq = new Request(req)
        let nres = new Response(res)
        console.log(req.params, "opencalls.submitted_applications@" + req.params._opencall)
        let options = {
            scope: "opencalls.submitted_applications@" + req.params._opencall
        }

        oauth.oauthserver.authenticate(nreq, nres, options)
            .then((token) => {
                return Applications.rawCollection().find({
                    "owner.uid": token.user.id,
                    "opencall.slug": req.params._opencall,
                    "status": "Submitted"
                }, {
                    sort: {
                        "status": -1,
                        "updatedAt": -1
                    },
                    fields: {
                        "updatesHistory": 0,
                        "_version": 0,
                        "modifierId": 0,
                        "opencall": 0,
                        "tags": 0
                    }
                }).toArray()
            })
            .then((data) => {
                if (data) {
                    res.status(200).send({
                        "ok": true,
                        "data": data
                    })
                    return
                }

                res.status(404).send({
                    "ok": false,
                    "error": "No applications found"
                })
            })
            .catch((err) => {
                if (err.statusCode) {
                    res.status(err.statusCode).send({
                        error: err.message
                    })
                } else {
                    res.status(503).send({
                        error: "unexpected_error"
                    })
                }
            })
    }
)

WebApp.rawConnectHandlers.use(app)

////////////////////
// Meteor publish.
///////////////////
Meteor.publish(oauth.pubSubNames.authCodes, function () {
    if (!this.userId) {
        return this.ready()
    }

    return oauth.collections.authCode.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    })
})

Meteor.publish(oauth.pubSubNames.refreshTokens, function () {
    if (!this.userId) {
        return this.ready()
    }

    return oauth.collections.refreshToken.find({
        userId: this.userId,
        expires: {
            $gt: new Date()
        }
    })
})

Meteor.publish(oauth.pubSubNames.client, function () {
    if (!this.userId) {
        return this.ready()
    }

    return oauth.collections.client.find({
        "owner.uid": this.userId
    })
})

////////////
// configure the meteor methods.
//////////////
var methods = {}
methods[oauth.methodNames.authorize] = async function (client_id, redirect_uri, response_type, scope, state) {

    console.log("authorizemethod")
    // validate parameters.
    check(client_id, String)
    check(redirect_uri, String)
    check(response_type, String)
    check(scope, Match.Optional(Match.OneOf(null, String)))
    check(state, Match.Optional(Match.OneOf(null, String)))

    if (!scope) {
        scope = []
    }

    // validate the user is authenticated.
    var userId = this.userId
    if (!userId) {
        return {
            error: "User not authenticated"
        }
    }

    let req = new Request({
        method: "GET",
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
    })

    let res = new Response({
        headers: {},
        body: {
            success: false,
            error: null,
            state: state,
            authorizationCode: null,
            redirectToUri: redirect_uri
        }
    })

    var resultFn = oauth.oauthserver.authorize(req, res, {
            authenticateHandler: {
                handle: req => {
                    return {
                        userId: userId
                    }
                }
            }
        })
        .then(function (code) {
            if (code.authorizationCode) {
                res.body.authorizationCode = code.authorizationCode
                res.body.success = true
                delete res.body.error
            }
            return res
        })
        .catch(function (err) {
            // handle error condition
            throw new Meteor.Error(err.code, err.name, err.message)
        })

    return resultFn

}

Meteor.methods(methods)