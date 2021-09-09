exports.albumPagePriceUpdate = (_type, _priceTarget, _priceInfo) => {
  if (_type === "add") {
    const calcMedian = (_pT, _currMedian, _currTotal) => {
      const _newTotal = _currTotal + 1;
      const _newMedian = (_currTotal * _currMedian + _pT) / _newTotal;
      return [_newTotal, _newMedian];
    };

    const updateObject = {..._priceInfo};

    if (_priceInfo.lowestPrice > _priceTarget) {
      updateObject.lowestPrice = _priceTarget;
    }

    if (_priceInfo.highestPrice < _priceTarget) {
      updateObject.highestPrice = _priceTarget;
    }

    const [newTotal, newMedian] = calcMedian(
        Number(_priceTarget),
        Number(_priceInfo.medianPrice),
        Number(_priceInfo.totalCopies),
    );

    updateObject.medianPrice = newMedian;
    updateObject.totalCopies = newTotal;
    return updateObject;
  }
};

exports.makeInventoryObj = (IUDInfo) => {
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

  return {
    dispEssentials: dispEssentials,
    priceEssentials: priceEssentials,
  };
};

exports.makeAdvAlbumPage = (IUDInfo) => {
  const albumData = IUDInfo.albumData;
  const checkValue = (_value) => {
    const returnValue = _value ? _value : "";
    return returnValue;
  };
  return {
    notes: checkValue(albumData.notes),
    images: checkValue(albumData.images),
    trackList: checkValue(albumData.tracklist),
    labels: checkValue(albumData.labels),
    credits: checkValue(albumData.extraartists),
    priceData: [
      {
        mediaCondition: IUDInfo.mediaCondition,
        sleeveCondition: IUDInfo.sleeveCondition,
        lowestPrice: IUDInfo.priceTarget,
        medianPrice: IUDInfo.priceTarget,
        highestPrice: IUDInfo.priceTarget,
        totalCopies: 1,
      },
    ],
  };
};
