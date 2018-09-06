MeteorModel = {
    getClient: async function (clientId, clientSecret) {
        let client = await clientsCollection.rawCollection().findOne({
            active: true,
            clientId: clientId
        })
        return {
            id: client.clientId,
            grants: client.grantsAllowed
        }
    }
}