//#region Base version
document.addEventListener("DOMContentLoaded", async () => {
  const photoWrapper = document.querySelector(".img-wrapper");
  const photoBorder = document.querySelector(".img-border");
  const rootStyles = getComputedStyle(document.documentElement);
  const linkColor = rootStyles.getPropertyValue("--link").trim();
  const primaryColor = rootStyles.getPropertyValue("--primary").trim();

  photoWrapper.addEventListener("mouseover", () => {
    photoBorder.style.borderColor = `${linkColor}`;
  });

  photoWrapper.addEventListener("mouseout", () => {
    photoBorder.style.borderColor = `${primaryColor}`;
  });

  const username = "OguzGurv2";
  const token = "";

  try {
    const repos = await fetchPinnedRepos(username, token);
    displayRepos(username, repos);
  } catch (error) {
    console.error("Failed to fetch pinned repositories:", error);
  }

  //#region Fetch Pinned Repositories
  async function fetchPinnedRepos(username, token) {
    const query = `
    {
      user(login: "${username}") {
        pinnedItems(first: 4, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              primaryLanguage {
                name
                color
              }
              stargazers {
                totalCount
              }
              forks {
                totalCount
              }
            }
          }
        }
      }
    }`;

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const { data } = await response.json();
    return data.user.pinnedItems.nodes;
  }
  //#endregion

  //#region Display the Fetched Repositories in DOM Content
  function displayRepos(username, repos) {
    const container = document.getElementById("repo-container");
    container.innerHTML = "";

    repos.forEach((repo) => {
      const card = document.createElement("div");
      card.className = "repo-card";

      const title = document.createElement("h3");
      title.innerHTML = `<span>${username}</span>/${repo.name}`;
      card.appendChild(title);

      const description = document.createElement("p");
      description.className = "description";
      description.textContent = repo.description || "No description provided.";
      card.appendChild(description);

      const bot = document.createElement("div");
      bot.className = "card-bottom";

      const language = document.createElement("div");
      language.className = "language";
      if (repo.primaryLanguage) {
        language.innerHTML = `
                <span style="background-color: ${repo.primaryLanguage.color}; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                <span>${repo.primaryLanguage.name}</span>`;
      } else {
        language.innerHTML = `
                <span style="width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                <span>Unknown</span>`;
      }
      bot.appendChild(language);

      const stars = document.createElement("p");
      stars.className = "stars";
      stars.innerHTML = `<i class="fa-regular fa-star"></i> ${repo.stargazers.totalCount}`;
      bot.appendChild(stars);

      const forks = document.createElement("p");
      forks.className = "forks";
      forks.innerHTML = `<i class="fa-solid fa-code-fork"></i> ${repo.forks.totalCount}`;
      bot.appendChild(forks);

      card.appendChild(bot);
      container.appendChild(card);
    });
  }

  //#endregion

  const query = `
    {
      user(login: "${username}") {
        contributionsCollection(from: "2024-01-01T00:00:00Z", to: "2024-12-31T23:59:59Z") {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
              }
            }
          }
        }
      }
    }`;

  async function fetchContributions() {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    const { data } = await response.json();
    return data.user.contributionsCollection.contributionCalendar.weeks;
  }

  fetchContributions(username).then((data) => {
    const heatmapData = data
      .flatMap((week) => week.contributionDays)
      .map((day) => ({
        date: day.date,
        value: day.contributionCount,
      }));

    const cal = new CalHeatmap();
    cal.paint(
      {
        data: {
          source: heatmapData,
          x: "date",
          y: "value",
        },
        date: { start: new Date("2024-01-01") },
        range: 12,
        scale: {
          color: {
            type: "threshold",
            range: ["#ededed", "#4dd05a", "#37a446", "#166b34", "#14432a"],
            domain: [1, 3, 5, 7, 9],
          },
        },
        domain: {
          type: "month",
          gutter: 1,
          label: { text: "MMM", textAlign: "start", position: "bottom" },
        },
        subDomain: {
          type: "ghDay",
          radius: 2,
          width: 14,
          height: 14,
          gutter: 1,
        },
        itemSelector: "#contributions-heatmap",
      },
      [
        [
          Tooltip,
          {
            text: function (date, value, dayjsDate) {
              return (
                (value ? value : "No") +
                " contributions on " +
                dayjsDate.format("dddd, MMMM D, YYYY")
              );
            },
          },
        ],
        [
          CalendarLabel,
          {
            width: 30,
            textAlign: "start",
            text: () =>
              dayjs.weekdaysShort().map((d, i) => (i % 2 == 0 ? "" : d)),
            padding: [0, 0, 0, 0],
          },
        ],
      ]
    );
  });
});

//#endregion

//#region Object Oriented Version
class GitHubAPI {
  constructor(username, token) {
    this.username = username;
    this.token = token;
    this.apiUrl = "https://api.github.com/graphql";
  }

  async fetchPinnedRepos() {
    const query = `
      {
        user(login: "${this.username}") {
          pinnedItems(first: 4, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
                description
                owner {
                  login
                }
                primaryLanguage {
                  name
                  color
                }
                stargazers {
                  totalCount
                }
                forks {
                  totalCount
                }
              }
            }
          }
        }
      }`;

    return this._fetchFromGitHub(query).then(
      (data) => data.user.pinnedItems.nodes
    );
  }

  async fetchContributions(fromDate, toDate) {
    const query = `
      {
        user(login: "${this.username}") {
          contributionsCollection(from: "${fromDate}", to: "${toDate}") {
            contributionCalendar {
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }`;

    return this._fetchFromGitHub(query).then(
      (data) => data.user.contributionsCollection.contributionCalendar.weeks
    );
  }

  async _fetchFromGitHub(query) {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const result = await response.json();
    return result.data;
  }
}

class RepoDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  displayRepos(repos) {
    this.container.innerHTML = "";

    repos.forEach((repo) => {
      const card = document.createElement("div");
      card.className = "repo-card";

      card.appendChild(this._createTitle(repo));
      card.appendChild(this._createDescription(repo));
      card.appendChild(this._createCardBottom(repo));

      this.container.appendChild(card);
    });
  }

  _createTitle(repo) {
    const title = document.createElement("h3");
    title.innerHTML = `<span>${repo.owner.login}</span>/${repo.name}`;
    return title;
  }

  _createDescription(repo) {
    const description = document.createElement("p");
    description.className = "description";
    description.textContent = repo.description || "No description provided.";
    return description;
  }

  _createCardBottom(repo) {
    const bot = document.createElement("div");
    bot.className = "card-bottom";

    bot.appendChild(this._createLanguage(repo));
    bot.appendChild(this._createStars(repo));
    bot.appendChild(this._createForks(repo));

    return bot;
  }

  _createLanguage(repo) {
    const language = document.createElement("div");
    language.className = "language";
    const color = repo.primaryLanguage
      ? repo.primaryLanguage.color
      : "transparent";
    const name = repo.primaryLanguage ? repo.primaryLanguage.name : "Unknown";
    language.innerHTML = `<span style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                            <span>${name}</span>`;
    return language;
  }

  _createStars(repo) {
    const stars = document.createElement("p");
    stars.className = "stars";
    stars.innerHTML = `<i class="fa-regular fa-star"></i> ${repo.stargazers.totalCount}`;
    return stars;
  }

  _createForks(repo) {
    const forks = document.createElement("p");
    forks.className = "forks";
    forks.innerHTML = `<i class="fa-solid fa-code-fork"></i> ${repo.forks.totalCount}`;
    return forks;
  }
}

class ProfileImage {
  constructor(wrapperSelector, borderSelector, linkColor, primaryColor) {
    this.photoWrapper = document.querySelector(wrapperSelector);
    this.photoBorder = document.querySelector(borderSelector);
    this.linkColor = linkColor;
    this.primaryColor = primaryColor;
  }

  init() {
    this.photoWrapper.addEventListener("mouseover", () => {
      this.photoBorder.style.borderColor = this.linkColor;
    });

    this.photoWrapper.addEventListener("mouseout", () => {
      this.photoBorder.style.borderColor = this.primaryColor;
    });
  }
}

class ContributionsHeatmap {
  constructor(containerId) {
    this.containerId = containerId;
  }

  async render(data) {
    const heatmapData = data
      .flatMap((week) => week.contributionDays)
      .map((day) => ({ date: day.date, value: day.contributionCount }));

    const cal = new CalHeatmap();
    cal.paint(
      {
        data: {
          source: heatmapData,
          x: "date",
          y: "value",
        },
        date: { start: new Date("2024-01-01") },
        range: 12,
        scale: {
          color: {
            type: "threshold",
            range: ["#ededed", "#4dd05a", "#37a446", "#166b34", "#14432a"],
            domain: [1, 3, 5, 7, 9],
          },
        },
        domain: {
          type: "month",
          gutter: 1,
          label: { text: "MMM", textAlign: "start", position: "bottom" },
        },
        subDomain: {
          type: "ghDay",
          radius: 2,
          width: 11,
          height: 11,
          gutter: 1,
        },
        itemSelector: this.containerId,
      },
      [
        [
          Tooltip,
          {
            text: (date, value, dayjsDate) =>
              `${value || "No"} contributions on ${dayjsDate.format(
                "dddd, MMMM D, YYYY"
              )}`,
          },
        ],
        [
          CalendarLabel,
          {
            width: 30,
            textAlign: "start",
            text: () =>
              dayjs.weekdaysShort().map((d, i) => (i % 2 === 0 ? "" : d)),
            padding: [0, 0, 0, 0],
          },
        ],
      ]
    );
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const rootStyles = getComputedStyle(document.documentElement);
  const linkColor = rootStyles.getPropertyValue("--link").trim();
  const primaryColor = rootStyles.getPropertyValue("--primary").trim();

  const profileImage = new ProfileImage(
    ".img-wrapper",
    ".img-border",
    linkColor,
    primaryColor
  );
  profileImage.init();

  const username = "OguzGurv2";
  const token = "";

  const githubAPI = new GitHubAPI(username, token);
  const repoDisplay = new RepoDisplay("repo-container");

  try {
    const repos = await githubAPI.fetchPinnedRepos();
    repoDisplay.displayRepos(repos);
  } catch (error) {
    console.error("Failed to fetch pinned repositories:", error);
  }

  const contributionsHeatmap = new ContributionsHeatmap(
    "#contributions-heatmap"
  );
  const fromDate = "2024-01-01T00:00:00Z";
  const toDate = "2024-12-31T23:59:59Z";

  try {
    const contributions = await githubAPI.fetchContributions(fromDate, toDate);
    contributionsHeatmap.render(contributions);
  } catch (error) {
    console.error("Failed to fetch contributions:", error);
  }
});
//#endregion
// 500'e tamamlamak için line. Hangi versiyonu kullanmak istersen ikisi de çalışıyor.
