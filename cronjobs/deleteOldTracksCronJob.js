// Constants used in the deleteThreeWeekOldTracks function.
const RADIO_STATION_TRACKS_UID = "api::radio-station-track.radio-station-track";
const MILLISECONDS_IN_A_DAY = 24 * 60 * 60 * 1000;
const THREE_WEEKS = 3 * 7;
/**
 Deletes radio station tracks that are three weeks old or older.
 @async
 @function
 @returns {Promise<void>}
 */
module.exports = {
  deleteThreeWeekOldTracks: async () => {
    // Calculate the date that is three weeks ago.
    const threeWeeksAgo = new Date(
      Date.now() - THREE_WEEKS * MILLISECONDS_IN_A_DAY
    );
    // Delete tracks that have a start timestamp older than three weeks ago.
    await strapi.db.collection(RADIO_STATION_TRACKS_UID).deleteMany({
      where: {startTimestamp: {$lt: threeWeeksAgo}},
    });
  }
};
