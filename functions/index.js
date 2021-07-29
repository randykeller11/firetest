const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.logActivities = functions.firestore
  .document("/{collection}/{id}")
  .onCreate((snap, context) => {
    console.log(snap.data());

    const activities = admin.firestore().collection("activities");
    const collection = context.params.collection;

    if (collection === "watchlists") {
      return activities.add({ text: "a new user was added" });
    }
    if (collection === "posts") {
      return activities.add({ text: "someone just made a post" });
    }

    return null;
  });
