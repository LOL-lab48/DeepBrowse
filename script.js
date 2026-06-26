let data;
let historyStack = [];
let path = [];
let flatItems = [];
let favourites = JSON.parse(localStorage.getItem("favs") || "[]");
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
   AUTO FALLBACK GENERATOR
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
              },
              {
                name: "Dribbling",
                links: [
                  {
                    title: "Dribbling Skills",
                    url: "https://www.youtube.com/results?search_query=soccer+dribbling+drills",
                    desc: "1v1 control training"
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
                desc: "Start coding fundamentals"
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
   FLATTEN TREE
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
   SHOW NODE
--------------------------*/
function showNode(node) {
  const content = document.getElementById("content");
  const sidebar = document.getElementById("sidebar");

  content.innerHTML = "";
  sidebar.innerHTML = "";

  updateBreadcrumbs();

  /* SIDEBAR ROOT */
  if (data.children) {
    data.children.forEach(child => {
      const btn = document.createElement("button");
      btn.innerText = (icons[child.name] || "📁") + " " + child.name;

      btn.onclick = () => {
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

  /* RELATED TOPICS (ENGINE FEATURE) */
  const related = getRelatedTopics(node);
  if (related.length) {
    const box = document.createElement("div");
    box.innerHTML = "<h3>🔥 Related Topics</h3>";

    related.forEach(r => {
      const div = document.createElement("div");
      div.className = "card";
      div.textContent = (icons[r.name] || "📁") + " " + r.name;

      div.onclick = () => {
        historyStack.push(node);
        path.push(r.name);
        showNode(r);
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
    <div class="desc">📍 ${(link.path || path).join(" > ")}</div>
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
   SEARCH ENGINE
--------------------------*/
document.addEventListener("input", e => {
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

/* -------------------------
   RELATED TOPICS ENGINE
--------------------------*/
function getRelatedTopics(currentNode) {
  if (!currentNode || !data) return [];

  let related = [];

  function scan(node) {
    if (!node.children) return;

    node.children.forEach(child => {
      if (child.name !== currentNode.name) related.push(child);
      scan(child);
    });
  }

  scan(data);

  return related.slice(0, 6);
}
