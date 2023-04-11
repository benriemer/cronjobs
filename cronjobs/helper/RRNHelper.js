const extractIdFromRRN = (rrn) => {
  return rrn.substring(rrn.lastIndexOf(':') + 1, rrn.length);
}

const checkIfRRNIsValid = async (rrn) => {
  const asset = await strapi.deezerProxy.getAssetIdForRRN(rrn);
  if (!asset) {
    return rrn;
  } else {
    return null;
  }
}

const extractRRNFromDbResponse = (rawPackages, fieldName) => {
  return rawPackages[0].map(rawPackage => rawPackage[fieldName]);
}

module.exports = {
  extractIdFromRRN,
  checkIfRRNIsValid,
  extractRRNFromDbResponse
}
