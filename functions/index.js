const {v4: uuidv4} = require("uuid");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

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
    .onCreate(async (snap, context) => {
      const inventoryUpdateDoc = snap.data();
      if (inventoryUpdateDoc.type === "add") {
        await admin
            .firestore()
            .collection("musicInventories")
            .doc(`${inventoryUpdateDoc.seller}`)
            .set(
                {[inventoryUpdateDoc.inventoryID]: inventoryUpdateDoc.value},
                {merge: true},
            );

        const albumPageRef = admin.firestore().collection("albumPages");
        const snapshot = await albumPageRef
            .where(
                "albumInfo.idAlbum",
                "==",
                inventoryUpdateDoc.value.albumData.idAlbum,
            )
            .get();
        if (snapshot.empty) {
          const crcInventoryID = uuidv4();
          await admin
              .firestore()
              .collection("albumPages")
              .doc(`${crcInventoryID}`)
              .set({
                albumInfo: inventoryUpdateDoc.value.albumData,
                formatTags: inventoryUpdateDoc.value.formatTags,
                totalCopies: 1,
                priceInfo: {
                  [`${inventoryUpdateDoc.value.condition}`]: {
                    lowestPrice: inventoryUpdateDoc.value.priceTarget,
                    medianPrice: inventoryUpdateDoc.value.priceTarget,
                    highestPrice: inventoryUpdateDoc.value.priceTarget,
                  },
                },

                inAudioDB: true,
              });

          await admin
              .firestore()
              .collection("pendingInventoryUpdates")
              .doc(`${context.params.id}`)
              .set({albumPage: crcInventoryID}, {merge: true});
          return;
        }
        // update album page document to reflect new price
        snapshot.forEach((_albumPageDoc) => {
          console.log(_albumPageDoc.data());

          // make this work with different gradings

          // check low price

          // check high price

        // calculate new median and set that value
        });
      }
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
