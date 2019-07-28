/**
 * A oauth2-server model for dealing with the meteor collections. Original code
 * from: https://github.com/RocketChat/rocketchat-oauth2-server/blob/master/model.coffee
 * Modifications and improvements have been made.
 * This class is used a callback model for oauth2-server. oauth2-server runs it's calls
 * in a different context and fiber. Doing so can get really messy when attempting to
 * run Meteor code, like Collection calls. We work-around this problem by creating
 * instance methods are runtime that are proxied through Meteor.bindEnvironment.
 * This strategy allows us to specify the this context.
 * Defining the class with prototype methods defined by Meteor.bindEnvironment
 * would ensure we lose our this context when the method executes.
 */
MeteorModel = (function () {
    function MeteorModel(accessTokenCollection,
        refreshTokenCollection,
        clientCollection,
        authCodeCollection,
        debug) {
        this.accessTokenCollection = accessTokenCollection
        this.refreshTokenCollection = refreshTokenCollection
        this.clientCollection = clientCollection
        this.authCodeCollection = authCodeCollection
        this.debug = true

        ///////////////////
        // Defining the methods.
        ///////////////////

        const getAccessTokenFn = Meteor.bindEnvironment(
            function (bearerToken, callback) {
                if (this.debug === true) {
                    console.log("[OAuth2Server]", "in getAccessToken (bearerToken:", bearerToken, ")")
                }

                try {
                    var token = this.accessTokenCollection.findOne({
                        accessToken: bearerToken
                    })

                    if (!token) callback("unsupported_response_type")

                    var data = {
                        accessToken: token.accessToken,
                        accessTokenExpiresAt: token.expiresAt,
                        scope: token.scope,
                        client: {
                            id: token.clientId
                        },
                        user: {
                            id: token.userId
                        }
                    }

                    callback(null, data)

                } catch (e) {
                    callback(e)
                }
            },
            null, // exception handler
            this // this context.
        )

        this.getAccessToken =
            function (bearerToken, callback) {
                getAccessTokenFn(bearerToken, callback)
            }

        const getClientFn = Meteor.bindEnvironment(
            function (clientId, clientSecret, callback) {

                console.log("[OAuth2Server]", "in getClient (clientId:", clientId, ", clientSecret:", clientSecret, ")")

                try {
                    var client
                    if (clientSecret == null) {
                        client = this.clientCollection.findOne({
                            active: true,
                            clientId: clientId
                        })
                    } else {
                        client = this.clientCollection.findOne({
                            active: true,
                            clientId: clientId,
                            clientSecret: clientSecret
                        })
                    }

                    if (!client) callback("invalid_client")

                    client.id = client.clientId
                    //client.redirectUris = [client.redirectUri]
                    if (!client.grants) client.grants = ["authorization_code", "refresh_token", "client_credentials"]
                    client.accessTokenLifetime = 60 * 60 * 24 * 30
                    client.refreshTokenLifetime = 60 * 60 * 24 * 365

                    callback(null, client)

                } catch (e) {
                    callback(e)
                    //return e
                }
            },
            null, // exception handler
            this // this context.
        )

        this.getClient =
            function (clientId, clientSecret, callback) {
                getClientFn(clientId, clientSecret, callback)
            }

        const getUserFromClientFn = Meteor.bindEnvironment(
            function (client, callback) {

                console.log("[OAuth2Server]", "in getUserFromClient (clientId:", client, ")")

                try {

                    if (!client.owner) callback("invalid_client")

                    callback(null, {

                        id: client.owner.uid,
                        username: client.owner.uname

                    })

                } catch (e) {
                    callback(e)
                    //return e
                }
            },
            null, // exception handler
            this // this context.
        )

        this.getUserFromClient =
            function (client, callback) {
                getUserFromClientFn(client, callback)
            }

        const saveTokenFn = Meteor.bindEnvironment(
            function (token, client, user, callback) {
                console.log("[OAuth2Server]", "in saveToken (token:", token, ", client:", client, ", user:", user, ")")

                try {

                    if (token.refreshToken) this.refreshTokenCollection.remove({
                        clientId: client.clientId,
                        userId: user.id,
                        refreshToken: {
                            $ne: token.refreshToken
                        }
                    })

                    this.accessTokenCollection.remove({
                        clientId: client.clientId,
                        userId: user.id,
                        accessToken: {
                            $ne: token.accessToken
                        }
                    })

                    this.accessTokenCollection.insert({
                        accessToken: token.accessToken,
                        clientId: client.clientId,
                        userId: user.id,
                        expiresAt: token.accessTokenExpiresAt,
                        scope: token.scope.split(/[\s,]+/)
                    })

                    if (token.refreshToken) this.refreshTokenCollection.insert({
                        refreshToken: token.refreshToken,
                        clientId: client.clientId,
                        userId: user.id,
                        expiresAt: token.refreshTokenExpiresAt,
                        scope: token.scope.split(/[\s,]+/)
                    })

                    var data = {
                        accessToken: token.accessToken,
                        accessTokenExpiresAt: token.accessTokenExpiresAt,
                        refreshToken: token.refreshToken,
                        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
                        scope: token.scope,
                        client: {
                            id: client.clientId
                        },
                        user: {
                            id: user.id
                        }
                    }

                    callback(null, data)

                } catch (e) {
                    callback(e)
                }
            },
            null, // exception handler
            this // this context.
        )

        this.saveToken =
            function (token, client, user, callback) {
                saveTokenFn(token, client, user, callback)
            }

        const revokeTokenFn = Meteor.bindEnvironment(
            function (token, callback) {

                try {

                    this.refreshTokenCollection.remove({
                        refreshToken: token.refreshToken
                    })

                    callback(null, true)

                } catch (e) {
                    callback(e)
                }

            },
            null, // exception handler
            this // this context.
        )

        this.revokeToken =
            function (token, callback) {
                revokeTokenFn(token, callback)
            }

        const getAuthorizationCodeFn = Meteor.bindEnvironment(
            function (authorizationCode, callback) {

                console.log("[OAuth2Server]", "in getAuthorizationCode (authCode: " + authorizationCode + ")")

                try {
                    var code = this.authCodeCollection.findOne({
                        authorizationCode: authorizationCode
                    })

                    if (!code) callback("invalid_grant")

                    code.client = {
                        id: code.clientId
                    }

                    code.user = {
                        id: code.userId
                    }

                    code.scope = code.scope.join(",")

                    code.code = code.authorizationCode

                    callback(null, code)

                } catch (e) {
                    callback(e)
                }
            },
            null, // exception handler
            this // this context.
        )

        this.getAuthorizationCode =
            function (authorizationCode, callback) {
                getAuthorizationCodeFn(authorizationCode, callback)
            }

        const saveAuthorizationCodeFn = Meteor.bindEnvironment(
            function (authorizationCode, client, user, callback) {

                try {

                    /*
                    this.authCodeCollection.remove({
                        authorizationCode: authorizationCode.authorizationCode
                    })
                    */

                    this.authCodeCollection.remove({
                        clientId: client.clientId,
                        userId: user.userId,
                        expiresAt: {
                            $gt: new Date()
                        }
                    })

                    var codeId = this.authCodeCollection.insert({
                        authorizationCode: authorizationCode.authorizationCode,
                        clientId: client.clientId,
                        userId: user.userId,
                        redirectUri: authorizationCode.redirectUri,
                        expiresAt: authorizationCode.expiresAt,
                        scope: authorizationCode.scope.split(/[\s,]+/)
                    })

                    if (!codeId) callback("temporarily_unavailable")

                    callback(null, {
                        authorizationCode: authorizationCode.authorizationCode,
                        expiresAt: authorizationCode.expiresAt,
                        scope: authorizationCode.scope,
                        client: {
                            id: client.clientId
                        },
                        redirectUri: authorizationCode.redirectUri,
                        user: {
                            id: user.userId
                        }
                    })

                } catch (e) {
                    callback(e)
                }

            },
            null, // exception handler
            this // this context.
        )

        this.saveAuthorizationCode =
            function (authorizationCode, client, user, callback) {
                saveAuthorizationCodeFn(authorizationCode, client, user, callback)
            }

        const revokeAuthorizationCodeFn = Meteor.bindEnvironment(
            function (authorizationCode, callback) {

                try {

                    this.authCodeCollection.remove({
                        authorizationCode: authorizationCode.authorizationCode
                    })

                    callback(null, true)

                } catch (e) {
                    callback(e)
                }

            },
            null, // exception handler
            this // this context.
        )

        this.revokeAuthorizationCode =
            function (authorizationCode, callback) {
                revokeAuthorizationCodeFn(authorizationCode, callback)
            }

        const getRefreshTokenFn = Meteor.bindEnvironment(
            function (refreshToken, callback) {
                console.log("[OAuth2Server]", "in getRefreshToken (refreshToken: " + refreshToken + ")")

                try {
                    var token = this.refreshTokenCollection.findOne({
                        refreshToken: refreshToken
                    })

                    if (!token) callback("invalid_grant")

                    var data = {
                        refreshToken: token.refreshToken,
                        refreshTokenExpiresAt: token.expiresAt,
                        scope: token.scope.join(","),
                        client: {
                            id: token.clientId
                        },
                        user: {
                            id: token.userId
                        }
                    }

                    callback(null, data)

                } catch (e) {
                    callback(e)
                }
            },
            null, // exception handler
            this // this context.
        )

        this.getRefreshToken =
            function (refreshToken, callback) {
                getRefreshTokenFn(refreshToken, callback)
            }

        const validateScopeFn = Meteor.bindEnvironment(
            function (user, client, scope, callback) {

                //Invoked to check if the requested scope is valid for a particular client/user combination.

                console.log("[OAuth2Server]", "in validateScope (user: " + user + ",client: " + client + ",scope: " + scope + ")")

                //TODO: engadir scopes desde a base de datos
                //const VALID_SCOPES = ["identity.basic", "identity.email", "identity.profile", "r_basicprofile", "r_fullprofile", "r_contactinfo"]

                try {
                    //TODO: configurar esto en la inicialización del módulo
                    const VALID_SCOPES = OAuth2Scopes.find().fetch().map(function (obj) {
                        return obj.slug
                    })

                    //TODO: comprobar client scopes

                    const DEFAULT_SCOPES = OAuth2Scopes.find({
                        required: true
                    }).fetch().map(function (obj) {
                        return obj.slug
                    })

                    console.log(VALID_SCOPES, DEFAULT_SCOPES)

                    //Cómo aceptamos scope como parámetro opcional en client_credentials si hay que validarlo???
                    //If no scope is defined we'll add the default scopes
                    if (!scope) callback(null, DEFAULT_SCOPES)

                    //Allows partially valid scopes. ie "valid valid2 notvalid" returns "valid valid2"
                    //Adding _.uniq to remove potential duplicates
                    if (scope && scope.isArray) {
                        if (!_.uniq(scope.filter(s => VALID_SCOPES.indexOf(s.split("@")[0]) >= 0))) {
                            //return false;
                            callback(null, false)
                        }
                        callback(null, scope.join(" "))
                    } else if (scope) {
                        if (!_.uniq(scope.split(/[\s,]+/).filter(s => VALID_SCOPES.indexOf(s.split("@")[0]) >= 0))) {
                            //return false;
                            callback(null, false)
                        }
                        callback(null, scope)
                    }

                    //return scope

                } catch (e) {
                    callback(e)
                }
            },
            null, // exception handler
            this // this context.
        )

        this.validateScope =
            function (user, client, scope, callback) {
                validateScopeFn(user, client, scope, callback)
            }

        const verifyScopeFn = Meteor.bindEnvironment(
            function (accessToken, scope, callback) {
                //Invoked during request authentication to check if the provided access token was authorized the requested scopes.
                console.log("[OAuth2Server]", "in verifyScope (accessToken: " + accessToken + ",scope: " + scope + ")")

                if (!accessToken.scope) {
                    return false
                }

                try {
                    let requestedScopes = scope.split(/[\s,]+/)
                    let authorizedScopes = accessToken.scope
                    let verified = _.uniq(requestedScopes.filter(s => authorizedScopes.indexOf(s.split("@")[0]) >= 0))
                    callback(null, verified.join(" "))
                } catch (e) {
                    callback(e)
                }
            },
            null, // exception handler
            this // this context.
        )

        this.verifyScope =
            function (accessToken, scope, callback) {
                verifyScopeFn(accessToken, scope, callback)
            }

    }

    return MeteorModel
})()