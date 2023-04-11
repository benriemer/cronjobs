module.exports = {
  createAndUploadSitemap: async () => {
    await strapi.plugin("sitemap").service("core").createSitemap();
    await strapi.plugin("sitemap").service("core").uploadSitemap();
  }
};

