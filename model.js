MeteorModel = {
    getClient: async function (clientId, clientSecret) {
        let client = await clientsCollection.rawCollection().findOne({
            active: true,
            clientId: clientId
        });
        return {
            id: client.clientId,
            grants: client.grantsAllowed
        };
    },
    getToken: async function (bearerToken) {
        try {
            let token = await accessTokenCollection.findOne({
                accessToken: bearerToken
            });
            return token;
        } catch (error) {
        };
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
    grantTypeAllowed: async function (clientId) {
        try {
            let client = await clientsCollection.rawCollection().findOne({
                active: true,
                clientId: clientId
            });
            return client.grants; // Check this (Schema)             
        } catch (error) {
        };
    },
    getAuthCode: async function (authCode) {
        try {
            let code = await accessTokenCollection.rawCollection().findOne({
                authCode: authCode
            });
            return code;
        } catch (error) {
        }
    },
    saveAuthCode: async function (code, clientId, expires, user) {
        try {
            authCodeCollection.rawCollection().remove({authCode: code});
            let codeId = this.authCodeCollection.insert({
                authCode: code,
                clientId: clientId,
                userId: user.id,
                expires: expires
            });
            return codeId;
        } catch (error) {
        };
    },
    saveRefreshToken: async function (token, clientId, expires, user) {
        try {
            refreshTokenCollection.rawCollection().remove({refreshToken: token});
            let tokenId = this.refreshTokenCollection.insert({
                refreshToken: token,
                clientId: clientId,
                userId: user.id,
                expires: expires
            });
            return tokenId;
        } catch (error) {
        };
    },
}
