const inventoryUpdate = require("./manageInventory/inventoryUpdate");
const {v4: uuidv4} = require("uuid");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
const manageArtistPages = require("./manageInventory/manageArtistPages");

exports.inventoryUpdate = functions.firestore
    .document("pendingInventoryUpdates/{id}")
    .onCreate((_snap, _context) => {
      inventoryUpdate.handler(_snap, _context, db);
    });

exports.manageArtistPages = functions.firestore
    .document("albumPages/{id}")
    .onCreate((_snap, _context) => {
      manageArtistPages.handler(_snap, _context, db);
    });

exports.newUserSignUp = functions.auth.user().onCreate((user) => {
  console.log("user created", user.email, user.uid);
  return admin
      .firestore()
      .collection("users")
      .doc(`${user.uid}`)
      .set({profileID: uuidv4()});
});

exports.newStoreSignUp = functions.firestore
    .document("users/{id}")
    .onUpdate((snap, context) => {
      const after = snap.after.data();
      if (after.accountType === 1) {
        return admin
            .firestore()
            .collection("musicInventories")
            .doc(`${context.params.id}`)
            .set({});
      }
    });
