const {v4: uuidv4} = require("uuid");
const helpers = require("./helperFunctions");

exports.handler = async (snap, context, db) => {
  try {
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

      const albumPageRef = await db
          .collection("albumPages")
          .where("releaseID", "==", IUDInfo.albumData.id)
          .get();

      if (albumPageRef.empty) {
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

        return;
      } else {
        const docID = albumPageRef.docs[0].id;
        const invItemData = albumPageRef.docs[0].data();

        const conditionGrade =
          IUDInfo.sleeveCondition < IUDInfo.mediaCondition ?
            IUDInfo.sleeveCondition :
            IUDInfo.mediaCondition;
        const updateTarget = `${conditionGrade}`;
        const hasPriceInfo = Object.prototype.hasOwnProperty.call(
            invItemData.priceInfo,
            updateTarget,
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
          const _priceInfo = invItemData.priceInfo[updateTarget];
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
                      [updateTarget]: updateObject,
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
      }
    }
    await db
        .collection("pendingInventoryUpdates")
        .doc(`${context.params.id}`)
        .delete();
  } catch (error) {
    console.log(error);
  }
};
