'use strict';
const tasks=['RememberColor3','RememberColor5','RememberColor9','ShellGameTouch','Average'];
const comparisons = {
  controlled: {
    context: 'Stationary cue phase · three evaluation blocks · original histories',
    metric: 'Exclusive target completion',
    baseline: [30.67, 2, 10.67, 16.67, 15],
    ours: [98.67, 97.33, 66, 89.33, 87.83],
    baselineStd: [3.06, 2, 4.62, 4.62, 2],
    oursStd: [1.15, 2.31, 5.29, 2.31, 2.52]
  },
  benchmark: {
    context: 'Actions allowed during the cue phase · three evaluation blocks',
    metric: 'Task success',
    baseline: [38, 20, 14, 86.67, 39.67],
    ours: [70, 29.33, 25.33, 77.33, 50.50],
    baselineStd: [6, 7.21, 6, 4.16, 0.29],
    oursStd: [5.29, 4.16, 3.06, 9.45, 3.77]
  },
  original: {
    context: 'Paired diagnostic · one evaluation block · original histories',
    metric: 'Exclusive original-target completion',
    baseline: [26, 2, 10, 14, 13],
    ours: [100, 98, 60, 90, 87]
  },
  replaced: {
    context: 'Paired diagnostic · one evaluation block · replaced histories',
    metric: 'Exclusive replacement-target completion',
    baseline: [26, 6, 2, 10, 11],
    ours: [100, 100, 60, 90, 87.5]
  }
};
const heroVideo=document.getElementById('hero-video');
const heroPlayback=document.getElementById('hero-playback');
let heroWantsPlayback=!window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function syncHeroPlayback(){
  heroPlayback.textContent=heroVideo.paused?'Play':'Pause';
  heroPlayback.setAttribute('aria-label',heroVideo.paused?'Play simulation video':'Pause simulation video');
}
function updateHistory(next){
  document.querySelectorAll('[data-history]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.history===next)));
  if(heroWantsPlayback)heroVideo.setAttribute('autoplay','');else heroVideo.removeAttribute('autoplay');
  const source=heroVideo.querySelector('source');
  const path='assets/baseline-'+next+'.mp4';
  if(source.getAttribute('src')!==path){heroVideo.pause();source.src=path;heroVideo.load()}
  const target = {
    original: 'Green block',
    replaced: 'Blue block',
    erased: 'No target specified'
  };
  document.querySelector('#hero-target strong').textContent = target[next];
  if(heroWantsPlayback)heroVideo.play().catch(syncHeroPlayback);else heroVideo.pause();
  syncHeroPlayback();
}
heroVideo.addEventListener('play',syncHeroPlayback);
heroVideo.addEventListener('pause',syncHeroPlayback);
heroPlayback.addEventListener('click',()=>{
  heroWantsPlayback=heroVideo.paused;
  if(heroWantsPlayback)heroVideo.play().catch(syncHeroPlayback);else heroVideo.pause();
});
if(!heroWantsPlayback){heroVideo.removeAttribute('autoplay');heroVideo.pause()}

function formatResult(value, deviation) {
  if (deviation === undefined) return value.toFixed(1) + '%';
  return `${value.toFixed(2)} ± ${deviation.toFixed(2)}%`;
}

function resultBar(value, deviation, isMemAlign) {
  const model = isMemAlign ? 'MemAlign' : 'MemoryVLA';
  const fill = isMemAlign ? 'ours-fill' : 'baseline-fill';
  const label = formatResult(value, deviation);
  const inside = value >= 65;
  const numberStyle = inside ? `left:calc(${value}% - 6px);transform:translateX(-100%)` : `left:calc(${value}% + 6px)`;
  const contrast = inside && isMemAlign ? ' on-blue' : '';
  return `<div class="bar-track" role="img" aria-label="${model}: ${label}">
    <div class="bar-fill ${fill}" style="width:${value}%"></div>
    <span class="bar-number${contrast}" style="${numberStyle}" aria-hidden="true">${label}</span>
  </div>`;
}

function renderResults(next) {
  document.querySelectorAll('[data-result]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.result === next));
  });
  const values = comparisons[next];
  document.getElementById('result-bars').innerHTML = tasks.map((task, index) => {
    const average = task === 'Average';
    const label = average ? 'Four-task mean' : task;
    const baseline = resultBar(values.baseline[index], values.baselineStd?.[index], false);
    const ours = resultBar(values.ours[index], values.oursStd?.[index], true);
    return `<div class="bar-row${average ? ' average' : ''}">
      <div class="bar-task"><strong>${label}</strong></div>
      <div class="bar-pair">${baseline}${ours}</div>
    </div>`;
  }).join('');
  const baseline = formatResult(values.baseline[4], values.baselineStd?.[4]);
  const ours = formatResult(values.ours[4], values.oursStd?.[4]);
  document.getElementById('chart-context').textContent = values.context;
  document.getElementById('chart-metric').textContent = values.metric;
  document.getElementById('chart-summary').textContent = `Four-task mean: ${baseline} to ${ours}`;
}
const demoTexts={
  original:{description:'Original history specifies target 1. MemAlign completes object 1 only; the baseline completes object 0.',target:'1'},
  replaced:{description:'Replaced history specifies target 2. MemAlign redirects to object 2 only; the baseline still completes object 0.',target:'2'},
  erased:{description:'Erasure removes the identifying cue. Both policies complete object 0; there is no uniquely specified target in this diagnostic condition.',target:'0'}
};
function selectDemo(next){
  document.querySelectorAll('[data-demo]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.demo===next)));
  ['baseline','memalign'].forEach(model=>{
    const video=document.getElementById(model+'-video');
    video.pause();video.querySelector('source').src='assets/'+model+'-'+next+'.mp4';video.load();
  });
  document.getElementById('demo-explanation').textContent=demoTexts[next].description;
  document.getElementById('memalign-target').textContent=demoTexts[next].target;
}
document.querySelectorAll('[data-history]').forEach(b=>b.addEventListener('click',()=>updateHistory(b.dataset.history)));
document.querySelectorAll('[data-result]').forEach(b=>b.addEventListener('click',()=>renderResults(b.dataset.result)));
document.querySelectorAll('[data-demo]').forEach(b=>b.addEventListener('click',()=>selectDemo(b.dataset.demo)));
document.getElementById('replay-demo').addEventListener('click',async()=>{
  const videos=['baseline','memalign'].map(m=>document.getElementById(m+'-video'));
  videos.forEach(v=>{v.currentTime=0});
  await Promise.allSettled(videos.map(v=>v.play()));
});
renderResults('controlled');
updateHistory('original');

const gallery = document.getElementById('watch');
const galleryLinks = [...gallery.querySelectorAll('.gallery-nav a')];
const galleryPanels = galleryLinks.map(link => document.getElementById(link.hash.slice(1)));

function showCollection(id) {
  galleryPanels.forEach((panel, index) => {
    const selected = panel.id === id;
    if (!selected && !panel.hidden) {
      panel.querySelectorAll('video').forEach(video => {
        if (!video.paused) video.pause();
      });
    }
    panel.hidden = !selected;
    if (selected) galleryLinks[index].setAttribute('aria-current', 'true');
    else galleryLinks[index].removeAttribute('aria-current');
  });
}

function syncCollectionWithLocation() {
  const linkedPanel = galleryPanels.find(panel => '#' + panel.id === location.hash);
  if (linkedPanel) {
    showCollection(linkedPanel.id);
    gallery.scrollIntoView();
  } else if (location.hash === '#watch') {
    showCollection(galleryPanels[0].id);
  }
}

galleryLinks.forEach(link => link.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  showCollection(link.hash.slice(1));
}));

showCollection(galleryPanels[0].id);
window.addEventListener('hashchange', syncCollectionWithLocation);
if (location.hash) requestAnimationFrame(syncCollectionWithLocation);
