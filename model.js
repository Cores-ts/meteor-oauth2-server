MeteorModel = {
    getAccessToken: Meteor.bindEnvironment(
        async function (bearerToken) {
            let token = await oAuth2Server.collections.accessToken.findOne({
                accessToken: bearerToken
            })
            return token
        }),
    getAuthorizationCode: function () {},
    /**
     * TO DO: Check if getClient returns client.redirectUris and client.grants from DB
     */
    getClient: Meteor.bindEnvironment(
        async function (clientId, clientSecret) {
            try {
                var client;
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
    getUser: function () {},
    saveToken: function () {}
}
