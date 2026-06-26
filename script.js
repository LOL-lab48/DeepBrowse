let data;
let historyStack = [];
let path = [];
let flatItems = [];

let user = localStorage.getItem("user") || null;
let favourites = JSON.parse(localStorage.getItem("favs_" + user) || "[]");
let topicScores = JSON.parse(localStorage.getItem("scores_" + user) || "{}");

let initialized = false;

/* -------------------------
   LOGIN SYSTEM
--------------------------*/
const popup = document.getElementById("loginPopup");

document.getElementById("accountBtn").onclick = () => {
  popup.classList.remove("hidden");
};

document.getElementById("closeLogin").onclick = () => {
  popup.classList.add("hidden");
};

document.getElementById("loginBtn").onclick = () => {
  const name = document.getElementById("username").value.trim();
  if (!name) return;

  user = name;
  localStorage.setItem("user", user);

  favourites = JSON.parse(localStorage.getItem("favs_" + user) || "[]");
  topicScores = JSON.parse(localStorage.getItem("scores_" + user) || "{}");

  popup.classList.add("hidden");
  alert("Logged in as " + user);

  showNode(data);
};

/* -------------------------
   DATA LOAD
--------------------------*/
fetch("data.json")
  .then(r => r.json())
  .then(j => {
    data = j;
    init();
  });

function init() {
  if (initialized) return;
  initialized = true;

  flattenData(data, []);
  showNode(data);
}

/* -------------------------
   CLICK TRACKING (AI)
--------------------------*/
function trackClick(name, p) {
  topicScores[name] = (topicScores[name] || 0) + 5;

  if (user) {
    localStorage.setItem("scores_" + user, JSON.stringify(topicScores));
  }
}

/* -------------------------
   FLATTEN
--------------------------*/
function flattenData(node, p) {
  flatItems.push({
    type: "topic",
    name: node.name,
    node,
    path: p
  });

  if (node.children) {
    node.children.forEach(c => flattenData(c, [...p, node.name]));
  }

  if (node.links) {
    node.links.forEach(l => {
      flatItems.push({
        type: "link",
        ...l,
        path: [...p, node.name]
      });
    });
  }
}

/* -------------------------
   AI RECOMMENDATIONS
--------------------------*/
function getAI() {
  const top = Object.entries(topicScores)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(x=>x[0]);

  let res = [];

  function scan(n){
    if(top.includes(n.name)) res.push(n);
    if(n.children) n.children.forEach(scan);
  }

  scan(data);
  return res;
}

/* -------------------------
   SHOW NODE
--------------------------*/
function showNode(node) {
  const content = document.getElementById("content");
  const sidebar = document.getElementById("sidebar");

  content.innerHTML = "";
  sidebar.innerHTML = "";

  document.getElementById("breadcrumbs").innerText =
    ["Home", ...path].join(" > ");

  /* SIDEBAR */
  if (data.children) {
    data.children.forEach(c => {
      const b = document.createElement("button");
      b.innerText = c.name;

      b.onclick = () => {
        trackClick(c.name, path);
        historyStack = [data];
        path = [c.name];
        showNode(c);
      };

      sidebar.appendChild(b);
    });
  }

  /* CHILDREN */
  if (node.children) {
    node.children.forEach(c => {
      const d = document.createElement("div");
      d.className = "card";
      d.textContent = c.name;

      d.onclick = () => {
        trackClick(c.name, path);
        historyStack.push(node);
        path.push(c.name);
        showNode(c);
      };

      content.appendChild(d);
    });
  }

  /* LINKS */
  if (node.links) {
    node.links.forEach(l => {
      const d = document.createElement("div");
      d.className = "card";
      d.innerHTML = `<a href="${l.url}" target="_blank">${l.title}</a>`;
      content.appendChild(d);
    });
  }

  /* AI */
  const ai = getAI();
  if (ai.length) {
    const box = document.createElement("div");
    box.innerHTML = "<h3>🧠 Recommended</h3>";

    ai.forEach(n => {
      const d = document.createElement("div");
      d.className = "card";
      d.textContent = n.name;

      d.onclick = () => showNode(n);

      box.appendChild(d);
    });

    content.appendChild(box);
  }

  /* BACK */
  if (historyStack.length) {
    const b = document.createElement("button");
    b.innerText = "⬅ Back";
    b.onclick = () => {
      showNode(historyStack.pop());
      path.pop();
    };
    content.appendChild(b);
  }

  /* LOGIN PROMPT (soft reminder) */
  if (!user) {
    const warn = document.createElement("div");
    warn.className = "card";
    warn.innerHTML = `
      ⭐ Login to save favourites & sync progress
      <button onclick="document.getElementById('loginPopup').classList.remove('hidden')">
        Login
      </button>
      <button onclick="this.parentElement.remove()">✖</button>
    `;
    content.appendChild(warn);
  }
}
