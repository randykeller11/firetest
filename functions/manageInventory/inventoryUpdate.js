const addAlbum = require("./addAlbum");


exports.handler = async (snap, context, db) => {
  const inventoryUpdateDoc = snap.data();
  if (inventoryUpdateDoc.type === "add") {
    addAlbum.handler(db, inventoryUpdateDoc, context);
  }
};
