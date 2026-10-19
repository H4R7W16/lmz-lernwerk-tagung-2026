/* Wiederverwendbare Interaktionsschicht: Folienwechsel, Demo-Fenster, Fokus. */
(() => {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const demos=[...document.querySelectorAll('.game-window iframe')].map(frame=>({frame,pane:frame.closest('.game-window'),scene:frame.closest('[data-composition-id]').id,ready:false,step:null}));
  const labels={wall:'Schattenwand',turn:'Überblick · hinter der Mauer',backstage:'Überblick · Figuren, Stäbe und Feuer',figures:'Figuren und Stäbe · getragen hinter der Mauer',fire:'Lichtquelle · Hilfsstrahlen zeigen die Projektion',light:'Im Freien'};
  let lastScene=null,lastTime=0;
  const send=(demo,command,position,focus=false)=>demo.frame.contentWindow?.postMessage({source:'lmz-cave-host',command,position,focus},location.origin);
  function view(demo,position,focus=false){
    if(!demo.ready)return;
    send(demo,'excerpt',position,focus);
    demo.pane.querySelectorAll('[data-cave-position]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.cavePosition===position)));
    const status=demo.pane.querySelector('[data-cave-status]');if(status)status.textContent=labels[position];
    if(focus)demo.frame.focus();
  }
  function positionAt(time){return time>=208?'backstage':time>=205?'fire':time>=202?'figures':'backstage';}
  function syncDemo(demo,time){
    const step=demo.scene==='i3-wendung'?positionAt(time):'wall';
    if(demo.ready&&demo.step!==step){view(demo,step);demo.step=step;}
  }
  function setExpanded(demo,value){
    demo.pane.classList.toggle('is-expanded',value);
    const button=demo.pane.querySelector('.game-expand');
    if(button){button.setAttribute('aria-expanded',String(value));button.textContent=value?'Fenster verkleinern ↙':demo.scene==='i3-wendung'?'Vergrößern ↗':'Fenster vergrößern ↗';}
  }
  demos.forEach(demo=>{
    demo.frame.addEventListener('load',()=>{demo.ready=true;demo.step=null;if(demo.scene===lastScene)syncDemo(demo,lastTime);else send(demo,'pause');});
    demo.pane.querySelector('.game-expand')?.addEventListener('click',()=>setExpanded(demo,!demo.pane.classList.contains('is-expanded')));
    demo.pane.querySelectorAll('[data-cave-position]').forEach(button=>button.addEventListener('click',()=>view(demo,button.dataset.cavePosition,true)));
  });
  document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;demos.filter(demo=>demo.pane.classList.contains('is-expanded')).forEach(demo=>{setExpanded(demo,false);demo.pane.querySelector('.game-expand').focus();});});
  // Framework seeks determine state. Entrance motion is an optional UI response
  // to navigation, never a second clock for the authored composition timeline.
  window.LMZStage={show(sceneId,time=0){
    lastTime=time;
    window.LMZLernwerkDemo?.show(sceneId);
    document.querySelectorAll('[data-hide-at]').forEach(element=>{element.style.visibility=time>=Number(element.dataset.hideAt)?'hidden':'';element.setAttribute('aria-hidden',String(time>=Number(element.dataset.hideAt)));});
    demos.filter(demo=>demo.scene===sceneId).forEach(demo=>syncDemo(demo,time));
    if(sceneId===lastScene)return;
    demos.forEach(demo=>{if(demo.scene!==sceneId){send(demo,'pause');demo.step=null;}setExpanded(demo,false);});
    const scene=document.getElementById(sceneId);
    if(scene&&!reduced.matches){
      const targets=scene.classList.contains('intro-scene')
        ? scene.querySelectorAll('.live-heading,.game-window,.prompt-item,.backstage-copy,.turning-route,.motivation-equation,.motivation-personal,h1')
        : scene.querySelectorAll('h1,.split,.process-grid,.native-chart,.comparison,.media-layout,.matrix,.stack-scene,.foundation-docs,.concept-blueprint,.mapping-goal,.journey-trail,.demo-entry-layout,.demo-browser,.demo-principles,.test-choice-grid,.test-observation-layout,.test-finding-template,.feedback-board,.feedback-question,.feedback-next-grid,.outlook-cycle,.outlook-return,.review-lenses,.review-note-strip,.expertise-scene,.expertise-judgments,.variant-stack,.variant-review-slip');
      targets.forEach((element,i)=>{
        element.getAnimations().forEach(animation=>animation.cancel());
        const delay=Math.min(i,4)*65;
        element.animate([{opacity:.12,transform:'translateY(28px) scale(.985)',filter:'blur(5px)'},{opacity:1,transform:'translateY(0) scale(1)',filter:'blur(0px)'}],{duration:750,delay,easing:'cubic-bezier(.16,1,.3,1)'});
      });
      scene.querySelectorAll('.shimmer-sweep-target').forEach(element=>element.animate([{'--shimmer-pos':'-20%'},{'--shimmer-pos':'120%'}],{duration:1300,easing:'ease-in-out'}));
    }
    lastScene=sceneId;
  }};
})();
