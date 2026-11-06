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

  if (!projectList || projectList.length === 0) {
    console.log('No projects found to check.');
    return;
  }

  const allPromises = projectList.map(async (project) => {
    try {
      const res = await axios.get(
        `${MODRINTH_BASE_URL_V2}/project/${project.Project_ID}/version?game_versions=["${gameVersion}"]&loaders=["${loader}"]&include_changelog=false`
      );

      if (res.data && res.data.length > 0 && res.data[0]?.files?.length > 0) {
        modsAvailable.push(project.Mod_Name);
      } else {
        modsNotAvailable.push(project.Mod_Name);
      }
    } catch {
      modsNotAvailable.push(project.Mod_Name);
    }
  });

  await Promise.all(allPromises);

  console.log(`${modsAvailable.length} Mods available for ${gameVersion}`);
  console.log(modsAvailable.toSorted());

  console.log(
    `${modsNotAvailable.length} Mods not available for ${gameVersion}`
  );
  console.log(modsNotAvailable.toSorted());
};

checkMods();
