require('dotenv').config();

const axios = require('axios');

const ModsConfig = require('../ModsConfig.json');
const {
  MODRINTH_BASE_URL_V2,
  MODRINTH_BASE_URL_V3,
} = require('../constants/constants');

/**
 * Get list of all followed projects
 * getting followed projects require api key
 */
const getFollowedProjectsModrinth = async () => {
  if (!process.env.MODRINTH_API_KEY) {
    throw new Error('Modrinth API key not defined in env');
  }

  if (!ModsConfig.modrinthUserId) {
    console.error('Modrinth UserId not defined in Config');
    return [];
  }

  let res;
  const config = { headers: { authorization: process.env.MODRINTH_API_KEY } };
  try {
    res = await axios.get(
      `${MODRINTH_BASE_URL_V2}/user/${ModsConfig.modrinthUserId}/follows`,
      config
    );
  } catch (e) {
    console.log('Verify User ID');
    return [];
  }

  const follows = res?.data;
  return (
    follows
      ?.filter((o) => o.project_type === 'mod')
      ?.map(({ id, slug }) => ({ Mod_Name: slug, Project_ID: id })) || []
  );
};

/**
 * Make sure collection is public
 *
 * Collection List only contains list of project_ids
 *
 * Fetches project details in batch via /v2/projects endpoint
 */
const getCollectionProjects = async (environment = 'client') => {
  let res;

  try {
    res = await axios.get(
      `${MODRINTH_BASE_URL_V3}/collection/${ModsConfig.modrinthCollectionId?.[environment]}`
    );
  } catch (e) {
    // console.error(err.message); // For debugging purposes
    console.error('Verify modrinth Collection ID');
    return [];
  }

  const projects = res?.data?.projects;
  if (!projects || projects.length === 0) {
    return [];
  }

  try {
    const projectData = await axios.get(
      `${MODRINTH_BASE_URL_V2}/projects?ids=${encodeURIComponent(JSON.stringify(projects))}`
    );
    return (
      projectData?.data?.map(({ id, slug }) => ({
        Mod_Name: slug,
        Project_ID: id,
      })) || []
    );
  } catch (e) {
    console.error('Failed to fetch project details from Modrinth:', e.message);
    return [];
  }
};

const logFollowedProjects = async () => {
  const followsModrinth = await getFollowedProjectsModrinth();
  console.log(followsModrinth);
};

const logCollectionProjects = async () => {
  const followsModrinth = await getCollectionProjects('client');
  console.log(followsModrinth);
};

/**
 * Check if the module is being run directly
 * If run directly, then execute these functions
 *
 * this logs the mod name and mod id in the format defined in ModsConfig
 */
if (require.main === module) {
  logFollowedProjects();
  logCollectionProjects();
}

module.exports = {
  getCollectionProjects,
  logFollowedProjects,
  getFollowedProjectsModrinth,
};
