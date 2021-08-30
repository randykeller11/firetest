const addAlbum = require("./addAlbum");
const {v4: uuidv4} = require("uuid");

exports.handler = async (snap, context, db) => {
  const inventoryUpdateDoc = snap.data();
  const IUDInfo = inventoryUpdateDoc.value;
  const dispEssentials = {
    albumTitle: IUDInfo.albumData.title,
    artist: IUDInfo.albumData.artists_sort,
    image: IUDInfo.masterImage,
    year: IUDInfo.albumData.year,
    labels: IUDInfo.albumData.labels,
    format: IUDInfo.albumData.formats,
    genre: IUDInfo.albumData.genres,
  };

  const priceEssentials = {
    priceTarget: IUDInfo.priceTarget,
    mediaCondition: IUDInfo.mediaCondition,
    sleeveCondition: IUDInfo.sleeveCondition,
  };

  const inventoryObject = {
    dispEssentials: dispEssentials,
    priceEssentials: priceEssentials,
  };

  if (inventoryUpdateDoc.type === "add") {
    if (inventoryUpdateDoc.value.infoSource === "albumPages") {
      await db
          .collection("musicInventories")
          .doc(`${inventoryUpdateDoc.seller}`)
          .set(
              {
                [inventoryUpdateDoc.inventoryID]: {
                  ...inventoryObject,
                  albumPage: inventoryUpdateDoc.value.albumData.docID,
                },
              },
              {merge: true},
          );
      addAlbum.updateAlbumPage(
          db,
          inventoryUpdateDoc,
          context,
          inventoryObject,
      );
    } else {
      await db
          .collection("musicInventories")
          .doc(`${inventoryUpdateDoc.seller}`)
          .set(
              {
                [inventoryUpdateDoc.inventoryID]: inventoryObject,
              },
              {merge: true},
          );
      const crcInventoryID = uuidv4();

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
      return;
    }
  }
};
