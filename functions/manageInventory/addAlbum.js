const helpers = require("./helperFunctions");
const {v4: uuidv4} = require("uuid");

exports.updateAlbumPage = async (db, inventoryUpdateDoc, context) => {
  const IUDInfo = inventoryUpdateDoc.value;
  const docID = IUDInfo.albumData.docID;
  const albumPageSnap = await db.collection("albumPages").doc(`${docID}`).get();

  const invItemData = albumPageSnap.data();
  const updateTarget = `${IUDInfo.condition}`;
  const hasPriceInfo = Object.prototype.hasOwnProperty.call(
      invItemData.priceInfo,
      updateTarget,
  );
  // if no price info exists for this condition add new info with total of 1
  if (!hasPriceInfo) {
    db.collection("albumPages")
        .doc(`${docID}`)
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
    helpers.cleanUp(
        db,
        {...inventoryUpdateDoc, albumPage: docID},
        `${context.params.id}`,
    );
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

    db.collection("albumPages")
        .doc(`${docID}`)
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
    helpers.cleanUp(
        db,
        {...inventoryUpdateDoc, albumPage: docID},
        `${context.params.id}`,
    );
  }
};

exports.makeAlbumPage = async (db, inventoryUpdateDoc, context) => {
  const crcInventoryID = uuidv4();
  const IUDInfo = inventoryUpdateDoc.value;
  await db
      .collection("albumPages")
      .doc(`${crcInventoryID}`)
      .set({
        albumTitle: IUDInfo.albumData.strAlbum.toLowerCase(),
        artist: IUDInfo.albumData.strArtist.toLowerCase(),
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
  helpers.cleanUp(
      db,
      {...inventoryUpdateDoc, albumPage: crcInventoryID},
      `${context.params.id}`,
  );
  return;
};
