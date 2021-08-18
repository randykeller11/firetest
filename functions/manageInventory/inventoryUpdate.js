const {v4: uuidv4} = require("uuid");

exports.handler = async (snap, context, db) => {
  const inventoryUpdateDoc = snap.data();
  const IUDInfo = inventoryUpdateDoc.value;
  if (inventoryUpdateDoc.type === "add") {
    await db
        .collection("musicInventories")
        .doc(`${inventoryUpdateDoc.seller}`)
        .set({[inventoryUpdateDoc.inventoryID]: IUDInfo}, {merge: true});

    const albumPageRef = db.collection("albumPages");
    const snapshot = await albumPageRef
        .where("albumInfo.idAlbum", "==", IUDInfo.albumData.idAlbum)
        .get();
    const crcInventoryID = uuidv4();

    const cleanUp = async () => {
      const dataToCopy = {...inventoryUpdateDoc, albumPage: crcInventoryID};
      delete dataToCopy.type;
      await db
          .collection("CRCMusicInventory")
          .add(dataToCopy);
      await db
          .collection("pendingInventoryUpdates")
          .doc(`${context.params.id}`)
          .delete();
      return;
    };

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
      cleanUp();
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
        cleanUp();
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
        cleanUp();
      }
    });
  }
};
