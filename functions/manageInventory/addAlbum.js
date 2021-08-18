const {v4: uuidv4} = require("uuid");
const helpers = require("./helperFunctions");

exports.handler = async (db, inventoryUpdateDoc, context) => {
  const IUDInfo = inventoryUpdateDoc.value;

  await db
      .collection("musicInventories")
      .doc(`${inventoryUpdateDoc.seller}`)
      .set({[inventoryUpdateDoc.inventoryID]: IUDInfo}, {merge: true});

  const albumPageRef = db.collection("albumPages");
  const snapshot = await albumPageRef
      .where("albumInfo.idAlbum", "==", IUDInfo.albumData.idAlbum)
      .get();
  const crcInventoryID = uuidv4();
  const dataForCleanup = {...inventoryUpdateDoc, albumPage: crcInventoryID};


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
