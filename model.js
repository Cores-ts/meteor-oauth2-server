MeteorModel = {
    getAccessToken: async function (bearerToken) {
        try {
            let token = await accessTokenCollection.rawCollection().findOne({
                accessToken: bearerToken
            });
            let client = await clientsCollection.rawCollection().findOne({
                active: true,
                id: token.client_id
            });
            let user = await Meteor.users.findOne({_id: token.user_id});
            return {
                accessToken: token.access_token,
                accessTokenExpiresAt: token.expires_at,
                scope: token.scope,
                client: client,
                user: user
              };        
        } catch (error) {

        };
    },
    getRefreshToken: async function (refreshToken) {
        try {
            let token = await refreshTokenCollection.rawCollection().findOne({
                refreshToken: refreshToken
            });
            let client = await clientsCollection.rawCollection().findOne({
                active: true,
                id: token.client_id
            });
            let user = await Meteor.users.findOne({_id: token.user_id});
            return {
                refreshToken: token.refresh_token,
                refreshTokenExpiresAt: token.expires_at,
                scope: token.scope,
                client: client,
                user: user
              };
        } catch (error) {

        };
    },
    getAuthorizationCode: async function (authorizationCode) {
        try {
            let code = await accessTokenCollection.rawCollection().findOne({
                authorization_code: authorizationCode
            });
            let client = await clientsCollection.rawCollection().findOne({
                active: true,
                id: code.client_id
            });
            let user = await Meteor.users.findOne({_id: token.user_id});
            return {
                code: code.authorization_code,
                expiresAt: code.expires_at,
                redirectUri: code.redirect_uri,
                scope: code.scope,
                client: client,
                user: user
              };
        } catch (error) {
            
        };
    },
    getClient: async function (clientId, clientSecret) {
        let client = await clientsCollection.rawCollection().findOne({
            active: true,
            clientId: clientId
        });
        return {
            id: client.clientId,
            grants: client.grants
        };
    },
    getUserFromClient: async function (client) {
        try {
            let user = await Meteor.users.findOne({_id: token.user_id});
            return user;
        } catch (error) {
            
        }
        
    },
    saveToken: async function (token, client, user) {
        try {
            let tokenDoc = await accessTokenCollection.rawCollection().insert({
                accessToken: token.accessToken,
                clientId: client.id,
                userId: user.id,
                expires: token.accessTokenExpiresAt,
                scope: token.scope
            });
            if (token.hasOwnProperty(refreshToken)) {
                let refreshDoc = await refreshTokenCollection.rawCollection().insert({
                    refreshToken: token.refreshToken,
                    clientId: client.id,
                    userId: user.id,
                    expires: token.refreshTokenExpiresAt,
                    scope: token.scope
                });
            };
            return {
                accessToken: tokenDoc.accessToken,
                accessTokenExpiresAt: tokenDoc.accessTokenExpiresAt,
                refreshToken: refreshToken.refreshToken,
                refreshTokenExpiresAt: refreshToken.refreshTokenExpiresAt,
                scope: tokenDoc.scope,
                client: { id: tokenDoc.clientId },
                user: { id: tokenDoc.userId }
            };
        } catch (error) {
        };
    },
    saveAuthorizationCode: async function (code, client, user) {
        try {
            let authCode = {
                authorization_code: code.authorizationCode,
                expires_at: code.expiresAt,
                redirect_uri: code.redirectUri,
                scope: code.scope,
                client_id: client.id,
                user_id: user.id
              };
              let authorizationCode = await accessTokenCollection.rawCollection().insert({authCode});
              return {
                authorizationCode: authorizationCode.authorization_code,
                expiresAt: authorizationCode.expires_at,
                redirectUri: authorizationCode.redirect_uri,
                scope: authorizationCode.scope,
                client: {id: authorizationCode.client_id},
                user: {id: authorizationCode.user_id}
              };
        } catch (error) {
            
        }
    },
    revokeToken: async function (token) {
        try {
            let refreshToken = refreshTokenCollection.rawCollection().remove({refresh_token: token.refreshToken});
            return refreshToken;
        } catch (error) {
            
        }
    },
    revokeAuthorizationCode: async function (code) {
        try {
            let authorizationCode = await accessTokenCollection.rawCollection().remove({authorization_code: code.authorizationCode});
            return authorizationCode;
        } catch (error) {
            
        }
    },
    verifyScope: async function (token, scope) {
        try {
            if (!token.scope) {
                return false;
              }
              let requestedScopes = scope.split(' ');
              let authorizedScopes = token.scope.split(' ');
              return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);            
        } catch (error) {
            
        }
    }
};
