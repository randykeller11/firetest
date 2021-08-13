const { v4: uuidv4 } = require("uuid");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

exports.updateLikeCount = functions.firestore
  .document("pendingUpdates/{id}")
  .onCreate((snap, context) => {
    return admin
      .firestore()
      .collection("watchlists")
      .doc(`${context.params.id}`)
      .get()
      .then((doc) => {
        console.log("Got rule: " + doc.data().test);
      });
  });

exports.newUserSignUp = functions.auth.user().onCreate((user) => {
  console.log("user created", user.email, user.uid);
  return admin
    .firestore()
    .collection("users")
    .doc(`${user.uid}`)
    .set({ profileID: uuidv4() });
});
