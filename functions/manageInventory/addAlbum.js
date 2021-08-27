const helpers = require("./helperFunctions");
const {v4: uuidv4} = require("uuid");

exports.updateAlbumPage = async (
    db,
    inventoryUpdateDoc,
    context,
    inventoryObject,
) => {
  try {
    const IUDInfo = inventoryUpdateDoc.value;
    const docID = IUDInfo.albumData.docID;
    const albumPageSnap = await db
        .collection("albumPages")
        .doc(`${docID}`)
        .get();

    const invItemData = albumPageSnap.data();
    const conditionGrade =
      IUDInfo.sleeveCondition < IUDInfo.mediaCondition ?
        IUDInfo.sleeveCondition :
        IUDInfo.mediaCondition;
    const updateTarget = `${conditionGrade}`;
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
                  [`${conditionGrade}`]: {
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
          {...inventoryObject, albumPage: docID},
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
          {...inventoryObject, albumPage: docID},
          `${context.params.id}`,
      );
    }
  } catch (error) {
    console.log(error);
  }
};

exports.makeAlbumPage = async (
    db,
    inventoryUpdateDoc,
    context,
    inventoryObject,
) => {
  try {
    const crcInventoryID = uuidv4();
    const IUDInfo = inventoryUpdateDoc.value;
    const conditionGrade =
      IUDInfo.sleeveCondition < IUDInfo.mediaCondition ?
        IUDInfo.sleeveCondition :
        IUDInfo.mediaCondition;
    await db
        .collection("albumPages")
        .doc(`${crcInventoryID}`)
        .set({
          albumTitle_Search: IUDInfo.albumData.title.toLowerCase(),
          artist_Search: IUDInfo.albumData.artists_sort.toLowerCase(),
          dispEssentials: inventoryObject.dispEssentials,
          priceInfo: {
            [`${conditionGrade}`]: {
              lowestPrice: IUDInfo.priceTarget,
              medianPrice: IUDInfo.priceTarget,
              highestPrice: IUDInfo.priceTarget,
              totalCopies: 1,
            },
          },
        });
    await db
        .collection("musicInventories")
        .doc(`${inventoryUpdateDoc.seller}`)
        .set({
          [inventoryUpdateDoc.inventoryID]: {
            ...inventoryObject,
            albumPage: crcInventoryID,
          },
        });
    helpers.cleanUp(
        db,
        {...inventoryObject, albumPage: crcInventoryID},
        `${context.params.id}`,
    );
    return;
  } catch (error) {
    console.log(error);
  }
};
