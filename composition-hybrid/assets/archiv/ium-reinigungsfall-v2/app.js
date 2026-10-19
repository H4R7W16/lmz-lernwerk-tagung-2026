'use strict';
(() => {
  const L=CleaningLesson, main=document.querySelector('#main');
  const storageKey='ium-cleaning-learning-v2';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const directions=['oben','rechts','unten','links'], arrows=['↑','→','↓','←'];
  let state=L.fresh(),remember=false,restored=false,pendingImport=null;
  let storageNote='Eingaben nur in diesem Tab',notices={},detailsOpen={};
  try {const saved=localStorage.getItem(storageKey);if(saved){state=L.decode(saved);remember=true;restored=true;state.screen='pause';storageNote='Dein gespeicherter Stand wurde geladen';}}
  catch {storageNote='Browsersicherung nicht lesbar oder nicht verfügbar – bitte eine Datei nutzen';}
  if(!restored&&L.ids.includes(location.hash.slice(1)))state.screen=location.hash.slice(1);
  if(state.screen!=='pause')state.last=state.screen;
  const navigation=document.querySelector('#navigation');
  const narrow=matchMedia('(max-width:850px)');
  if(narrow.matches)navigation.open=false;
  narrow.addEventListener('change',e=>{navigation.open=!e.matches;});

  function persist(){
    if(remember){try{localStorage.setItem(storageKey,L.encode(state));storageNote='Auf diesem Gerät im Browser gesichert';}catch{storageNote='Browsersicherung fehlgeschlagen – bitte als Datei sichern';}}
    document.querySelector('#storage-status').textContent=storageNote;
  }
  function snapshotPrediction(p){return Number.isInteger(p.x)&&Number.isInteger(p.y)&&Number.isInteger(p.d)?`Kachel (${p.x},${p.y}), Blick ${directions[p.d]}`:'Ohne vollständige Vorhersage ausprobiert';}
  function currentRun(id=state.screen){const w=state.work[id];if(!w?.attempt)return null;try{return L.simulate(id,w.attempt.code,w.attempt.prediction);}catch{return null;}}
  function detail(key,title,body,extra=''){return `<details class="${extra||'help'}" data-detail="${key}" ${detailsOpen[key]?'open':''}><summary>${title}</summary>${body}</details>`;}
  function heading(c,index){return `<div class="intro"><div class="eyebrow">${index?`Schritt ${index} von ${L.ids.length} · `:''}${esc(c.label)}</div><h1 id="page-title">${c.title}</h1><p class="lead">${c.lead}</p>${c.goal?`<p class="goal-line"><strong>Das lernst du:</strong> <span>${c.goal}</span></p>`:''}</div>`;}
  function nav(){document.querySelector('#nav').innerHTML=L.ids.map((id,i)=>`<button class="nav-item" data-nav="${id}" ${id===(state.screen==='pause'?state.last:state.screen)?'aria-current="step"':''}><span class="nav-number">${String(i+1).padStart(2,'0')}</span><span>${L.cases[id].short}</span></button>`).join('');}
  function focusRestore(key){const target=key&&document.getElementById(key);if(target&&!target.disabled)target.focus({preventScroll:true});}
  function render(moveFocus=false){
    const key=document.activeElement?.id;
    nav();
    const id=state.screen;
    if(id==='pause')main.innerHTML=pauseHTML();
    else {const c=L.cases[id];main.innerHTML=heading(c,L.ids.indexOf(id)+1)+(c.room?lessonHTML(id):id==='transfer'?transferHTML():finishHTML())+nextHTML(id);}
    persist();
    if(moveFocus){main.focus();window.scrollTo({top:0,behavior:'instant'});}else focusRestore(key);
  }
  function navigate(id){
    if(![...L.ids,'pause'].includes(id))return;
    if(state.screen!=='pause')state.last=state.screen;
    state.screen=id;if(id!=='pause'){state.last=id;if(!state.seen.includes(id))state.seen.push(id);}
    history.replaceState(null,'',`#${id}`);render(true);
  }
  function nextHTML(id){const next=L.ids[L.ids.indexOf(id)+1];return `<div class="step-footer"><p>Du kannst jeden Schritt erneut öffnen.<br>Deine Eingaben bleiben dabei erhalten.</p><button class="primary" data-nav="${next||'pause'}">${next?`Weiter: ${L.cases[next].short} →`:'Meinen Stand mitnehmen →'}</button></div>`;}
  function codeHTML(code,now){
    return `<div class="code-display" aria-label="Code mit ausgeführtem Befehl">${code.split('\n').map((line,index)=>{
      const match=/^(\s*wiederhole\s+\d+\s*\[)([^\]]+)(\].*)$/.exec(line);
      let content;
      if(match)content=`<span class="repeat-word">${esc(match[1])}</span>${match[2].split(';').map((t,j)=>`<span class="token ${now?.line===index+1&&now.bodyIndex===j?'active':''}" ${now?.line===index+1&&now.bodyIndex===j?'aria-current="true"':''}>${esc(t.trim())}</span>`).join('; ')}<span class="repeat-word">${esc(match[3])}</span>`;
      else content=`<span class="token ${now?.line===index+1?'active':''}">${esc(line)||' '}</span>`;
      return `<span class="code-line"><span class="line-number" aria-hidden="true">${index+1}</span>${content}</span>`;
    }).join('')}</div>`;
  }
  function lessonHTML(id){
    const c=L.cases[id],w=state.work[id],run=currentRun(id),now=run?.trace[Math.min(w.attempt.step,run.trace.length-1)];
    const editable=c.choice?`<label for="turn-choice">Drehbefehl im Körper</label><select id="turn-choice"><option value="">Bitte wählen …</option><option value="links" ${w.code.includes('; links]')?'selected':''}>links</option><option value="rechts" ${w.code.includes('; rechts]')?'selected':''}>rechts</option></select><div id="code-preview">${codeHTML(w.code,now)}</div>`:c.editable?`<label for="code-input">Dein Code</label><textarea maxlength="10000" id="code-input" class="code-input" spellcheck="false" aria-describedby="syntax">${esc(w.code)}</textarea><div class="toolbar"><button data-insert="vor">+ vor</button><button data-insert="links">+ links</button><button data-insert="rechts">+ rechts</button><button data-insert="wiederhole 2 [vor]">+ Wiederholung</button></div><p id="syntax" class="syntax">Ein Grundbefehl pro Zeile. Wiederholung: <code>wiederhole 2 [vor; links]</code>. 2–9 Durchläufe; bis zu 5 Befehle im Körper.</p>`:`<div id="code-preview">${codeHTML(w.code,now)}</div>`;
    const plan=id==='plan'?detail('paper','Deinen Papierplan vorbereiten',`<p>Zeichne mit Pfeilen, was nacheinander geschieht. Umrahme die Befehle, die du wiederholst, und schreibe die Anzahl dazu.</p><div class="paper-flow"><span>Start</span> → <span class="body-bracket">3 × [vor]</span> → <span>nächster Teil</span> → <span>Ende</span></div><p>Das Beispiel zeigt nur eine Zeile. Entwickle selbst, wie es weitergeht.</p><label for="plan-note">Meine Teilflächen und mein Plan</label><textarea maxlength="8000" id="plan-note" data-work="plan" placeholder="Zum Beispiel: erst die untere Zeile …">${esc(w.plan)}</textarea>`):'';
    return `<div class="workspace"><section class="panel editor"><h2>Dein nächster Schritt</h2><p class="task-text">${c.task}</p><button class="mobile-jump" data-action="to-board">Zum Bodenplan ↓</button>${plan}${editable}${c.predict?predictionHTML(w):''}<div class="help"><strong>Die drei Grundbefehle</strong><p><code>vor</code>: eine Kachel in Blickrichtung.<br><code>links / rechts</code>: eine Vierteldrehung auf derselben Kachel.</p></div>${detail(`hints-${id}`,'Eine Hilfe für meinen nächsten Schritt',c.hints.map((h,i)=>`<p class="hint"><span class="hint-number">Hinweis ${i+1}</span><br>${h}</p>`).join(''))}${id==='wiederholung'?detail('expand','Zwei Durchläufe auseinanderziehen',`<p>Die Trennlinie zeigt, wo ein neuer Durchlauf beginnt:</p><div class="cycle"><small>Durchlauf 1</small>vor → links</div> | <div class="cycle"><small>Durchlauf 2</small>vor → links</div><p>Vier Durchläufe mit je zwei Befehlen sind acht Aktionen.</p>`):''}</section><section class="panel stage" id="board">${boardHTML(id)}</section></div><div class="after-work" id="after-work">${afterHTML(id)}</div>`;
  }
  function predictionHTML(w){const p=w.attempt?.prediction||w.prediction,locked=!!w.attempt;return `<div class="prediction-box"><label>1 · Wähle deine vermutete Endkachel im Bodenplan</label><p class="prediction-summary">${p.x?`Markiert: (${p.x},${p.y})`:'Noch keine Kachel markiert.'}${locked?' · Vorhersage für diese Fahrt festgehalten.':''}</p><fieldset><legend>2 · Wohin blickt er am Ende?</legend><div class="direction-options">${directions.map((d,i)=>`<button id="direction-${i}" data-direction="${i}" aria-pressed="${p.d===i}" ${locked?'disabled':''}>${arrows[i]} ${d}</button>`).join('')}</div></fieldset><p class="muted">Du darfst auch ohne Vermutung ausprobieren. Das Ergebnis zählt dann nicht als Vorhersagevergleich.</p></div>`;}
  function gridHTML(id,now){
    const c=L.cases[id],w=state.work[id],room=L.rooms[c.room],p=w.attempt?.prediction||w.prediction;
    const selectable=c.predict&&!w.attempt;
    const size=room.width===2?104:room.width===3?83:70;
    let html='';
    for(let y=1;y<=room.height;y++)for(let x=1;x<=room.width;x++){
      const clean=now.cleaned.includes(`${x},${y}`),robot=now.pos[0]===x&&now.pos[1]===y,selected=p.x===x&&p.y===y;
      const label=`Kachel (${x},${y}), ${clean?'sauber':'noch Krümel'}${robot?`, Roboter blickt ${directions[now.pos[2]]}`:''}${selected?', deine Vermutung':''}`;
      const tag=selectable?'button':'div';
      html+=`<${tag} class="tile ${clean?'clean':''} ${selectable?'selectable':''} ${selected?'selected':''}" ${selectable?`id="tile-${x}-${y}" data-tile="${x},${y}" aria-pressed="${selected}"`:'role="img"'} aria-label="${label}"><span class="coordinate" aria-hidden="true">${x},${y}</span>${robot?`<span class="robot" aria-hidden="true" style="transform:rotate(${now.pos[2]*90}deg)">↑</span>`:clean?'<span class="clean-mark" aria-hidden="true">✓</span>':'<span class="crumbs" aria-hidden="true">▪<i>▪</i></span>'}${selected?'<span class="prediction-marker" aria-hidden="true">Vermutung</span>':''}</${tag}>`;
    }
    const run=currentRun(id),step=run?Math.min(w.attempt.step,run.trace.length-1):0;
    const path=step?run.trace.slice(0,step+1).map(s=>`${(s.pos[0]-1)*(size+5)+size/2},${(s.pos[1]-1)*(size+5)+size/2}`).join(' '):'';
    const width=room.width*size+(room.width-1)*5,height=room.height*size+(room.height-1)*5;
    return `<div class="room-map" style="max-width:${width}px"><div class="room" style="grid-template-columns:repeat(${room.width},minmax(0,${size}px))" role="group" aria-label="Bodenplan ${room.width} mal ${room.height}${selectable?', Endkachel für deine Vermutung wählen':''}">${html}</div>${path?`<svg class="path-overlay" viewBox="0 0 ${width} ${height}" aria-hidden="true"><polyline points="${path}" fill="none" stroke="#43816b" stroke-width="2.5" stroke-dasharray="5 5" stroke-linejoin="round"/></svg>`:''}</div>`;
  }
  function boardHTML(id){
    const c=L.cases[id],w=state.work[id],room=L.rooms[c.room],run=currentRun(id),step=run?Math.min(w.attempt.step,run.trace.length-1):0;
    const now=run?run.trace[step]:{pos:room.start,cleaned:[`${room.start[0]},${room.start[1]}`],action:'Start'};
    const finished=!!run&&step===run.trace.length-1;
    const canBody=w.code.includes('wiederhole');
    return `<button class="mobile-jump" data-action="to-code">Zu Auftrag &amp; Code ↑</button><div class="stage-heading"><h2 id="board-title" tabindex="-1">Deine Bodenfläche</h2><span class="room-size">${room.width} × ${room.height} Kacheln</span></div><div class="play-controls"><button id="back-action" data-action="back" aria-label="Eine Aktion zurück" ${step===0?'disabled':''}>←</button><button id="next-action" data-action="step" class="primary" ${finished?'disabled':''}>${step?'Nächste Aktion':'Erste Aktion'} →</button>${canBody?`<button id="body-action" data-action="body" ${finished?'disabled':''}>Bis Körperende</button>`:''}<button id="run-action" data-action="run" ${finished?'disabled':''}>Ganz prüfen</button>${run?'<button id="restart-action" data-action="restart">Von vorn ansehen</button>':''}</div>${!c.editable?`<div class="mobile-code">${codeHTML(w.code,now)}</div>`:''}<div class="scenery">BASTELTISCH · AUSSERHALB DER FAHRFLÄCHE</div>${gridHTML(id,now)}<div class="room-key"><span>▪ Krümel</span><span>✓ besucht = sauber</span><span>↑ Blickrichtung</span></div><div class="counter"><span><strong>${now.cleaned.length} / ${room.width*room.height}</strong> Kacheln sauber</span><span class="muted">${run?`Aktion ${step} / ${run.trace.length-1}`:'Start'}</span></div><p class="state-line" aria-live="polite">Ort (${now.pos[0]},${now.pos[1]}) · Blick ${directions[now.pos[2]]}${now.error?' · Rand erreicht; Roboter bleibt stehen.':''}</p>${w.previous&&!run?'<div class="stale">Code geändert. Hier siehst du wieder den Start. Die alte Fahrt bleibt beim Vergleich erhalten.</div>':''}<div class="execution-label">${step?`${now.repeat?`Durchlauf ${now.iteration} von ${now.count} · `:''}gerade ${now.error?'versucht':'ausgeführt'}: <strong>${now.action}</strong>`:'Bereit: Prüfe die erste Aktion.'}</div>${c.editable&&run?`<div class="subsection"><span class="small-caps">Dieser Code wird geprüft</span>${codeHTML(run.code,now)}</div>`:''}<p class="notice" id="run-notice" role="status">${esc(notices[id]||'')}</p>${finished?feedbackHTML(id,run):''}<p class="model-note">Unser Modell: Auch die Startkachel zählt als sauber. Drehen reinigt keine neue Kachel. Der Roboter fährt nur nach Plan; er erkennt keine Hindernisse.</p>`;
  }
  function feedbackHTML(id,run){
    const check=L.predictionResult(run),checks=L.criteria(id,run),fail=run.status!=='complete';
    let title,body;
    if(id==='start'){title='Fahren verändert den Ort. Drehen verändert den Blick.';body='Vergleiche die beiden Aktionen noch einmal. Welche davon erreicht eine neue Kachel?';}
    else if(id==='vorhersage'){title=check.available?(check.correct?'Deine Vorhersage passt zu dieser Fahrt.':'Die Fahrt endet anders als vorhergesagt.'):'Du hast die Fahrt ausprobiert.';body=`Ende: (${run.end[0]},${run.end[1]}), Blick ${directions[run.end[2]]}. ${check.available?`Vorher vermutet: ${snapshotPrediction(run.prediction)}.`:'Für diese Fahrt war noch keine vollständige Vorhersage festgelegt.'} Erkläre jetzt, wie die Drehung die letzte Fahrt verändert.`;}
    else if(id==='wiederholung'){title='Viermal der ganze Körper: acht Aktionen.';body='In jedem Durchlauf kamen „vor“ und „links“ dran. Zeige unten, wie zwei Durchläufe aussehen.';}
    else if(fail){title=run.status==='wall'?'Hier passt der nächste Schritt noch nicht.':'Nach 100 Aktionen angehalten.';body=run.status==='wall'?`Aktion ${run.trace.length-1} würde über den Rand führen. Geh eine Aktion zurück: Welche Blickrichtung hat der Roboter dort?`:'Kürze deinen Ablauf oder prüfe einen Teilplan.';}
    else {title=checks.every(c=>c.met)?(id==='klammer'?'Die geplante Randrunde gelingt.':'Dein Fahrplan erfüllt die geprüften Kriterien.'):'Die Fahrt ist beendet. Ein Teil des Auftrags ist noch offen.';body=id==='klammer'?'Erkläre, warum die Drehung zu jedem Durchlauf gehört. Ob der ganze Boden sauber wird, untersuchst du im nächsten Schritt.':run.missing.length?`${run.cleaned.length} Kacheln erreicht. Suche im Bodenplan nach den übrigen Krümeln und plane eine gezielte Ergänzung.`:'Begründe nun, wie dein Plan die Fläche abdeckt. Deine Erklärung wird nicht automatisch bewertet.';}
    return `<div class="feedback ${fail||(id==='vorhersage'&&check.available&&!check.correct)||checks.some(c=>!c.met)?'warn':''}" role="status"><strong>${title}</strong><p>${body}</p>${checks.length?`<ul class="criteria">${checks.map(c=>`<li class="${c.met?'met':'unmet'}"><span class="criteria-symbol">${c.met?'✓':'○'}</span><span>${c.label}</span></li>`).join('')}</ul>`:''}</div>`;
  }
  const questionOptions={
    start:[['direction','Nur die Blickrichtung.'],['place','Der Roboter fährt auf die Kachel links von ihm.'],['both','Ort und Blickrichtung zugleich.']],
    wiederholung:[['grouped','vor → vor → links → links'],['body','vor → links | vor → links'],['single','vor → links; danach ist alles fertig.']],
    station:[['third','Beim dritten „aufnehmen“, weil drei Werkstücke zu viel sind.'],['second','Beim zweiten „aufnehmen“, weil die Station noch belegt ist.'],['none','Keiner scheitert; beide Pläne sind gleich.']],
    hindernis:[['yes','Ja. Ein genauer Plan reicht zum selbstständigen Ausweichen.'],['no','Nein. Dem festen Plan fehlen Informationen und eine Regel zum Reagieren.']],
    system:[['picture','Jedes Bild mit einem Roboter zeigt schon einen ausgeführten Algorithmus.'],['process','Die Wegberechnung verarbeitet Angaben; ein Papierplan führt sich nicht selbst aus.']],
    returnRecall:[['grouped','rechts → rechts → vor → vor'],['body','rechts → vor | rechts → vor'],['single','rechts → vor']],
    recall:[['grouped','links → links → vor → vor'],['body','links → vor | links → vor'],['single','links → vor']]
  };
  function questionHTML(id,title){
    if(['recall','returnRecall'].includes(id))return sequenceHTML(id);
    const a=state.answers[id],result=a.checked?L.check(id,a.value):null;
    return `<section class="question-block"><h3>${title}</h3><fieldset style="border:0;padding:0;margin:0"><legend class="sr-only">${title}</legend><div class="choice-list">${questionOptions[id].map(([v,text])=>`<label><input type="radio" id="answer-${id}-${v}" name="question-${id}" data-question="${id}" value="${v}" ${a.value===v?'checked':''}> <span>${text}</span></label>`).join('')}</div></fieldset><button class="primary" id="check-${id}" data-check="${id}">Antwort vergleichen</button>${result?`<div class="feedback ${result.correct?'':'warn'}" role="status"><strong>${result.available?(result.correct?'Das passt.':'Hier lohnt sich ein genauer Vergleich.'):'Wähle zuerst eine Antwort.'}</strong>${result.available?`<p>${result.explanation}</p>`:''}</div>`:''}</section>`;
  }
  function sequenceHTML(id){
    const a=state.answers[id],commands=a.value?a.value.split(';'):[],turn=id==='recall'?'links':'rechts',result=a.checked?L.check(id,a.value):null;
    return `<section class="question-block"><h3>Baue die Folge aus dem Gedächtnis auf</h3><p class="muted">Hänge die Aktionen in der richtigen Reihenfolge an. Du kannst deinen letzten Schritt zurücknehmen.</p><ol class="sequence-strip" aria-label="Meine aufgebaute Befehlsfolge">${commands.length?commands.map(command=>`<li>${esc(command)}</li>`).join(''):'<li class="empty-slot">Noch keine Aktion</li>'}</ol><div class="toolbar"><button id="sequence-${id}-turn" data-sequence="${id}" data-command="${turn}" ${commands.length>=8?'disabled':''}>${turn} anhängen</button><button id="sequence-${id}-forward" data-sequence="${id}" data-command="vor" ${commands.length>=8?'disabled':''}>vor anhängen</button><button id="sequence-${id}-undo" data-sequence="${id}" data-command="undo" ${commands.length?'':'disabled'}>Letzte Aktion zurücknehmen</button></div><button class="primary" id="check-${id}" data-check="${id}">Meine Folge vergleichen</button>${result?`<div class="feedback ${result.correct?'':'warn'}" role="status"><strong>${!result.available?'Baue zuerst deine Folge auf.':result.correct?'Deine Folge enthält zwei vollständige Durchläufe.':'Vergleiche die Reihenfolge innerhalb der Körper.'}</strong>${result.available?`<p>${result.explanation}</p><p>${result.correct?'Begründe, warum nach jeder Fahrt der nächste Körper beginnt.':'Verbessere deine Folge und begründe die Änderung.'}</p>`:''}</div>`:''}</section>`;
  }
  function afterHTML(id){
    const w=state.work[id],c=L.cases[id],run=currentRun(id),finished=run&&w.attempt.step>=run.trace.length-1;
    const canCompare=finished||(id==='wiederholung'&&w.attempt?.step>=4);
    const question=id==='start'?questionHTML('start','Was ändert „links“?'):id==='wiederholung'?questionHTML('wiederholung','Welche Folge zeigt zwei vollständige Durchläufe?'):'';
    const compare=w.comparison?`<div class="feedback neutral"><strong>Eine Erklärung zum Vergleichen</strong><p>${c.compare}</p><p><strong>Prüfe deine Erklärung:</strong> Nennst du einen konkreten Befehl? Erklärst du seine Folge für Ort, Blick oder Fläche?</p></div>`:'';
    return `${question?`<section class="panel">${question}</section>`:''}<section class="panel"><div class="reflection-header"><h2>Deinen Gedanken festhalten</h2><span>Kurze Notiz oder mündlich erklären</span></div><p class="reflection-question">${c.question}</p><label for="reason">Meine Erklärung${id==='klammer'||id==='flaeche'?' und meine Änderung':''}</label><textarea maxlength="8000" id="reason" data-work="reason" placeholder="Der Befehl … bewirkt …, weil …">${esc(w.reason)}</textarea><div class="reflection-actions"><button id="compare-explanation" data-action="compare" ${canCompare?'':'disabled'}>Erklärung zum Vergleichen öffnen</button><button id="record-button" data-action="record" ${finished?'':'disabled'}>Diesen Lauf mit Erklärung festhalten</button></div><p class="criteria-note">${finished?'Die Erklärung beurteilst du mit dem Vergleich oder im Gespräch.':'Die Erklärung kannst du nach der Untersuchung vergleichen; einen Lauf nach seinem Ende festhalten.'}</p><p class="notice" role="status">${esc(notices[`record-${id}`]||'')}</p>${compare}${w.previous?detail(`old-${id}`,'Vor der Änderung: mein vorheriger Lauf',`<pre>${esc(w.previous.code)}</pre><p>${esc(snapshotPrediction(w.previous.prediction))}</p><p>Die vorherige Fassung bleibt zum Vergleich erhalten. Sie wird nicht als Ergebnis deines neuen Codes verwendet.</p>`):''}${w.records.length?detail(`records-${id}`,`${w.records.length} festgehaltene Vergleiche`,w.records.map((r,i)=>`<article class="record"><strong>Vergleich ${w.records.length-i}</strong><pre>${esc(r.code)}</pre><p>${esc(snapshotPrediction(r.prediction))}</p><p>${esc(r.reason)}</p></article>`).join('')):''}</section>${id==='plan'?detail('extra','Zusatzfrage: Zwei gute Pläne vergleichen',`<p>Vergleicht zwei vollständig reinigende Routen. Welche fährt seltener über bereits saubere Kacheln? Begründet eure Wahl an den Spuren. Eine kurze Route ist eine Zusatzfrage, kein Pflichtziel.</p>`,'panel subsection'):''}`;
  }
  function transferHTML(){return `<section class="panel wide-panel"><h2>Erst ein Werkstück fertig bearbeiten</h2><p>„aufnehmen“ braucht eine freie Station. „prüfen“ braucht ein aufgenommenes Werkstück. „ablegen“ braucht ein geprüftes Werkstück und macht die Station wieder frei.</p><div class="station-states" aria-label="Zustandsfolge"><span>frei</span> → <span>belegt</span> → <span>geprüft</span> → <span>frei</span></div><div class="plans"><div class="plan-card"><strong>Plan A</strong><pre>3 × [aufnehmen;
     prüfen;
     ablegen]</pre></div><div class="plan-card"><strong>Plan B</strong><pre>3 × [aufnehmen]
3 × [prüfen]
3 × [ablegen]</pre></div></div>${questionHTML('station','An welcher Stelle scheitert Plan B zuerst?')}<label for="transfer-note">Was ist hier wie beim Wiederholungskörper des Roboters?</label><textarea maxlength="8000" id="transfer-note" data-note="transfer" placeholder="Ein Durchlauf ist erst fertig, wenn …">${esc(state.notes.transfer)}</textarea></section>${detail('limits','Danach: Was kann unser Modell noch nicht?',`<p>Nach dem Planen stellt jemand einen Stuhl in die Fahrfläche. Kann unser fester Code von selbst passend ausweichen?</p>${questionHTML('hindernis','Kann der feste Plan auf den neuen Stuhl reagieren?')}<p class="muted">Später untersuchst du Sensorinformationen und Bedingungen. In Klasse 7 können dazu optional echte ComThink-Modelle kommen.</p>`,'panel subsection')}${detail('systems','Gemeinsam einordnen: Plan, Ausführung und System',`<p>Eine Zeitsteuerung vergleicht Uhrzeit und Startzeit. Eine Wegberechnung verarbeitet Start, Ziel und Verbindungen. Auf Papier steht eine genaue Schrittfolge; daneben ist nur ein Standbild eines Roboters.</p>${questionHTML('system','Welche Aussage ist begründet?')}<p class="muted">Besprecht anschließend: Welche Verarbeitung muss die Zeitsteuerung leisten? Was könnt ihr aus dem Standbild allein nicht erkennen?</p>`,'panel subsection')}`;}
  function finishHTML(){return `<section class="panel wide-panel completion"><div class="code-display">wiederhole 2 [links; vor]</div>${questionHTML('recall','Welche Folge führt genau diese zwei Durchläufe aus?')}<label for="finish-reason">Begründe die Reihenfolge oder korrigiere deinen ersten Gedanken</label><textarea maxlength="8000" id="finish-reason" data-note="recall" placeholder="Nach dem ersten „vor“ folgt …, weil …">${esc(state.notes.recall)}</textarea></section><section class="panel wide-panel subsection"><h2>Dein Plan ist mehr als eine Fahrt</h2><ul class="skills-list"><li>Du kannst Ort und Blickrichtung unterscheiden.</li><li>Du kannst einen ganzen Wiederholungskörper entfalten.</li><li>Du kannst eine Abweichung finden und gezielt verbessern.</li><li>Du kannst prüfen und erklären, ob eine Fläche vollständig erreicht wird.</li></ul><p>Prüfe für dich: Was kannst du schon an einem neuen Beispiel zeigen? Was möchtest du noch üben? Zeige deine Erklärung an einem konkreten Beispiel.</p><label for="open-question">Das möchte ich noch klären</label><textarea maxlength="8000" id="open-question" data-note="open">${esc(state.notes.open)}</textarea><button class="outline" data-open-save>Meinen Arbeitsstand sichern ↓</button></section>`;}
  function pauseHTML(){return heading({label:'Pause & Rückkehr',title:'Deinen Gedanken wieder aufnehmen.',lead:`Dein letzter Lernschritt: „${L.cases[state.last].short}“. Du kannst direkt weiterarbeiten oder zuerst aus dem Gedächtnis üben.`})+`${restored?'<div class="resume-banner"><span>Dein gespeicherter Code und deine Notizen sind wieder da.</span><button data-action="dismiss-resume">Hinweis schließen</button></div>':''}<div class="transfer-layout"><section class="panel"><h2>Hier geht es für dich weiter</h2><label for="pause-open">Meine offene Frage</label><textarea maxlength="8000" id="pause-open" data-note="open">${esc(state.notes.open)}</textarea><label for="pause-next">Mein nächster Schritt</label><input id="pause-next" type="text" maxlength="8000" data-note="next" value="${esc(state.notes.next)}" placeholder="Zum Beispiel: den Zeilenwechsel prüfen"><div class="reflection-actions"><button class="primary" data-nav="${state.last}">Bei „${L.cases[state.last].short}“ weiter →</button><button data-open-save>Sichern ↓</button></div><p class="muted">Kurze Pause? Du kannst direkt fortsetzen. Beim nächsten Unterrichtstermin lohnt sich erst die Erinnerung daneben.</p></section><section class="panel"><h2>Nach einer längeren Pause: erst erinnern</h2><p>Dein eigener Code bleibt hier verdeckt. Entfalte diese Wiederholung zuerst selbst:</p><div class="code-display">wiederhole 2 [rechts; vor]</div>${questionHTML('returnRecall','Welche Folge gehört dazu?')}<label for="pause-recall">Meine Begründung oder Korrektur</label><textarea maxlength="8000" id="pause-recall" data-note="returnRecall">${esc(state.notes.returnRecall)}</textarea><p class="muted">Wenn du diese Aufgabe noch weißt, erkläre zusätzlich: Wie sähen drei Durchläufe aus? Besprich deine Erklärung bei Bedarf mit deiner Lehrkraft.</p></section></div>`;}

  function refreshWorkspace(){
    const id=state.screen;if(!L.cases[id]?.room)return;
    document.querySelector('#board').innerHTML=boardHTML(id);
    document.querySelector('#after-work').innerHTML=afterHTML(id);
    const preview=document.querySelector('#code-preview');if(preview)preview.innerHTML=codeHTML(state.work[id].code,null);
  }
  function editCode(code){
    const w=state.work[state.screen];
    if(code===w.code)return;
    if(w.attempt)w.previous=JSON.parse(JSON.stringify(w.attempt));
    w.code=code;w.attempt=null;w.comparison=false;notices[state.screen]='';notices[`record-${state.screen}`]='';
    refreshWorkspace();persist();
  }
  function execute(action){
    const id=state.screen,w=state.work[id];if(!w)return;
    notices[id]='';
    if(action==='back'){if(w.attempt)w.attempt.step=Math.max(0,w.attempt.step-1);render();return;}
    if(action==='restart'){if(w.attempt)w.attempt.step=0;render();return;}
    try{
      if(L.cases[id].choice&&w.code.includes('…'))throw new Error('Wähle zuerst einen Drehbefehl im Körper.');
      if(!w.attempt){const checked=L.simulate(id,w.code,w.prediction);w.attempt={code:checked.code,prediction:{...checked.prediction},step:0};}
      const run=currentRun(id),last=run.trace.length-1;
      if(action==='run')w.attempt.step=last;
      else if(action==='body'){
        let next=Math.min(w.attempt.step+1,last);
        const first=run.trace[next];
        if(first.repeat)while(next<last&&run.trace[next+1].line===first.line&&run.trace[next+1].iteration===first.iteration)next++;
        w.attempt.step=next;
      }else w.attempt.step=Math.min(w.attempt.step+1,last);
      const focusId=document.activeElement?.id;render();
      if(document.getElementById(focusId)?.disabled)document.querySelector('#board-title')?.focus({preventScroll:true});
    }catch(error){notices[id]=error.message;render();}
  }
  main.addEventListener('input',e=>{
    const el=e.target;
    if(el.id==='code-input'){editCode(el.value);return;}
    if(el.dataset.work){state.work[state.screen][el.dataset.work]=el.value;persist();}
    if(el.dataset.note){state.notes[el.dataset.note]=el.value;persist();}
  });
  main.addEventListener('change',e=>{
    const el=e.target;
    if(el.id==='turn-choice'){editCode(`wiederhole 4 [vor; ${el.value||'…'}]`);return;}
    if(el.dataset.question){state.answers[el.dataset.question]={value:el.value,checked:false};
      const checkedNotice=el.closest('.question-block')?.querySelector('.feedback');checkedNotice?.remove();persist();}
  });
  main.addEventListener('toggle',e=>{if(e.target.dataset.detail)detailsOpen[e.target.dataset.detail]=e.target.open;},true);
  main.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.nav){navigate(b.dataset.nav);return;}
    if(b.hasAttribute('data-open-save')){openSave();return;}
    if(b.dataset.check){state.answers[b.dataset.check].checked=true;render();return;}
    if(b.dataset.sequence){const a=state.answers[b.dataset.sequence],commands=a.value?a.value.split(';'):[];if(b.dataset.command==='undo')commands.pop();else if(commands.length<8)commands.push(b.dataset.command);a.value=commands.join(';');a.checked=false;render();return;}
    const w=state.work[state.screen];
    if(b.dataset.tile&&w&&!w.attempt){const [x,y]=b.dataset.tile.split(',').map(Number);w.prediction={...w.prediction,x,y};render();return;}
    if(b.dataset.direction!==undefined&&w&&!w.attempt){w.prediction.d=Number(b.dataset.direction);render();return;}
    if(b.dataset.insert){
      const input=document.querySelector('#code-input'),start=input.selectionStart,end=input.selectionEnd;
      const before=input.value.slice(0,start),after=input.value.slice(end);
      const insert=(before&&!before.endsWith('\n')?'\n':'')+b.dataset.insert+(after&&!after.startsWith('\n')?'\n':'');
      const newCode=before+insert+after;input.value=newCode;editCode(newCode);input.focus();input.setSelectionRange(start+insert.length,start+insert.length);return;
    }
    const action=b.dataset.action;
    if(action==='to-board'){const target=document.querySelector('#board-title');target.focus();target.scrollIntoView({block:'start',behavior:'instant'});return;}
    if(action==='to-code'){const target=document.querySelector('#code-input')||document.querySelector('.editor');target.setAttribute('tabindex','-1');target.focus();target.scrollIntoView({block:'start',behavior:'instant'});return;}
    if(['step','body','run','back','restart'].includes(action)){execute(action);return;}
    if(action==='compare'){w.comparison=true;render();return;}
    if(action==='record'){
      if(!w.reason.trim()){notices[`record-${state.screen}`]='Ergänze zuerst deine Erklärung. Ein kurzer Satz zu Befehl und Wirkung reicht.';render();document.querySelector('#reason').focus();return;}
      const run=currentRun();if(!run||w.attempt.step<run.trace.length-1)return;
      w.records.unshift({...JSON.parse(JSON.stringify(w.attempt)),reason:w.reason});w.records=w.records.slice(0,10);
      notices[`record-${state.screen}`]='Dieser Lauf und deine Erklärung sind als Kopie festgehalten. Über „Sichern“ nimmst du sie mit.';render();return;
    }
    if(action==='dismiss-resume'){restored=false;render();}
  });
  document.querySelector('#nav').addEventListener('click',e=>{const b=e.target.closest('[data-nav]');if(b)navigate(b.dataset.nav);});
  document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();navigate('start');});
  document.querySelector('#pause-button').addEventListener('click',()=>navigate('pause'));
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if([...L.ids,'pause'].includes(id)&&id!==state.screen)navigate(id);});
  const dialog=document.querySelector('#save-dialog'),message=document.querySelector('#save-message');
  function openSave(){document.querySelector('#remember').checked=remember;message.textContent=remember?storageNote:'Ohne Sicherung gehen Eingaben beim Neuladen oder Schließen verloren.';dialog.showModal();}
  document.querySelector('#save-button').addEventListener('click',openSave);
  dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
  document.querySelector('#remember').addEventListener('change',e=>{
    remember=e.target.checked;
    if(!remember){try{localStorage.removeItem(storageKey);storageNote='Eingaben nur in diesem Tab';}catch{storageNote='Browsersicherung konnte nicht entfernt werden. Prüfe die Browserdaten.';}}
    persist();message.textContent=storageNote;
  });
  document.querySelector('#export-button').addEventListener('click',()=>{
    try{const json=L.encode(state),blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
      a.href=url;a.download=`sauber-geplant-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);message.textContent='Die Sicherungsdatei wurde zum Download bereitgestellt. Bewahre sie für den nächsten Termin auf.';
    }catch(error){message.textContent=error.message;}
  });
  document.querySelector('#import-file').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;
    pendingImport=null;document.querySelector('#import-preview').innerHTML='';
    try{if(file.size>300000)throw new Error('Die Sicherung ist zu groß (höchstens 300 KB).');pendingImport=L.decode(await file.text());
      document.querySelector('#import-preview').innerHTML=`<div class="feedback neutral"><strong>Sicherung bereit: ${esc(L.cases[pendingImport.last].short)}</strong><p>Beim Übernehmen ersetzt sie deinen jetzigen Stand. Sichere ihn bei Bedarf zuerst als Datei.</p><div class="reflection-actions"><button id="apply-import" class="primary">Diesen Stand übernehmen</button><button id="cancel-import">Abbrechen</button></div></div>`;message.textContent='Die Datei wurde geprüft. Dein aktueller Stand ist noch unverändert.';
    }catch(error){message.textContent=error.message;}finally{e.target.value='';}
  });
  dialog.addEventListener('click',e=>{
    if(e.target.id==='cancel-import'){pendingImport=null;document.querySelector('#import-preview').innerHTML='';message.textContent='Import abgebrochen. Dein Stand bleibt erhalten.';}
    if(e.target.id==='apply-import'&&pendingImport){state=pendingImport;pendingImport=null;state.screen='pause';restored=true;notices={};detailsOpen={};document.querySelector('#import-preview').innerHTML='';history.replaceState(null,'','#pause');dialog.close();render(true);}
  });
  render();
})();
