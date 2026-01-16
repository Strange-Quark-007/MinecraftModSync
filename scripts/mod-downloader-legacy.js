require('dotenv').config();

const fs = require('fs');
const axios = require('axios');

const ConfigJSON = require('../ModsConfig.json');
const {
  MODRINTH_BASE_URL_V2,
  CURSEFORGE_BASE_URL,
} = require('../constants/constants');

/**
 * Legacy Mod Downloader
 *
 * This downloads mods based on configurations from a JSON file.
 * Due to new changes in the modrinth api, and introduction of collection, this is obsolete.
 * This still works, if comfortable with the configuration
 *
 * Switch to newer version for added features
 */
const legacyDownload = () => {
  let gameVersion = ConfigJSON.gameVersion;
  let loader = ConfigJSON.loader;
  let loaderType = loader === 'fabric' ? 4 : 1; // Yes I am lazy... only supports either fabric or forge

  fs.mkdirSync('mods', { recursive: true }); // create mods folder at current file path

  ConfigJSON.modsList_Modrinth.map((mod) => {
    axios
      .get(
        `${MODRINTH_BASE_URL_V2}/project/${mod.Project_ID}/version?game_versions=["${gameVersion}"]&loaders=["${loader}"]&include_changelog=false`
      )
      .then((res) => {
        let fileName = res.data[0].files[0].filename;
        let fileURL = res.data[0].files[0].url;

        axios({
          method: 'get',
          url: fileURL,
          responseType: 'stream',
        })
          .then((response) => {
            const writer = fs.createWriteStream(`mods/${fileName}`); // Downloaded mod jars will be saved in mods folder
            response.data.pipe(writer);

            writer.on('finish', () => {
              console.log(`${fileName} download and save completed.`);
            });

            writer.on('error', (err) => {
              console.error('Error writing file:', err);
            });
          })
          .catch((error) => {
            console.error('Error downloading file:', error);
          });
      })
      .catch((err) => console.log(`err with mod -> ${mod.Mod_Name}`));
  });

  ConfigJSON.modsList_CurseForge.map((mod) => {
    const configCF = { headers: { 'x-api-key': process.env.CF_API_KEY } };

    axios
      .get(
        `${CURSEFORGE_BASE_URL}/mods/${mod.Project_ID}/files?gameVersion=${gameVersion}&modLoaderType=${loaderType}`,
        configCF
      )
      .then((res) => {
        let fileName = res.data.data[0].fileName;
        let fileURL = res.data.data[0].downloadUrl;

        axios({
          method: 'get',
          url: fileURL,
          responseType: 'stream',
          configCF,
        })
          .then((response) => {
            const writer = fs.createWriteStream(`mods/${fileName}`); // Downloaded mod jars will be saved in mods folder
            response.data.pipe(writer);

            writer.on('finish', () => {
              console.log(`${fileName} download and save completed.`);
            });

            writer.on('error', (err) => {
              console.error('Error writing file:', err);
            });
          })
          .catch((error) => {
            console.error('Error downloading file:', error);
          });
      })
      .catch((err) => console.log(`err with mod -> ${mod.Mod_Name}`));
  });
};

legacyDownload();
