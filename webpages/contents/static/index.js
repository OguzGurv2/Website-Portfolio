//#region Object Oriented Version
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

  async fetchUserRepositories() {
    const url = `https://api.github.com/users/${this.username}/repos`;
    
    const headers = {
      'Authorization': `token ${this.token}`,
    };

    try {
      const response = await axios.get(url, { headers });
      const repos = response.data.map(repo => repo.full_name);
      return repos;
    } catch (error) {
      console.error(`Error fetching repositories for ${this.username}: ${error.message}`);
      return [];
    }
  }

  async fetchCodeFiles(owner, repo, branch = 'main') {
    const rootUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

    const headers = {
      'Authorization': `token ${this.token}`,
    };

    try {
      const response = await axios.get(rootUrl, { headers });
      const files = response.data.tree
        .filter(item => item.type === 'blob' && /\.(mjs|js|css|html|php)$/.test(item.path))
        .map(item => ({ path: item.path, extension: item.path.split('.').pop().toLowerCase() }));

      const fileRequests = files.map(async file => {
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`;
        const response = await axios.get(url, { headers });
        const content = atob(response.data.content);
        file.loc = content.split('\n').length; 
        return file;
      });

      return await Promise.all(fileRequests);
    } catch (error) {
      console.error(`Error fetching code files for ${owner}/${repo}/${branch}: ${error.message}`);
      return [];
    }
  }

  async calculateLinesOfCodeForUser(username) {
    const repositories = await this.fetchUserRepositories(username);
    const languageInfo = [];
  
    const extensionMappings = {
      js: { language: 'JavaScript', color: '#f1e05a' },
      mjs: { language: 'JavaScript', color: '#f1e05a' },
      css: { language: 'CSS', color: '#563d7c' },
      html: { language: 'HTML', color: '#e34c26' },
      php: { language: 'PHP', color: '#4F5D95' },
    };
  
    await Promise.all(repositories.map(async repoFullName => {
      const [owner, repo] = repoFullName.split('/');
      const files = await this.fetchCodeFiles(owner, repo);
      
      files.forEach(file => {
        const { extension, loc } = file;
        const mappedLanguage = extensionMappings[extension.toLowerCase()]; 
        if (mappedLanguage) {
          const existingLanguage = languageInfo.find(lang => lang.language === mappedLanguage.language);
          if (!existingLanguage) {
            languageInfo.push({
              language: mappedLanguage.language,
              color: mappedLanguage.color || '#000000', 
              LOC: loc
            });
          } else {
            existingLanguage.LOC += loc;
          }
        }
      });
    }));
    return languageInfo;
  }

  async _fetchFromGitHub(query) {
    try {
        const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${this.token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`GitHub API response error: ${response.status} ${response.statusText} - ${errorText}`);
            throw new Error(`Network response was not ok: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const result = await response.json();
        if (result.errors) {
            console.error("GitHub API returned errors:", result.errors);
            throw new Error(`GitHub API errors: ${JSON.stringify(result.errors)}`);
        }

        return result.data;
    } catch (error) {
        console.error("Failed to fetch from GitHub:", error);
        throw error;
    }
  }
}

class ContributionsHeatmap {
  constructor(containerId) {
    this.containerId = containerId;
    this.subDomainSize = this.getSubdomainSize();
  }

  getSubdomainSize() {
    console.log(document.documentElement.clientWidth)
    if (document.documentElement.clientWidth < 480) {
      return 5.5;  
    } else {
      return 11; 
    }
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
          width: this.subDomainSize,
          height: this.subDomainSize,
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

class RepoDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  displayRepos(repos) {
    this.container.innerHTML = "";
    repos.forEach((repo) => {
      const card = document.createElement("a");
      card.className = "repo-card";
      card.href = `https://github.com/${repo.owner.login}/${repo.name}`;
      
      card.appendChild(this._createTitle(repo));
      card.appendChild(this._createDescription(repo));
      card.appendChild(this._createCardBottom(repo));
      this.container.appendChild(card);
    });
    this.cards = this.container.querySelectorAll('.repo-card')
    this.adjustHeight(this.cards);
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

  adjustHeight(cards) {
    let maxHeight = 0;
    cards.forEach(card => {
      const cardHeight = parseFloat(window.getComputedStyle(card).getPropertyValue("height"));
      if (cardHeight > maxHeight) {
        maxHeight = cardHeight;
      }
    });
    cards.forEach(card => {
      card.style.height = `${maxHeight}px`
    });
  }
}

class LanguageDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render(languages) {
    this.container.innerHTML = "";

    languages.forEach( language => {
      const div = document.createElement("div");
      div.className = "language-div";
      div.appendChild(this._createLanguage(language.color, language.language));
      div.appendChild(this._createLOC(language.LOC));
      this.container.appendChild(div);
    });
    const languagePieChart = new LanguagePieChart("language-diagram");
    languagePieChart.render(languages);
  }

  _createLanguage(languageColor, languageName) {
    const language = document.createElement("div");
    language.className = "language";
    const color = languageColor
      ? languageColor
      : "transparent";
    const name = languageName ? languageName : "Unknown";
    language.innerHTML = `<span style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
                            <span>${name}</span>`;
    return language;
  }

  _createLOC(languageLOC) {
    const loc = document.createElement("div");
    loc.className = "loc";
    loc.innerHTML = `<span>${languageLOC}</span>`;
    return loc;
  }
}

class LanguagePieChart {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  async render(languages) {
    const languageData = {
      labels: [],
      datasets: [{
        label: 'LOC',
        data: [],
        backgroundColor: [],
      }]
    }

    languages.forEach((language) => {
      languageData.labels.push(language.language);
      languageData.datasets[0].data.push(language.LOC); 
      languageData.datasets[0].backgroundColor.push(language.color);
    });

    const ctx = document.getElementById('myChart');

    new Chart(ctx, {
      type: 'doughnut',
      data: languageData,
      options: {
        plugins: {
          legend: {
            display: false  
          },
        },
        borderWidth: 0,
        animation: false
      }
    });
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

  const contributionsHeatmap = new ContributionsHeatmap("#contributions-heatmap");
  const fromDate = "2024-01-01T00:00:00Z";
  const toDate = "2024-12-31T23:59:59Z";

  try {
    const contributions = await githubAPI.fetchContributions(fromDate, toDate);
    contributionsHeatmap.render(contributions);
  } catch (error) {
    console.error("Failed to fetch contributions:", error);
  }

  const languageDisplay = new LanguageDisplay("language-container");
  try {
    const languages = await githubAPI.calculateLinesOfCodeForUser();
    languageDisplay.render(languages);
  } catch (error) {
    console.error("Failed to fetch languages:", error);
  }

});

const inputs = document.querySelectorAll("input");
const labels = document.querySelectorAll("label");
const submit = document.querySelector("#submit");

class Input {
  constructor(node) {
    this.node = node;
    this.label = this.findLabel();
    this.checked = false;
    this.labelAnim();
    this.checkValue();
  }
  findLabel() {
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].htmlFor === this.node.id) {
        return labels[i];
      };
    };
  }
  labelAnim() {
    this.node.addEventListener("input", () => {
      if (this.node.value.length > 0) {
        this.label.classList.remove('labelAnimDown');
        this.label.classList.add('labelAnimUp');
      } else {
        this.label.classList.remove('labelAnimUp');
        this.label.classList.add('labelAnimDown');
      };
    });
  }
  checkValue() {
    if (this.node.id == "name") {
      this.node.addEventListener("input", () => {
        if (this.node.value.length >= 3) {
          this.checked = true;
        } else {
          this.checked = false;
        }
      });
    } else if (this.node.id == "email") {
      this.node.addEventListener("input", () => {
        if (this.node.value.includes("@")) {
          this.checked = true;
        } else {
          this.checked = false;
        }
      });
    } else {
      this.node.addEventListener("input", () => {
        if (this.node.value.length >= 0) {
          this.checked = true;
        } else {
          this.checked = false;
        }
      });
    }
  }
}

let inputInstances = [];

inputs.forEach(input => {
  const instance = new Input(input);
  inputInstances.push(instance);
});

class ContactForm {
  constructor() {
    this.node = document.getElementById("contact-form");
    inputs.forEach(input => {
      input.addEventListener("input", () => {
        this.checkInputs();
      });
    });
  }
  checkInputs() {
    for (let i = 0; i < inputs.length; i++) {
      if (!inputInstances[i].checked) {
        submit.disabled = true;
        return;
      }
    }
    submit.disabled = false;
  }
}

new ContactForm();

const message = document.querySelector("#message");

submit.addEventListener("click", () => {
  inputs.forEach(input => {
    let label;
    for (let i = 0; i < labels.length; i++) {
      if (labels[i].htmlFor === input.id) {
        label = labels[i];
      }
    }
    label.classList.remove('labelAnimUp');
    label.classList.add('labelAnimDown');
    label.style.display = "none";
    input.value = "";
  });
  message.classList.add("active");
  submit.disabled = true;
  setInterval(() => {
    message.classList.remove("active");
    message.classList.add("close");
  }, 1500);
});

//#endregion
