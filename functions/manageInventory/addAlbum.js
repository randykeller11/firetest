const helpers = require("./helperFunctions");

exports.makeAlbumPage = async (
    db,
    inventoryUpdateDoc,
    IUDInfo,
    inventoryObject,
    conditionGrade,
    crcInventoryID,
) => {
  await db
      .collection("albumPages")
      .doc(`${crcInventoryID}`)
      .set({
        albumTitle_Search: IUDInfo.albumData.title.toLowerCase(),
        artist_Search: IUDInfo.albumData.artists_sort.toLowerCase(),
        artistID: IUDInfo.albumData.artists[0].id,
        releaseID: IUDInfo.albumData.id,
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
  const updatedInvObject = {
    ...inventoryObject,
    albumPage: `${crcInventoryID}`,
  };
  await db
      .collection("musicInventories")
      .doc(`${inventoryUpdateDoc.seller}`)
      .set(
          {
            [inventoryUpdateDoc.inventoryID]: updatedInvObject,
          },
          {merge: true},
      );
  await db.collection("CRCMusicInventory").add(updatedInvObject);
};

exports.updateAlbumPage = async (
    db,
    inventoryUpdateDoc,
    IUDInfo,
    inventoryObject,
    conditionGrade,
    invItemData,
    docID,
) => {
  const hasPriceInfo = Object.prototype.hasOwnProperty.call(
      invItemData.priceInfo,
      `${conditionGrade}`,
  );

  // if no price info exists for this condition
  // add new info with total of 1
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

    return;
  }
  // if there is price info for the condition
  // update the lowestPrice, highestPrice and medianPrice
  if (hasPriceInfo) {
    const _priceInfo = invItemData.priceInfo[`${conditionGrade}`];
    const updateObject = helpers.albumPagePriceUpdate(
        "add",
        IUDInfo.priceTarget,
        _priceInfo,
    );

    db.collection("albumPages")
        .doc(`${docID}`)
        .set(
            {
              priceInfo: {
                // note the square brackets
                [`${conditionGrade}`]: updateObject,
              },
            },
            {
              merge: true,
            },
        );
  }

  const updatedInvObject = {
    ...inventoryObject,
    albumPage: `${docID}`,
  };

  await db
      .collection("musicInventories")
      .doc(`${inventoryUpdateDoc.seller}`)
      .set(
          {
            [inventoryUpdateDoc.inventoryID]: updatedInvObject,
          },
          {merge: true},
      );
  await db.collection("CRCMusicInventory").add(updatedInvObject);
};
