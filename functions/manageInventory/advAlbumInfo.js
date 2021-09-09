const helpers = require("./helperFunctions");

exports.makeAlbumPage = async (db, IUDInfo, crcInventoryID) => {
  try {
    const pageData = helpers.makeAdvAlbumPage(IUDInfo);
    await db.collection("advAlbumInfo").doc(`${crcInventoryID}`).set(pageData);
  } catch (error) {
    console.log(error);
  }
};

exports.updateAlbumPage = async (db, IUDInfo, docID) => {
  try {
    const advInfoPageRef = await db
        .collection("advAlbumInfo")
        .doc(`${docID}`)
        .get();
    const advInfo = advInfoPageRef.data();
    const priceData = advInfo.priceData;
    const checkArray = priceData.filter((condPrice) => {
      if (
        condPrice.mediaCondition === IUDInfo.mediaCondition &&
        condPrice.sleeveCondition === IUDInfo.sleeveCondition
      ) {
        return true;
      }
    });
    if (checkArray.length === 0) {
      const updateArray = [
        ...priceData,
        {
          mediaCondition: IUDInfo.mediaCondition,
          sleeveCondition: IUDInfo.sleeveCondition,
          lowestPrice: IUDInfo.priceTarget,
          medianPrice: IUDInfo.priceTarget,
          highestPrice: IUDInfo.priceTarget,
          totalCopies: 1,
        },
      ];
      await db
          .collection("advAlbumInfo")
          .doc(`${docID}`)
          .set({...advInfo, priceData: updateArray});
    } else {
      console.log("check array =>", checkArray);
      const updateObject = helpers.albumPagePriceUpdate(
          "add",
          IUDInfo.priceTarget,
          checkArray[0],
      );
      const updateArray = priceData.filter((condPrice) => {
        if (
          condPrice.mediaCondition != IUDInfo.mediaCondition &&
          condPrice.sleeveCondition != IUDInfo.sleeveCondition
        ) {
          return true;
        }
      });
      await db
          .collection("advAlbumInfo")
          .doc(`${docID}`)
          .set({...advInfo, priceData: [...updateArray, updateObject]});
    }
  } catch (error) {
    console.log(error);
  }
};
