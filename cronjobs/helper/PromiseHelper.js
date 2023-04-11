const promiseAllInBatches = async (task, items, batchSize) => {
  let position = 0;
  let results = [];

  while (position < items.length) {
    strapi.log.info(`handling batch at ${position} to ${position + batchSize} for ${task.name} (total: ${items.length})`)
    const itemsForBatch = items.slice(position, position + batchSize);
    results = [...results, ...await Promise.all(itemsForBatch.map(item => task(item)))];
    position += batchSize;
  }
  return results;
}

module.exports = {
  promiseAllInBatches
}
