const fs = require('fs');
const https = require('https');

const username = process.env.USERNAME;
const options = {
  hostname: 'api.github.com',
  path: `/users/${username}/repos?sort=updated&per_page=3`,
  method: 'GET',
  headers: {
    'User-Agent': username,
    'Authorization': `token ${process.env.GITHUB_TOKEN}`,
  },
};

https.get(options, (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const repos = JSON.parse(data);
    let projectsMarkdown = '';
    repos.forEach(repo => {
      projectsMarkdown += `### [${repo.name}](${repo.html_url})\n`;
      projectsMarkdown += `- 🔗 **[GitHub Repo](${repo.html_url})** - ${repo.description || 'No description provided'}\n\n`;
    });
    
    const readmePath = './README.md';
    let readmeContent = fs.readFileSync(readmePath, 'utf8');

    const startMarker = '<!-- LATEST_PROJECTS:START -->';
    const endMarker = '<!-- LATEST_PROJECTS:END -->';
    const regex = new RegExp(`${startMarker}[\\s\\S]*${endMarker}`, 'm');

    const newSection = `${startMarker}\n${projectsMarkdown}${endMarker}`;
    readmeContent = readmeContent.replace(regex, newSection);

    fs.writeFileSync(readmePath, readmeContent, 'utf8');
  });
}).on('error', (e) => {
  console.error(e);
});
