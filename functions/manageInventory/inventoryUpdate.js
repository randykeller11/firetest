const helpers = require("./helperFunctions");
const addAlbum = require("./addAlbum");

exports.handler = async (snap, context, db) => {
  try {
    const inventoryUpdateDoc = snap.data();
    const IUDInfo = inventoryUpdateDoc.value;
    const inventoryObject = helpers.makeInventoryObj(IUDInfo);

    const conditionGrade =
      IUDInfo.sleeveCondition < IUDInfo.mediaCondition ?
        IUDInfo.sleeveCondition :
        IUDInfo.mediaCondition;

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

      const albumPageRef = await db
          .collection("albumPages")
          .where("releaseID", "==", IUDInfo.albumData.id)
          .get();

      if (albumPageRef.empty) {
        addAlbum.makeAlbumPage(
            db,
            inventoryUpdateDoc,
            IUDInfo,
            inventoryObject,
            conditionGrade,
        );
        return;
      } else {
        const docID = albumPageRef.docs[0].id;
        const invItemData = albumPageRef.docs[0].data();
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
