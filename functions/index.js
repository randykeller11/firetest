const functions = require("firebase-functions");
import * as admin from "firebase-admin";
admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.getWatchlist = functions.https.onRequest((request, response) => {
  const promise = admin
    .firestore()
    .doc("watchlists/uEoXccZNxVTYdBNNK4ilSUO2rSr1")
    .get();
  const p2 = promise.then((snapshot) => {
    const data = snapshot.data();
    response.send();
  });
  p2.catch((error) => {
    console.log(error);
    response.status(500).send(error);
  });
});
