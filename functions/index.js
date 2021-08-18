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
      const IUDInfo = inventoryUpdateDoc.value;
      if (inventoryUpdateDoc.type === "add") {
        await admin
            .firestore()
            .collection("musicInventories")
            .doc(`${inventoryUpdateDoc.seller}`)
            .set({[inventoryUpdateDoc.inventoryID]: IUDInfo}, {merge: true});

        const albumPageRef = admin.firestore().collection("albumPages");
        const snapshot = await albumPageRef
            .where("albumInfo.idAlbum", "==", IUDInfo.albumData.idAlbum)
            .get();
        if (snapshot.empty) {
          const crcInventoryID = uuidv4();
          await admin
              .firestore()
              .collection("albumPages")
              .doc(`${crcInventoryID}`)
              .set({
                albumInfo: IUDInfo.albumData,
                formatTags: IUDInfo.formatTags,
                priceInfo: {
                  [`${IUDInfo.condition}`]: {
                    lowestPrice: IUDInfo.priceTarget,
                    medianPrice: IUDInfo.priceTarget,
                    highestPrice: IUDInfo.priceTarget,
                    totalCopies: 1,
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
        // update album page document to reflect new price
        snapshot.forEach((_albumPageDoc) => {
          const invItemData = _albumPageDoc.data();
          const updateTarget = `${IUDInfo.condition}`;
          const hasPriceInfo = Object.prototype.hasOwnProperty.call(
              invItemData.priceInfo,
              updateTarget,
          );

          if (!hasPriceInfo) {
            admin
                .firestore()
                .collection("albumPages")
                .doc(`${_albumPageDoc.id}`)
                .set(
                    {
                      priceInfo: {
                        [`${IUDInfo.condition}`]: {
                          lowestPrice: IUDInfo.priceTarget,
                          medianPrice: IUDInfo.priceTarget,
                          highestPrice: IUDInfo.priceTarget,
                          totalCopies: 1,
                        },
                      },
                    },
                    {
                      merge: true,
                    },
                );
            return;
          }

          if (hasPriceInfo) {
            const _priceInfo = invItemData.priceInfo[updateTarget];
            const updateObject = {..._priceInfo};

            if (_priceInfo.lowestPrice > IUDInfo.priceTarget) {
              updateObject.lowestPrice = IUDInfo.priceTarget;
            }

            if (_priceInfo.highestPrice < IUDInfo.priceTarget) {
              updateObject.highestPrice = IUDInfo.priceTarget;
            }
            const calcMedian = (_priceTarget, _currMedian, _currTotal) => {
              const _newTotal = _currTotal + 1;
              const _newMedian =
              (_currTotal * _currMedian + _priceTarget) / _newTotal;
              return [_newTotal, _newMedian];
            };
            const [newTotal, newMedian] = calcMedian(
                Number(IUDInfo.priceTarget),
                Number(_priceInfo.medianPrice),
                Number(_priceInfo.totalCopies),
            );

            updateObject.medianPrice = newMedian;
            updateObject.totalCopies = newTotal;

            admin
                .firestore()
                .collection("albumPages")
                .doc(`${_albumPageDoc.id}`)
                .set(
                    {
                      priceInfo: {
                        // note the square brackets
                        [updateTarget]: updateObject,
                      },
                    },
                    {
                      merge: true,
                    },
                );
            console.log("we got to this point 🍩🏆🌊🔑");
          }
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
