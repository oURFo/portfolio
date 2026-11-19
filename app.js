const categories = new Map([
  ['all', '全部作品'],
  ['games', '遊戲與互動'],
  ['life', '生活與旅遊'],
  ['learn', '學習與閱讀'],
  ['emt', 'EMT'],
]);

const navigation = document.querySelector('#categories');
const search = document.querySelector('#search');
const title = document.querySelector('#category-title');
const resultCount = document.querySelector('#result-count');
const grid = document.querySelector('#projects');
const template = document.querySelector('#project-template');

async function start() {
  const response = await fetch('./projects.json');
  if (!response.ok) throw new Error('Unable to load projects');
  const projects = await response.json();

  for (const [id, label] of categories) {
    const link = document.createElement('a');
    const count = id === 'all' ? projects.length : projects.filter(project => project.category === id).length;
    const number = document.createElement('span');
    link.href = '#' + id;
    number.textContent = count;
    link.append(label, number);
    navigation.append(link);
  }

  function render() {
    const hash = location.hash.slice(1);
    const category = categories.has(hash) ? hash : 'all';
    const words = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const results = projects.filter(project => {
      const text = [project.title, project.description, project.tag, categories.get(project.category)]
        .join(' ').toLowerCase();
      return (category === 'all' || category === project.category) &&
        words.every(word => text.includes(word));
    });

    title.textContent = categories.get(category);
    for (const link of navigation.querySelectorAll('a')) {
      if (link.hash === '#' + category) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }

    resultCount.textContent = results.length ? `${results.length} 件作品` : '找不到符合的作品';
    grid.replaceChildren(...results.map((project, index) => {
      const card = template.content.cloneNode(true);
      const cover = card.querySelector('img');
      const open = card.querySelector('a');
      cover.src = project.image;
      cover.loading = index < 3 ? 'eager' : 'lazy';
      cover.classList.toggle('portrait', project.id === 16);
      card.querySelector('.tag').textContent = project.tag;
      card.querySelector('h2').textContent = project.title;
      card.querySelector('p').textContent = project.description;
      open.href = project.url;
      open.textContent = project.tag === 'Android' ? '前往 Google Play' : '前往';
      open.setAttribute('aria-label', open.textContent + '：' + project.title + '（在新分頁開啟）');
      return card;
    }));
  }

  search.addEventListener('input', render);
  window.addEventListener('hashchange', () => {
    if (location.hash !== '#content') render();
  });
  render();
}

start().catch(() => {
  resultCount.textContent = '目前無法載入作品，請重新整理頁面。';
});

async function showVisitorCount() {
  const counter = document.querySelector('#visitor-counter');
  const endpoint = counter.dataset.endpoint;
  if (!endpoint) return;

  const storageKey = 'yuyang-portfolio-visitor-id';
  let request = {};
  try {
    const visitorId = localStorage.getItem(storageKey) || crypto.randomUUID();
    localStorage.setItem(storageKey, visitorId);
    request = { method: 'POST', body: visitorId };
  } catch {
    // Visitors with browser storage disabled can still read the total.
  }

  const response = await fetch(endpoint, {
    ...request,
    credentials: 'omit',
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) return;
  const { count } = await response.json();
  if (!Number.isSafeInteger(count) || count < 0) return;
  document.querySelector('#visitor-total').textContent = new Intl.NumberFormat('zh-TW').format(count);
  counter.hidden = false;
}

showVisitorCount().catch(() => {
  // The portfolio remains usable when the counting service is unavailable.
});
