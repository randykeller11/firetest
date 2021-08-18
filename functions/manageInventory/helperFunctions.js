exports.cleanUp = async (db, dataToCopy, docID) => {
  delete dataToCopy.type;
  await db
      .collection("CRCMusicInventory")
      .add(dataToCopy);
  await db
      .collection("pendingInventoryUpdates")
      .doc(docID)
      .delete();
  return;
};
