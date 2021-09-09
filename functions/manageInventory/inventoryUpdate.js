const addAlbum = require("./addAlbum");
const helpers = require("./helperFunctions");

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
        addAlbum.updateAlbumPage(
            db,
            inventoryUpdateDoc,
            IUDInfo,
            inventoryObject,
            conditionGrade,
            invItemData,
            docID,
        );
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
