const addAlbum = require("./addAlbum");

exports.handler = async (snap, context, db) => {
  const inventoryUpdateDoc = snap.data();
  if (inventoryUpdateDoc.type === "add") {
    await db
        .collection("musicInventories")
        .doc(`${inventoryUpdateDoc.seller}`)
        .set(
            {[inventoryUpdateDoc.inventoryID]: inventoryUpdateDoc.value},
            {merge: true},
        );
    if (inventoryUpdateDoc.value.infoSource === "albumPages") {
      addAlbum.updateAlbumPage(db, inventoryUpdateDoc, context);
    } else {
      addAlbum.makeAlbumPage(db, inventoryUpdateDoc, context);
    }
  }
};
