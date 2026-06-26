let data;
let historyStack = [];
let path = [];
let flatItems = [];
let favourites = JSON.parse(localStorage.getItem("favs") || "[]");

// ICONS
const icons = {
  "Soccer": "⚽",
  "Tech": "💻",
  "Learning": "📚",
  "Training": "🏋️",
  "Coding": "👨‍💻",
  "Science": "🔬",
  "Goalkeeping": "🧤"
};

// LOAD DATA
fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    flattenData(data, []);
    showNode(data);
  });

// FLATTEN (topics + links)
function flattenData(node, currentPath) {
  flatItems.push({
    type: "topic",
    name: node.name,
    node: node,
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

// SHOW NODE
function showNode(node) {
  const content = document.getElementById('content');
  const sidebar = document.getElementById('sidebar');

  content.innerHTML = "";
  sidebar.innerHTML = "";

  updateBreadcrumbs();

  // SIDEBAR
  if (data.children) {
    data.children.forEach(child => {
      const btn = document.createElement('button');
      btn.innerText = (icons[child.name] || "📁") + " " + child.name;

      btn.onclick = () => {
        historyStack = [data];
        path = [child.name];
        showNode(child);
      };

      sidebar.appendChild(btn);
    });
  }

  // SUBTOPICS
  if (node.children) {
    node.children.forEach(child => {
      const div = document.createElement('div');
      div.className = 'card';

      div.innerHTML = `<strong>${icons[child.name] || "📁"} ${child.name}</strong>`;

      div.onclick = () => {
        historyStack.push(node);
        path.push(child.name);
        showNode(child);
      };

      content.appendChild(div);
    });
  }

  // LINKS
  if (node.links) {
    node.links.forEach(link => {
      const div = createLinkCard(link);
      content.appendChild(div);
    });
  }

  // BACK BUTTON
  if (historyStack.length > 0) {
    const back = document.createElement('button');
    back.className = 'back-btn';
    back.innerText = "⬅ Back";

    back.onclick = () => {
      showNode(historyStack.pop());
      path.pop();
    };

    content.appendChild(back);
  }

  // FAV BUTTON
  const favBtn = document.createElement('button');
  favBtn.className = 'back-btn';
  favBtn.innerText = "⭐ View Favourites";

  favBtn.onclick = showFavourites;
  content.appendChild(favBtn);
}

// CREATE LINK CARD
function createLinkCard(link) {
  const div = document.createElement('div');
  div.className = 'card link';

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

// SHOW FAVOURITES
function showFavourites() {
  const content = document.getElementById('content');
  content.innerHTML = "<h2>⭐ Favourites</h2>";

  favourites.forEach(link => {
    const div = createLinkCard(link);
    content.appendChild(div);
  });
}

// SEARCH (topics + links)
document.addEventListener("input", (e) => {
  if (e.target.id === "search") {
    const term = e.target.value.toLowerCase();
    const content = document.getElementById('content');

    if (!term) {
      showNode(data);
      return;
    }

    content.innerHTML = "";

    const results = flatItems.filter(item => {
      if (item.type === "topic") {
        return item.name.toLowerCase().includes(term);
      } else {
        return item.title.toLowerCase().includes(term) ||
               item.desc.toLowerCase().includes(term);
      }
    });

    results.forEach(item => {
      if (item.type === "topic") {
        const div = document.createElement('div');
        div.className = 'card';

        div.innerHTML = `
          <strong>${icons[item.name] || "📁"} ${item.name}</strong>
          <div class="desc">📍 ${item.path.join(" > ")}</div>
        `;

        div.onclick = () => showNode(item.node);

        content.appendChild(div);
      } else {
        const div = createLinkCard(item);
        content.appendChild(div);
      }
    });
  }
});

// BREADCRUMBS
function updateBreadcrumbs() {
  document.getElementById('breadcrumbs').innerText =
    ["Home", ...path].join(" > ");
}
