const fs = require("fs");

const username = process.env.USERNAME;
const token = process.env.GITHUB_TOKEN;
const EXCLUDED_REPOS = new Set(["Exonymos"]);
const MAX_PROJECTS = 3;

async function fetchRepos() {
  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=pushed&per_page=20`,
    {
      headers: {
        "User-Agent": username,
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (!Array.isArray(data)) {
    throw new Error(`Unexpected API response: ${JSON.stringify(data)}`);
  }

  return data;
}
function generateMarkdown(repos) {
  const filtered = repos
    .filter((repo) => !repo.fork && !EXCLUDED_REPOS.has(repo.name))
    .slice(0, MAX_PROJECTS);

  if (filtered.length === 0) {
    return "_No recent projects found._\n\n";
  }

  return filtered
    .map((repo) => {
      const meta = [
        repo.stargazers_count > 0 ? `⭐ ${repo.stargazers_count}` : null,
        repo.language || null,
      ]
        .filter(Boolean)
        .join(" · ");

      const desc = repo.description || "No description provided.";
      const metaLine = meta ? `- ${meta}\n` : "";

      return (
        `### 🌟 [${repo.name}](${repo.html_url})\n` +
        `${metaLine}` +
        `- 🔗 **[GitHub Repo](${repo.html_url})** — ${desc}\n`
      );
    })
    .join("\n");
}

function updateReadme(markdown) {
  const readmePath = "./README.md";
  const content = fs.readFileSync(readmePath, "utf8");

  const START = "<!-- LATEST_PROJECTS:START -->";
  const END = "<!-- LATEST_PROJECTS:END -->";
  const regex = new RegExp(`${START}[\\s\\S]*?${END}`, "m");

  if (!regex.test(content)) {
    throw new Error("Could not find LATEST_PROJECTS markers in README.md");
  }

  const updated = content.replace(regex, `${START}\n${markdown}${END}`);
  fs.writeFileSync(readmePath, updated, "utf8");
  console.log("README.md updated successfully.");
}

(async () => {
  try {
    const repos = await fetchRepos();
    const markdown = generateMarkdown(repos);
    updateReadme(markdown);
  } catch (err) {
    console.error("Failed to update README:", err.message);
    process.exit(1);
  }
})();
