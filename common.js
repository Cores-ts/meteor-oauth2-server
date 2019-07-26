refreshTokensCollection = new Meteor.Collection("OAuth2RefreshTokens")
refreshTokensCollection.allow({
    insert: function (userId, doc) {
        return Meteor.isServer && userId && userId === doc.userId
    },
    update: function (userId, doc, fieldNames, modifier) {
        return false
    },
    remove: function (userId, doc) {
        return userId && userId === doc.userId
    }
})

authCodesCollection = new Meteor.Collection("OAuth2AuthCodes")
authCodesCollection.allow({
    insert: function (userId, doc) {
        return Meteor.isServer && userId && userId === doc.userId
    },
    update: function (userId, doc, fieldNames, modifier) {
        return false
    },
    remove: function (userId, doc) {
        return userId && userId === doc.userId
    }
})

clientsCollection = new Meteor.Collection("OAuth2Clients")

clientsCollection.allow({
    insert: function () {
        return false
    },
    update: function () {
        return false
    },
    remove: function () {
        return false
    }
})

oauth = {
    pubSubNames: {
        authCodes: "oauth2/authCodes",
        refreshTokens: "oauth2/refreshTokens",
        client: "oauth2/clientsCollection"
    },
    methodNames: {
        authorize: "oauth2/authorize"
    },
    collections: {
        refreshToken: refreshTokensCollection,
        authCode: authCodesCollection,
        client: clientsCollection
    }
}