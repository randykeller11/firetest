const addAlbum = require("./addAlbum");
const helpers = require("./helperFunctions");
const advAlbumInfo = require("./advAlbumInfo");
const {v4: uuidv4} = require("uuid");

exports.handler = async (snap, context, db) => {
  try {
    await db
        .collection("pendingInventoryUpdates")
        .doc(`${context.params.id}`)
        .delete();
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
        const crcInventoryID = uuidv4();
        addAlbum.makeAlbumPage(
            db,
            inventoryUpdateDoc,
            IUDInfo,
            inventoryObject,
            conditionGrade,
            crcInventoryID,
        );
        advAlbumInfo.makeAlbumPage(db, IUDInfo, crcInventoryID);
        return;
      } else {
        const docID = albumPageRef.docs[0].id;
        const invItemData = albumPageRef.docs[0].data();
        addAlbum.updateAlbumPage(
            db,
            inventoryUpdateDoc,
            IUDInfo,
            inventoryObject,
            conditionGrade,
            invItemData,
            docID,
        );
        advAlbumInfo.updateAlbumPage(db, IUDInfo, docID);
        return;
      }
    }
  } catch (error) {
    console.log(error);
  }
};
