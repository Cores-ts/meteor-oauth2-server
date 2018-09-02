MeteorModel = {
    getAccessToken: async function (bearerToken) {
        let token = await accessTokenCollection.findOne({
            accessToken: bearerToken
        });
        return token;
    },
    getAuthorizationCode: function () {},
    getClient: function () {},
    getUser: function () {},
    saveToken: function () {}
};
