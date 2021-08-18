const {v4: uuidv4} = require("uuid");
const helpers = require("./helperFunctions");

exports.handler = async (db, inventoryUpdateDoc, context) => {
  const IUDInfo = inventoryUpdateDoc.value;

  // add album to users music inventory
  await db
      .collection("musicInventories")
      .doc(`${inventoryUpdateDoc.seller}`)
      .set({[inventoryUpdateDoc.inventoryID]: IUDInfo}, {merge: true});

  // check album pages collection for a page with audioDB-ID
  const albumPageRef = db.collection("albumPages");
  const snapshot = await albumPageRef
      .where("albumInfo.idAlbum", "==", IUDInfo.albumData.idAlbum)
      .get();

  // declare important variables for function below
  const crcInventoryID = uuidv4();
  const dataForCleanup = {...inventoryUpdateDoc, albumPage: crcInventoryID};

  // if there is not an album page
  if (snapshot.empty) {
    await db
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
    helpers.cleanUp(db, dataForCleanup, `${context.params.id}`);
    return;
  }
  // if there is an album page
  // update album page document to reflect new price
  snapshot.forEach((_albumPageDoc) => {
    const invItemData = _albumPageDoc.data();
    const updateTarget = `${IUDInfo.condition}`;
    const hasPriceInfo = Object.prototype.hasOwnProperty.call(
        invItemData.priceInfo,
        updateTarget,
    );
    // if no price info exists for this condition add new info with total of 1
    if (!hasPriceInfo) {
      db
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
      helpers.cleanUp(db, dataForCleanup, `${context.params.id}`);
      return;
    }
    // if there is price info for the condition
    // update the lowestPrice, highestPrice and medianPrice
    if (hasPriceInfo) {
      const _priceInfo = invItemData.priceInfo[updateTarget];
      const updateObject = {..._priceInfo};

      if (_priceInfo.lowestPrice > IUDInfo.priceTarget) {
        updateObject.lowestPrice = IUDInfo.priceTarget;
      }

      if (_priceInfo.highestPrice < IUDInfo.priceTarget) {
        updateObject.highestPrice = IUDInfo.priceTarget;
      }

      const [newTotal, newMedian] = helpers.calcMedian(
          Number(IUDInfo.priceTarget),
          Number(_priceInfo.medianPrice),
          Number(_priceInfo.totalCopies),
      );

      updateObject.medianPrice = newMedian;
      updateObject.totalCopies = newTotal;

      db
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
      helpers.cleanUp(db, dataForCleanup, `${context.params.id}`);
    }
  });
};
