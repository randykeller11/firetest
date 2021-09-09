const {v4: uuidv4} = require("uuid");

exports.makeAlbumPage = async (
    db,
    inventoryUpdateDoc,
    IUDInfo,
    inventoryObject,
    conditionGrade,
) => {
  const crcInventoryID = uuidv4();

  await db
      .collection("albumPages")
      .doc(`${crcInventoryID}`)
      .set({
        albumTitle_Search: IUDInfo.albumData.title.toLowerCase(),
        artist_Search: IUDInfo.albumData.artists_sort.toLowerCase(),
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
