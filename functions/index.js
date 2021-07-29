const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.logActivities = functions.firestore
  .document("/{collection}/{id}")
  .onCreate((snap, context) => {
    console.log(snap.data());

    const activities = admin.firestore().collection("activities");

    const stores = admin.firestore().collection("stores");
    const collection = context.params.collection;

    if (collection === "pendingUpdates") {
      return stores.add({ text: "new pending update!" });
    }
    if (collection === "posts") {
      return activities.add({ text: "someone just made a post" });
    }

    return null;
  });
