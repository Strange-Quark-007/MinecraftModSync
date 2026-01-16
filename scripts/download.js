require('dotenv').config();

const fs = require('fs');
const axios = require('axios');

const ModsConfig = require('../ModsConfig.json');
const { downloadMod } = require('./downloadMod');
const {
  getFollowedProjectsModrinth,
  getCollectionProjects,
} = require('./getProjectsList');
const {
  MODRINTH_BASE_URL_V2,
  BLUE,
  RESET,
  RED,
  CURSEFORGE_BASE_URL,
} = require('../constants/constants');

/**
 * As Modrinth have introduced public collections
 * There is no need to manually update configs file
 * Public collection can now be used for the list
 *
 * Requires config to define other options like version, loader, collection id
 *
 * If no collection id then it downloads from follows list
 * Follows list needs api key as its private collection
 */
const downloadModrinth = async (environment) => {
  const startTime = performance.now();

  const { gameVersion, loader, modrinthCollectionId } = ModsConfig;
  const projectList = modrinthCollectionId?.[environment]
    ? await getCollectionProjects(environment)
    : await getFollowedProjectsModrinth();

  // Create download promises for parallel execution
  const downloadPromises = projectList.map(async (project) => {
    try {
      const res = await axios.get(
        `${MODRINTH_BASE_URL_V2}/project/${project.Project_ID}/version?game_versions=["${gameVersion}"]&loaders=["${loader}"]&include_changelog=false`
      );
      const fileData = res.data[0].files[0];
      const { filename: fileName, url: fileURL } = fileData;
      await downloadMod(fileName, fileURL, environment);
      return { success: true, project: project.Mod_Name };
    } catch (err) {
      console.log(
        `${RED}${project.Mod_Name} -> Not Available (Modrinth) (or Unknown error)${RESET}`
      );
      // console.error(err.message); // For debugging purposes
      return { success: false, project: project.Mod_Name };
    }
  });

  // Execute all downloads in parallel
  await Promise.allSettled(downloadPromises);

  const endTime = performance.now();
  const time = (endTime - startTime) / 1000;

  console.log(
    `${BLUE}---------- Download Completed for ${environment} mods in ${time.toFixed(2)}s ----------${RESET}`
  );
};

/**
 * No changes to CurseForge due to fact that
 *  - there is no way to get favouries by username (CSRF protection)
 *
 * uses the modsConfig for curseforge
 */
const downloadCF = async (environment) => {
  const { gameVersion, loader } = ModsConfig;
  const loaderType = loader === 'fabric' ? 4 : 1;
  const modsList_CF = ModsConfig?.modsList_CurseForge;

  const configCF = { headers: { 'x-api-key': process.env.CF_API_KEY } };

  // Create download promises for parallel execution
  const downloadPromises = modsList_CF.map(async (mod) => {
    try {
      const res = await axios.get(
        `${CURSEFORGE_BASE_URL}/mods/${mod.Project_ID}/files?gameVersion=${gameVersion}&modLoaderType=${loaderType}`,
        configCF
      );
      const { fileName, downloadUrl: fileURL } = res.data.data[0];
      await downloadMod(fileName, fileURL, environment, configCF);
      return { success: true, project: mod.Mod_Name };
    } catch (err) {
      console.log(
        `${RED}${mod.Mod_Name} Not Available (CF). (or Unknown error)${RESET}`
      );
      // console.error(err.message); // For debugging purposes
      return { success: false, project: mod.Mod_Name };
    }
  });

  // Execute all downloads in parallel
  await Promise.allSettled(downloadPromises);
};

if (!fs.existsSync('mods')) {
  fs.mkdirSync('mods', { recursive: true });
}

if (!fs.existsSync('mods/client')) {
  fs.mkdirSync('mods/client', { recursive: true });
}

if (!fs.existsSync('mods/server')) {
  fs.mkdirSync('mods/server', { recursive: true });
}

downloadModrinth('client');
downloadModrinth('server');
downloadCF('client');
