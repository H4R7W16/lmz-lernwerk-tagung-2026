/* Nur die Präsentationshülle: vorbereitete Original-URLs und derselbe iframe. */
(() => {
  const pane=document.querySelector('[data-lernwerk-window]');
  if(!pane)return;
  const frame=pane.querySelector('iframe');
  const scene=pane.closest('[data-composition-id]').id;
  const expand=pane.querySelector('.demo-expand');
  const buttons=[...pane.querySelectorAll('[data-demo-stop]')];
  let opened=false;
  function setExpanded(value){
    pane.classList.toggle('is-expanded',value);
    expand.setAttribute('aria-expanded',String(value));
    expand.textContent=value?'Zur Führung zurück ↙':'Lernwerk vergrößern ↗';
  }
  function choose(button){
    buttons.forEach(item=>item.classList.toggle('is-selected',item===button));
    pane.querySelector('[data-demo-cue-title]').textContent=button.dataset.demoTitle;
    pane.querySelector('[data-demo-cue-text]').textContent=button.dataset.demoText;
    pane.querySelector('[data-demo-status]').textContent='Original · Internet erforderlich';
    if(opened||frame.getAttribute('src')!==button.dataset.demoUrl)frame.src=button.dataset.demoUrl;
    opened=true;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>choose(button)));
  expand.addEventListener('click',()=>setExpanded(!pane.classList.contains('is-expanded')));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&pane.classList.contains('is-expanded')){setExpanded(false);expand.focus();}
  });
  window.LMZLernwerkDemo={show(activeScene){
    if(activeScene===scene&&!opened)choose(buttons.find(button=>button.dataset.demoStop==='vermuten')||buttons[0]);
    if(activeScene!==scene)setExpanded(false);
  }};
})();
