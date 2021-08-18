const inventoryUpdate = require("./manageInventory/inventoryUpdate");
const {v4: uuidv4} = require("uuid");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

exports.asyncTest = functions.firestore
    .document("pendingUpdates/{id}")
    .onCreate(async (snap, context) => {
      const doc = await admin
          .firestore()
          .collection("musicInventories")
          .doc(`${context.params.id}`)
          .get();

      console.log(doc.data());
    });

exports.inventoryUpdate = functions.firestore
    .document("pendingInventoryUpdates/{id}")
    .onCreate((_snap, _context)=>{
      inventoryUpdate.handler(_snap, _context, db);
    });
// onUpdate function for "pendingInventoryUpdates/{id}"
// create copy of PIU object in "crcMusicInventory"
// add albumPage value to "musicInventories/{id}"
// delete "PIU" document

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
