exports.albumPagePriceUpdate = (_type, _priceTarget, _priceInfo) => {
  if (_type === "add") {
    const calcMedian = (_pT, _currMedian, _currTotal) => {
      const _newTotal = _currTotal + 1;
      const _newMedian = (_currTotal * _currMedian + _pT) / _newTotal;
      console.log(_pT, _currMedian, _currTotal);
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
