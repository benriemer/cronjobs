const axios = require("axios");

const radioStationUid = "api::radio-station.radio-station";
const radioStationTracksUid = "api::radio-station-track.radio-station-track";
const currentUnixTimestamp = Math.floor(Date.now() / 1000);
module.exports = {
  async radioStationsUpdate() {
    const radioStationsToUpdate = await fetchRadioStationsToUpdate();
    await updateExpiredRadioStations(radioStationsToUpdate);
  },
};
const updateExpiredRadioStations = async (radioStations) => {
  if (radioStations.length <= 0) {
    return;
  }
  for (const station of radioStations) {
    const responseData = await getStation(station);
    updateStationIfNecessary(station, responseData);
  }
};
const checkIfDifferentTrack = (station, responseData) => {
  return (
    station.currentArtist !== responseData.artist ||
    station.currentTitle !== responseData.title
  );
};
const updateStationIfNecessary = (station, responseData) => {
  if (!responseData) {
    strapi.log.error(`No Response for station: ${station.name}!`);
    return;
  }
  if (!checkIfDifferentTrack(station, responseData)) {
    return;
  }
  strapi.log.info(`updating station: ${station.name}`);
  updateRadioStationEntry(station.id, responseData).catch((e) =>
    strapi.log.error(e.message)
  );
  createRadioStationTrackEntry(station.id, responseData).catch((e) =>
    strapi.log.error(e.message)
  );
};
const fetchRadioStationsToUpdate = async () => {
  return strapi.db.query(radioStationUid).findMany({
    populate: ["RadioStationTracks"],
    where: {
      $or: [
        { expiresAt: { $lt: currentUnixTimestamp } },
        { expiresAt: { $null: true } },
      ],
    },
  });
};
const updateRadioStationEntry = async (radioStationId, responseData) => {
  return strapi.db.query(radioStationUid).update({
    where: { id: radioStationId },
    data: {
      currentArtist: responseData.artist,
      currentTitle: responseData.song,
      expiresAt: responseData.start_timestamp + responseData.duration + 15,
    },
    populate: ["artwork"], // needed for lifecycles and kafka
  });
};
const createRadioStationTrackEntry = async (radioStationId, responseData) => {
  return strapi.db.query(radioStationTracksUid).create({
    data: {
      artist: responseData.artist,
      title: responseData.song,
      duration: responseData.duration,
      startTimestamp: responseData.start_timestamp,
      RadioStation: radioStationId,
    },
  });
};
const getStation = async (radioStation) => {
  let data;
  try {
    const response = await axios.get(
      `https://api.streamabc.net/metadata/channel/${radioStation.RadioStationID}.json`
    );
    data = response.data;
  } catch (e) {
    strapi.log.error("failing update", e);
  }
  return data;
};
