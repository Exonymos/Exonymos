const fs = require("fs");
const https = require("https");

const username = process.env.USERNAME;
const excludedRepos = ["Exonymos"]; // Repos to exclude

const options = {
  hostname: "api.github.com",
  path: `/users/${username}/repos?sort=updated&per_page=3`,
  method: "GET",
  headers: {
    "User-Agent": username,
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
  },
};

function fetchRepos(callback) {
  https
    .get(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const repos = JSON.parse(data);
        callback(repos);
      });
    })
    .on("error", (e) => {
      console.error(e);
    });
}

function generateMarkdown(repos) {
  let projectsMarkdown = "";
  const filteredRepos = repos
    .filter((repo) => !excludedRepos.includes(repo.name))
    .slice(0, 3);

  filteredRepos.forEach((repo) => {
    projectsMarkdown += `### 🌟 [${repo.name}](${repo.html_url})\n`;
    projectsMarkdown += `- 🔗 **[GitHub Repo](${repo.html_url})** - ${
      repo.description || "No description provided"
    }\n\n`;
  });

  return projectsMarkdown;
}

function updateReadme(markdown) {
  const readmePath = "./README.md";
  let readmeContent = fs.readFileSync(readmePath, "utf8");

  const startMarker = "<!-- LATEST_PROJECTS:START -->";
  const endMarker = "<!-- LATEST_PROJECTS:END -->";
  const regex = new RegExp(`${startMarker}[\\s\\S]*${endMarker}`, "m");

  const newSection = `${startMarker}\n${markdown}${endMarker}`;
  readmeContent = readmeContent.replace(regex, newSection);

  fs.writeFileSync(readmePath, readmeContent, "utf8");
}

fetchRepos((repos) => {
  const markdown = generateMarkdown(repos);
  updateReadme(markdown);
});
