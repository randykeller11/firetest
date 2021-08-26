exports.cleanUp = async (db, dataToCopy, docID) => {
  delete dataToCopy.type;
  await db.collection("CRCMusicInventory").add(dataToCopy);
  await db.collection("pendingInventoryUpdates").doc(docID).delete();
  return;
};

exports.calcMedian = (_priceTarget, _currMedian, _currTotal) => {
  const _newTotal = _currTotal + 1;
  const _newMedian = (_currTotal * _currMedian + _priceTarget) / _newTotal;
  return [_newTotal, _newMedian];
};
