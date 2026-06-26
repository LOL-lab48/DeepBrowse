let data;
let historyStack = [];
let path = [];
let flatLinks = [];

// Load JSON
fetch('data.json')
.then(res => res.json())
.then(json => {
data = json;
flattenData(data, []);
showNode(data);
});

// Flatten all links for search
function flattenData(node, currentPath) {
if (node.links) {
node.links.forEach(link => {
flatLinks.push({
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

function showNode(node) {
const content = document.getElementById('content');
const sidebar = document.getElementById('sidebar');

content.innerHTML = "";
sidebar.innerHTML = "";

updateBreadcrumbs();

// Sidebar (main topics)
if (data.children) {
data.children.forEach(child => {
const btn = document.createElement('button');
btn.innerText = child.name;

```
  btn.onclick = () => {
    historyStack = [data];
    path = [child.name];
    showNode(child);
  };

  sidebar.appendChild(btn);
});
```

}

// Subtopics
if (node.children) {
node.children.forEach(child => {
const div = document.createElement('div');
div.className = 'card';
div.innerText = child.name;

```
  div.onclick = () => {
    historyStack.push(node);
    path.push(child.name);
    showNode(child);
  };

  content.appendChild(div);
});
```

}

// Links
if (node.links) {
node.links.forEach(link => {
const div = document.createElement('div');
div.className = 'card link';

```
  div.innerHTML = `
    <a href="${link.url}" target="_blank">${link.title}</a>
    <div class="desc">${link.desc}</div>
  `;

  content.appendChild(div);
});
```

}

// Back button
if (historyStack.length > 0) {
const back = document.createElement('button');
back.className = 'back-btn';
back.innerText = "⬅ Back";

```
back.onclick = () => {
  showNode(historyStack.pop());
  path.pop();
};

content.appendChild(back);
```

}
}

// Search
document.addEventListener("input", (e) => {
if (e.target.id === "search") {
const term = e.target.value.toLowerCase();
const content = document.getElementById('content');

```
if (!term) {
  showNode(data);
  return;
}

content.innerHTML = "";

const results = flatLinks.filter(link =>
  link.title.toLowerCase().includes(term) ||
  link.desc.toLowerCase().includes(term)
);

results.forEach(link => {
  const div = document.createElement('div');
  div.className = 'card link';

  div.innerHTML = `
    <a href="${link.url}" target="_blank">${link.title}</a>
    <div class="desc">${link.desc}</div>
    <div class="desc">📍 ${link.path.join(" > ")}</div>
  `;

  content.appendChild(div);
});
```

}
});

function updateBreadcrumbs() {
const breadcrumbs = document.getElementById('breadcrumbs');
breadcrumbs.innerText = ["Home", ...path].join(" > ");
}
