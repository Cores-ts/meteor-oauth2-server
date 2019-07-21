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
        this.accessTokenCollection = accessTokenCollection;
        this.refreshTokenCollection = refreshTokenCollection;
        this.clientCollection = clientCollection;
        this.authCodeCollection = authCodeCollection;
        this.debug = true;

        ///////////////////
        // Defining the methods.
        ///////////////////

        this.getAccessToken = Meteor.bindEnvironment(
            function (bearerToken, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getAccessToken (bearerToken:', bearerToken, ')');
                }

                try {
                    var token = this.accessTokenCollection.findOne({
                        accessToken: bearerToken
                    });
                    return token
                    //callback(null, token);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.getClient = Meteor.bindEnvironment(
            function (clientId, clientSecret, done) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getClient (clientId:', clientId, ', clientSecret:', clientSecret, ')');
                }

                try {
                    var client;
                    if (clientSecret == null) {
                        client = this.clientCollection.findOne({
                            active: true,
                            clientId: clientId
                        });
                    } else {
                        client = this.clientCollection.findOne({
                            active: true,
                            clientId: clientId,
                            clientSecret: clientSecret
                        });
                    }

                    //done(null, client);

                    client.id = client.clientId
                    client.redirectUris = [client.redirectUri]
                    client.grants = ["authorization_code"]
                    client.accessTokenLifetime = 10000
                    client.refreshTokenLifetime = 100000000

                    //console.log(client)

                    return client
                    //done(null, client);

                    /*return new Promise(resolve => {
                        resolve(client)
                    })*/

                } catch (e) {
                    callback(e);
                    //return e
                }
            },
            null, // exception handler
            this // this context.
        );

        this.saveToken = Meteor.bindEnvironment(
            function (token, clientId, user, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in saveToken (token:', token, ', clientId:', clientId, ', user:', user, ', expires:', expires, ')');
                }

                try {
                    this.accessTokenCollection.remove({
                        clientId: clientId,
                        userId: user.id
                    })

                    var tokenId = this.accessTokenCollection.insert({
                        accessToken: token,
                        clientId: clientId,
                        userId: user.id,
                        expires: expires
                    })
                    return tokenId
                    //callback(null, tokenId);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.getAuthorizationCode = Meteor.bindEnvironment(
            function (authCode, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getAuthorizationCode (authCode: ' + authCode + ')');
                }

                try {
                    var code = this.authCodeCollection.findOne({
                        authCode: authCode
                    });

                    return code
                    //callback(null, code);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.saveAuthorizationCode = Meteor.bindEnvironment(
            async function (authorizationCode, client, user, callback) {
                    //console.log('[OAuth2Server]', 'in saveAuthCode (code:', authorizationCode, ', client:', client, 'user:', user, ')');

                    this.authCodeCollection.remove({
                        authCode: authorizationCode.authorizationCode
                    });

                    this.authCodeCollection.remove({
                        clientId: client.clientId,
                        userId: user.userId
                    })

                    //

                    //return data

                    var data = {
                        authorizationCode: authorizationCode.authorizationCode,
                        clientId: client.clientId,
                        userId: user.userId,
                        expires: authorizationCode.expiresAt,
                        scope: authorizationCode.scope,
                        accessToken: authorizationCode.authorizationCode,
                        accessTokenExpiresAt: authorizationCode.expiresAt,
                        client: client.clientId,
                        user: user.userId
                    }
                    var self = this
                    return new Promise(function (resolve, reject) {
                        try {
                            var codeId = self.authCodeCollection.insert(data);
                            resolve(data)
                        } catch (e) {
                            reject(e)
                        }
                    }).then(function (saveResult) {
                        console.log("SAVERESULT", saveResult)
                        return saveResult;
                    });

                    //callback(null, codeId);

                },
                null, // exception handler
                this // this context.
        );

        this.saveRefreshToken = Meteor.bindEnvironment(
            function (token, clientId, user, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in saveRefreshToken (token:', token, ', clientId:', clientId, ', user:', user, ', expires:', expires, ')');
                }

                try {
                    this.refreshTokenCollection.remove({
                        refreshToken: token
                    });
                    var tokenId = this.refreshTokenCollection.insert({
                        refreshToken: token,
                        clientId: clientId,
                        userId: user.id,
                        expires: expires
                    });
                    return tokenId
                    //callback(null, tokenId);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.getRefreshToken = Meteor.bindEnvironment(
            function (refreshToken, callback) {
                if (this.debug === true) {
                    console.log('[OAuth2Server]', 'in getRefreshToken (refreshToken: ' + refreshToken + ')');
                }

                try {
                    var token = this.refreshTokenCollection.findOne({
                        refreshToken: refreshToken
                    });

                    return token
                    //callback(null, token);

                } catch (e) {
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.validateScope = Meteor.bindEnvironment(
            function (user, client, scope, callback) {

                console.log('[OAuth2Server]', 'in validateScope (user: ' + user + ',client: ' + client + ',scope: ' + scope + ')');

                const VALID_SCOPES = ['r_email', 'r_basicprofile', 'r_fullprofile'];

                try {
                    if (!scope.split(' ').every(s => VALID_SCOPES.indexOf(s) >= 0)) {
                        return false;
                    }
                    return scope
                    //callback(null, scope);

                } catch (e) {
                    console.log("ERRORVALIDATESCOPE", e)
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

        this.verifyScope = Meteor.bindEnvironment(
            function (accessToken, scope, callback) {

                console.log('[OAuth2Server]', 'in verifyScope (accessToken: ' + accessToken + ',scope: ' + scope + ')');

                if (!accessToken.scope) {
                    return false;
                }

                const VALID_SCOPES = ['r_email', 'r_basicprofile', 'r_fullprofile'];

                try {
                    let requestedScopes = scope.split(' ');
                    let authorizedScopes = token.scope.split(' ');
                    return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);

                } catch (e) {
                    console.log("ERRORVALIDATESCOPE", e)
                    callback(e);
                }
            },
            null, // exception handler
            this // this context.
        );

    };

    return MeteorModel;
})();