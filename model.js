MeteorModel = {
    getAccessToken: Meteor.bindEnvironment(
        async function (bearerToken) {
            try {
                let token = await oAuth2Server.collections.accessToken.findOne({
                    accessToken: bearerToken
                })
                return token
            } catch (error) {

            }
        }),
    getAuthorizationCode: Meteor.bindEnvironment(
        async function (code) {
            try {
                let authCode = oAuth2Server.collections.authCode.findOne({
                    authCode: code
                })
                return authCode
            } catch (error) {
                // STUB
            }
        }
    ),
    getRefreshToken: Meteor.bindEnvironment(
        async function (bearerToken) {
            try {
                let token = await oAuth2Server.collections.refreshToken.findOne({
                    refreshToken: bearerToken
                })
                return token
            } catch (error) {
                // STUB
            }
        }
    ),
    getClient: Meteor.bindEnvironment(
        async function (clientId, clientSecret) {
            try {
                let client;
                if (clientSecret == null) {
                    client = await oAuth2Server.collections.client.findOne({
                        active: true,
                        clientId: clientId
                    })
                } else {
                    client = await oAuth2Server.collections.client.findOne({
                        active: true,
                        clientId: clientId,
                        clientSecret: clientSecret
                    })
                }
                return client
            } catch (e) {}
        }),
    getUser: Meteor.bindEnvironment(
        async function (email, password) {
            try {
                let user = await Meteor.users.findOne({
                    'profile.email': email,
                    'services.password.bcrypt': Accounts.hashPassword(password)
                })
                return user
            } catch (error) {

            }
        }
    ),
    saveAuthorizationCode: Meteor.bindEnvironment(
        async function (code, clientId, expires, user) {
            try {
                oAuth2Server.collections.authCode.remove({
                    authCode: code
                });

                oAuth2Server.collections.authCode.remove({
                    clientId: clientId,
                    userId: user.id
                })

                let codeId = await oAuth2Server.collections.authCode.insert({
                    authCode: code,
                    clientId: clientId,
                    userId: user.id,
                    expires: expires
                });

                return codeId

            } catch (err) {
                throw new Error(err)
            }
        }),
    saveToken: function () {}
}


// getUserFromClient(client, [callback])
// saveToken(token, client, user, [callback])
// saveAuthorizationCode(code, client, user, [callback])
// revokeToken(token, [callback])
// revokeAuthorizationCode(code, [callback])
// validateScope(user, client, scope, [callback])
// verifyScope(accessToken, scope, [callback])

/**
 * OPTIONAL
 */

// generateAccessToken(client, user, scope, [callback])
// generateRefreshToken(client, user, scope, [callback])
// generateAuthorizationCode(client, user, scope, [callback])
