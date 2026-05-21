require('dotenv').config();

const axios = require('axios');

const ModsConfig = require('../ModsConfig.json');
const { MODRINTH_BASE_URL_V2 } = require('../constants/constants');
const {
  getFollowedProjectsModrinth,
  getCollectionProjects,
} = require('./getProjectsList');

const checkMods = async () => {
  let modsAvailable = [];
  let modsNotAvailable = [];
  const { gameVersion, loader, modrinthCollectionId } = ModsConfig;

  const projectList = modrinthCollectionId
    ? await getCollectionProjects('client')
    : await getFollowedProjectsModrinth();

  const allPromises = projectList?.map((project) => {
    return axios
      .get(
        `${MODRINTH_BASE_URL_V2}/project/${project.Project_ID}/version?game_versions=["${gameVersion}"]&loaders=["${loader}"]&include_changelog=false`
      )
      .then((res) => {
        // console.log(res.data);
        // Hacky way to check existence; catches error if trying to read undefined.
        try {
          const fileName = res.data[0].files[0].filename;
          const fileURL = res.data[0].files[0].url;
          modsAvailable.push(project.Mod_Name);
        } catch (error) {
          modsNotAvailable.push(project.Mod_Name);
        }
      });
  });

  Promise.all(allPromises).then(() => {
    console.log(`${modsAvailable.length} Mods available for ${gameVersion}`);
    console.log(modsAvailable.toSorted());

    console.log(
      `${modsNotAvailable.length} Mods not available for ${gameVersion}`
    );
    console.log(modsNotAvailable.toSorted());
  });
};

checkMods();
