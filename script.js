let data;
let historyStack = [];
let path = [];

fetch('data.json')
  .then(res => res.json())
  .then(json => {
    data = json;
    showNode(data);
  });

function showNode(node) {
  const content = document.getElementById('content');
  content.innerHTML = "";

  updateBreadcrumbs(node);

  // Show subtopics
  if (node.children) {
    node.children.forEach(child => {
      const div = document.createElement('div');
      div.className = 'card';
      div.innerText = child.name;

      div.onclick = () => {
        historyStack.push(node);
        path.push(child.name);
        showNode(child);
      };

      content.appendChild(div);
    });
  }

  // Show links
  if (node.links) {
    node.links.forEach(link => {
      const div = document.createElement('div');
      div.className = 'link';

      div.innerHTML = `
        <a href="${link.url}" target="_blank">${link.title}</a>
        <div class="desc">${link.desc}</div>
      `;

      content.appendChild(div);
    });
  }

  // Back button
  if (historyStack.length > 0) {
    const back = document.createElement('div');
    back.className = 'card';
    back.innerText = "⬅ Back";

    back.onclick = () => {
      showNode(historyStack.pop());
      path.pop();
    };

    content.appendChild(back);
  }
}

function updateBreadcrumbs(current) {
  const breadcrumbs = document.getElementById('breadcrumbs');

  let fullPath = ["Home", ...path];
  breadcrumbs.innerText = fullPath.join(" > ");
}