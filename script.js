let data;
let historyStack = [];
let path = [];
let flatItems = [];

let favourites = JSON.parse(localStorage.getItem("favs") || "[]");
let userClicks = JSON.parse(localStorage.getItem("clicks") || "[]");
let topicScores = JSON.parse(localStorage.getItem("scores") || "{}");

let initialized = false;

/* ICONS */
const icons = {
  Soccer: "⚽",
  Tech: "💻",
  Learning: "📚",
  Training: "🏋️",
  Coding: "👨‍💻",
  Science: "🔬",
  Goalkeeping: "🧤"
};

/* -------------------------
   FALLBACK DATA GENERATOR
--------------------------*/
function generateFallbackData() {
  return {
    name: "Home",
    children: [
      {
        name: "Soccer",
        children: [
          {
            name: "Training",
            children: [
              {
                name: "Finishing",
                links: [
                  {
                    title: "Finishing Drills",
                    url: "https://www.youtube.com/results?search_query=striker+finishing+drills",
                    desc: "Striker shooting practice"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        name: "Tech",
        children: [
          {
            name: "Programming",
            links: [
              {
                title: "Learn Programming",
                url: "https://www.youtube.com/results?search_query=learn+programming+basics",
                desc: "Coding fundamentals"
              }
            ]
          }
        ]
      }
    ]
  };
}

/* -------------------------
   LOAD DATA
--------------------------*/
fetch("data.json")
  .then(res => res.json())
  .then(json => {
    data = json;
    init();
  })
  .catch(() => {
    data = generateFallbackData();
    init();
  });

function init() {
  if (initialized) return;
  initialized = true;

  flattenData(data, []);
  showNode(data);
}

/* -------------------------
   CLICK TRACKING (AI CORE)
--------------------------*/
function trackClick(name, currentPath) {
  userClicks.push({
    name,
    path: currentPath,
    time: Date.now()
  });

  topicScores[name] = (topicScores[name] || 0) + 5;

  localStorage.setItem("clicks", JSON.stringify(userClicks));
  localStorage.setItem("scores", JSON.stringify(topicScores));
}

/* -------------------------
   FLATTEN DATA
--------------------------*/
function flattenData(node, currentPath) {
  flatItems.push({
    type: "topic",
    name: node.name,
    node,
    path: currentPath
  });

  if (node.links) {
    node.links.forEach(link => {
      flatItems.push({
        type: "link",
        ...link,
        path: [...currentPath, node.name]
      });
    });
  }

  if (node.children) {
    node.children.forEach(child => {
      flattenData(child, [...currentPath, node.name]);
    });
  }
}

/* -------------------------
   AI RECOMMENDATIONS
--------------------------*/
function getAIRecommendations() {
  const sorted = Object.entries(topicScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name]) => name);

  let results = [];

  function search(node) {
    if (sorted.includes(node.name)) {
      results.push(node);
    }

    if (node.children) {
      node.children.forEach(search);
    }
  }

  search(data);

  return results;
}

/* -------------------------
   SHOW NODE
--------------------------*/
function showNode(node) {
  const content = document.getElementById("content");
  const sidebar = document.getElementById("sidebar");

  content.innerHTML = "";
  sidebar.innerHTML = "";

  updateBreadcrumbs();

  /* SIDEBAR */
  if (data.children) {
    data.children.forEach(child => {
      const btn = document.createElement("button");
      btn.innerText = (icons[child.name] || "📁") + " " + child.name;

      btn.onclick = () => {
        trackClick(child.name, [...path, node.name]);

        historyStack = [data];
        path = [child.name];
        showNode(child);
      };

      sidebar.appendChild(btn);
    });
  }

  /* SUBTOPICS */
  if (node.children) {
    node.children.forEach(child => {
      const div = document.createElement("div");
      div.className = "card";
      div.innerHTML = `<strong>${icons[child.name] || "📁"} ${child.name}</strong>`;

      div.onclick = () => {
        trackClick(child.name, [...path, node.name]);

        historyStack.push(node);
        path.push(child.name);
        showNode(child);
      };

      content.appendChild(div);
    });
  }

  /* LINKS */
  if (node.links) {
    node.links.forEach(link => {
      content.appendChild(createLinkCard(link));
    });
  }

  /* AI RECOMMENDATIONS */
  const ai = getAIRecommendations();

  if (ai.length > 0) {
    const box = document.createElement("div");
    box.innerHTML = "<h3>🧠 Recommended For You</h3>";

    ai.forEach(n => {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = "⭐ " + n.name;

      div.onclick = () => {
        historyStack.push(node);
        path.push(n.name);
        showNode(n);
      };

      box.appendChild(div);
    });

    content.appendChild(box);
  }

  /* BACK BUTTON */
  if (historyStack.length > 0) {
    const back = document.createElement("button");
    back.className = "back-btn";
    back.innerText = "⬅ Back";

    back.onclick = () => {
      showNode(historyStack.pop());
      path.pop();
    };

    content.appendChild(back);
  }

  /* FAV BUTTON */
  const favBtn = document.createElement("button");
  favBtn.className = "back-btn";
  favBtn.innerText = "⭐ View Favourites";
  favBtn.onclick = showFavourites;

  content.appendChild(favBtn);
}

/* -------------------------
   LINK CARD
--------------------------*/
function createLinkCard(link) {
  const div = document.createElement("div");
  div.className = "card link";

  const isFav = favourites.find(f => f.url === link.url);

  div.innerHTML = `
    <a href="${link.url}" target="_blank">${link.title}</a>
    <div class="desc">${link.desc}</div>
    <button class="fav-btn">${isFav ? "★ Remove" : "☆ Favourite"}</button>
  `;

  div.querySelector(".fav-btn").onclick = (e) => {
    e.stopPropagation();

    if (isFav) {
      favourites = favourites.filter(f => f.url !== link.url);
    } else {
      favourites.push(link);
    }

    localStorage.setItem("favs", JSON.stringify(favourites));
    showNode(data);
  };

  return div;
}

/* -------------------------
   FAVOURITES
--------------------------*/
function showFavourites() {
  const content = document.getElementById("content");
  content.innerHTML = "<h2>⭐ Favourites</h2>";

  favourites.forEach(link => {
    content.appendChild(createLinkCard(link));
  });
}

/* -------------------------
   SEARCH
--------------------------*/
document.addEventListener("input", (e) => {
  if (e.target.id !== "search") return;

  const term = e.target.value.toLowerCase();
  const content = document.getElementById("content");

  if (!term) {
    showNode(data);
    return;
  }

  content.innerHTML = "";

  const results = flatItems.filter(item =>
    item.name?.toLowerCase().includes(term) ||
    item.title?.toLowerCase().includes(term) ||
    item.desc?.toLowerCase().includes(term)
  );

  results.forEach(item => {
    if (item.type === "topic") {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <strong>${icons[item.name] || "📁"} ${item.name}</strong>
        <div class="desc">📍 ${item.path.join(" > ")}</div>
      `;

      div.onclick = () => showNode(item.node);

      content.appendChild(div);
    } else {
      content.appendChild(createLinkCard(item));
    }
  });
});

/* -------------------------
   BREADCRUMBS
--------------------------*/
function updateBreadcrumbs() {
  document.getElementById("breadcrumbs").innerText =
    ["Home", ...path].join(" > ");
}
