'use strict';
const M = CleaningModel;
const main = document.querySelector('#main');
const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names = ['oben','rechts','unten','links'];
const arrows = ['↑','→','↓','←'];
const cases = {
  einstieg: { room: 'small', title: 'Nach dem Basteln: Wie wird der Boden sauber?',
    lead: 'Auf der freien Bodenfläche liegen Papierkrümel. Unser Modellroboter soll sie reinigen. Du planst seine Fahrt – er führt deine Befehle genau aus.',
    task: 'Lies die drei Befehle. Welche Kacheln erreicht der Roboter? Wo steht er danach und wohin blickt er?',
    code: 'vor\nlinks\nvor', editable: false, next: 'wiederholung', short: 'Erste Fahrt' },
  wiederholung: { room: 'small', title: 'Ein ganzer Körper. Vier Durchläufe.',
    lead: 'Ein Wiederholungskörper enthält alle Befehle in der Klammer. Bei jedem Durchlauf kommen sie in derselben Reihenfolge dran.',
    task: 'Sage den Zustand nach den ersten zwei Befehlen voraus. Prüfe dann zwei Durchläufe. Warum wird bei einer Drehung keine neue Kachel sauber?',
    code: 'wiederhole 4 [vor; links]', editable: false, next: 'koerper', short: 'Wiederholung' },
  koerper: { room: 'main', title: 'Ein kleiner Unterschied in der Klammer.',
    lead: 'Der Plan soll viermal denselben Ablauf ausführen: zwei Kacheln vorfahren und links drehen. Doch das Drehen steht hier außerhalb der Klammer.',
    task: 'Prüfe den Code. Vergleiche ab Aktion 1 mit der Absicht. Wo unterscheidet sich zuerst der Befehl? Korrigiere die Klammer und begründe die Änderung.',
    code: 'wiederhole 4 [vor; vor]\nlinks', editable: true, next: 'flaeche', short: 'Klammerfehler' },
  flaeche: { room: 'main', title: 'Zurück am Start. Aber ist alles sauber?',
    lead: 'Dieser Plan fährt ohne Kollision einmal am Rand entlang. Der Roboter kommt am Start an. Reicht das für unseren Reinigungsauftrag?',
    task: 'Sage voraus, welche Kacheln sauber werden. Prüfe die Fahrt. Ergänze danach selbst einen Weg zu den ausgelassenen Kacheln und teste erneut.',
    code: 'wiederhole 4 [vor; vor; links]', editable: true, next: 'entwurf', short: 'Fläche prüfen' },
  entwurf: { room: 'own', title: 'Jetzt planst du die ganze Fläche.',
    lead: 'Neben dem Basteltisch ist eine größere Fläche frei: vier Kacheln breit und drei Kacheln tief. Dein Roboter startet links unten und blickt nach rechts.',
    task: 'Zeichne zuerst deine eigene Ablaufgrafik auf Papier. Markiere den Wiederholungskörper und seine Anzahl. Schreibe unabhängig davon deinen Code und prüfe, ob er dasselbe bedeutet.',
    code: '', editable: true, next: 'transfer', short: 'Eigener Entwurf' }
};
const work = Object.fromEntries(Object.entries(cases).map(([id,c]) => [id, { code:c.code, prediction:'', reason:'', plan:'', run:null, snapshot:null, step:0, evidence:[], notice:'' }]));
const notes = { recall:'', open:'', next:'', station:'', systems:'', changedRoom:'' };
let screen = cases[location.hash.slice(1)] || ['transfer','rueckkehr'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'einstieg';
let lastWork = 'einstieg';
let recallShown = false;
function fieldList(values) { return values.map(v=>`(${v})`).join(', '); }
function grid(room, trace, step) {
  const now=trace[step], clean=new Set(now.cleaned), size=70, left=30, top=25;
  let svg='';
  for(let x=1;x<=room.width;x++) svg+=`<text x="${left+(x-.5)*size}" y="16" text-anchor="middle" font-size="13">${x}</text>`;
  for(let y=1;y<=room.height;y++) {
    svg+=`<text x="12" y="${top+(y-.5)*size+5}" text-anchor="middle" font-size="13">${y}</text>`;
    for(let x=1;x<=room.width;x++) {
      const px=left+(x-1)*size, py=top+(y-1)*size, done=clean.has(`${x},${y}`);
      svg+=`<rect x="${px}" y="${py}" width="${size}" height="${size}" rx="3" fill="${done?'#d9eee4':'#fff1cd'}" stroke="#9c917e"/><text x="${px+6}" y="${py+15}" font-size="11" fill="#536353">${x},${y}</text>`;
      svg+=done?`<text x="${px+50}" y="${py+57}" font-size="17" fill="#35634d">✓</text>`:`<path d="M${px+22} ${py+30}l7 3-2 7-7-3z M${px+46} ${py+43}l5-4 4 5-6 4z" fill="#a97c34"/>`;
    }
  }
  if(step)svg+=`<polyline points="${trace.slice(0,step+1).map(t=>`${left+(t.pos[0]-.5)*size},${top+(t.pos[1]-.5)*size}`).join(' ')}" fill="none" stroke="#438169" stroke-width="3" stroke-dasharray="5 5"/>`;
  const [x,y,d]=now.pos,cx=left+(x-.5)*size,cy=top+(y-.5)*size;
  svg+=`<circle cx="${cx}" cy="${cy}" r="24" fill="#176657" stroke="#0d4237" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="19" fill="none" stroke="#74ad9d"/><text x="${cx}" y="${cy+8}" text-anchor="middle" font-size="28" fill="white">${arrows[d]}</text>`;
  return `<div class="grid-wrap"><svg class="grid-svg" viewBox="0 0 ${left+room.width*size+4} ${top+room.height*size+4}" role="img" aria-label="Bodenfläche ${room.width} mal ${room.height}. Roboter bei (${x},${y}), Blick ${names[d]}. ${clean.size} von ${room.width*room.height} Kacheln gereinigt.">${svg}</svg></div>`;
}
function codeView(code, activeLine) { return `<pre class="code-view">${code.split('\n').map((line,i)=>`<span class="source-line ${activeLine===i+1?'current':''}">${escapeHTML(line)||' '}</span>`).join('')}</pre>`; }
function hints(id) {
  const specific=id==='flaeche'?'Markiere jede besuchte Kachel genau einmal. Welche Kachel taucht in der Spur nie auf?':id==='entwurf'?'Zerlege die Fläche in Zeilen oder Spalten. Wie wechselst du von einer zur nächsten, ohne den Rand zu überfahren?':'Zeige auf die gesamte Klammer. Lies ihren Inhalt zweimal nacheinander. Wann kommt der erste Drehbefehl?';
  return `<details class="help"><summary>Eine Hilfe für meinen nächsten Schritt</summary><div class="hint-layers"><details><summary>1 · Ort und Blick trennen</summary><p>Stelle einen Gegenstand auf die Startkachel. „vor“ bewegt ihn eine Kachel. „links“ und „rechts“ drehen ihn um eine Vierteldrehung im selben Feld.</p></details><details><summary>2 · Den Ablauf untersuchen</summary><p>${specific}</p></details><details><summary>3 · Eine Stelle begründen</summary><p>„Nach Aktion … steht er bei … und blickt … . Der nächste Befehl … führt deshalb … . Meine Änderung hilft, weil … .“ Du kannst auch auf die Spur zeigen und mündlich erklären.</p></details></div></details>`;
}
function evidenceHTML(w) {
  if(!w.evidence.length)return '';
  return `<section class="card"><h2>Meine festgehaltenen Vergleiche</h2><p class="micro">Kopien dieses Laufs. Spätere Codeänderungen ändern diese Belege nicht. Beim Neuladen gehen sie verloren.</p><div class="evidence-grid">${w.evidence.map((e,i)=>`<article class="evidence-card"><h3>Beleg ${i+1}</h3><p><strong>Vorhergesagt:</strong> ${escapeHTML(e.prediction)}</p><pre>${escapeHTML(e.code)}</pre><p><strong>Prüfergebnis:</strong> ${e.cleaned} Kacheln; ${e.status==='complete'?'Fahrt beendet':e.status==='wall'?'Stopp am Rand':'Schrittgrenze'}.</p><p><strong>Meine Erklärung:</strong> ${escapeHTML(e.reason)}</p></article>`).join('')}</div></section>`;
}
function lesson() {
  const c=cases[screen],w=work[screen],room=M.rooms[c.room];
  const start={pos:room.start,cleaned:[room.start.slice(0,2).join(',')],action:'Start',line:null,iteration:null};
  const trace=w.run?w.run.trace:[start],step=w.run?Math.min(w.step,trace.length-1):0,now=trace[step];
  const total=room.width*room.height;
  const finished=w.run&&step===trace.length-1;
  return `<div class="eyebrow">Reinigungsroboter · ${escapeHTML(c.short)}</div><h1>${c.title}</h1><p class="lead">${c.lead}</p><button class="mobile-jump" data-action="show-room">Bodenfläche ansehen ↓</button><div class="split cleaning-split"><section class="card"><h2>Dein Auftrag</h2><p>${c.task}</p>${screen==='entwurf'?'<div class="own-criteria"><strong>Dein Plan passt, wenn …</strong><p>alle 12 Kacheln besucht werden, kein Schritt am Rand scheitert und mindestens eine feste Wiederholung vorkommt. Start: (1,3), Blick rechts. Endort und Endblick darfst du wählen.</p></div><label for="plan">Notiz zu meiner Ablaufgrafik auf Papier</label><textarea id="plan" data-field="plan" placeholder="Meine Teilflächen und mein Wiederholungskörper …">'+escapeHTML(w.plan)+'</textarea>':''}<h3>Die Befehle</h3>${c.editable?`<label for="code">Mein Code · frei bearbeitbar</label><textarea id="code" data-field="code" class="code-input" spellcheck="false" aria-describedby="syntax">${escapeHTML(w.code)}</textarea><p class="micro" id="syntax">Eine Zeile: vor, links oder rechts. Wiederholung: wiederhole 4 [vor; links]. 2–9 Durchläufe, höchstens 5 Grundbefehle im Körper.</p><div class="toolbar"><button data-add="vor">+ vor</button><button data-add="links">+ links</button><button data-add="rechts">+ rechts</button><button data-add="wiederhole 2 [vor]">+ Wiederholung</button></div>`:`<div class="code">${codeView(w.code,now.line)}</div>`}<p class="micro"><strong>vor</strong>: eine Kachel in Blickrichtung. <strong>links/rechts</strong>: eine Vierteldrehung im selben Feld.</p><label for="prediction">Meine Vorhersage oder Unsicherheit</label><textarea id="prediction" data-field="prediction" placeholder="Erreichte Kacheln, Endort und Blick – ich vermute …, weil …">${escapeHTML(w.prediction)}</textarea><div class="actions"><button class="primary" data-action="step" ${finished?'disabled':''}>${w.run?'Nächste Aktion':'Erste Aktion prüfen'}</button><button data-action="run">Ganzen Code prüfen</button></div><p class="micro">Prüfen geht auch mit einer offenen Vermutung. Ein Vergleichsbeleg braucht deine Erwartung vor dem Lauf.</p><p id="notice" class="run-status" role="status">${escapeHTML(w.notice)}</p>${w.run&&c.editable?`<details class="help"><summary>Ausgeführter Code · aktuelle Zeile</summary>${codeView(w.snapshot.code,now.line)}</details>`:''}${hints(screen)}</section><section class="card soft room-panel" tabindex="-1"><button class="mobile-jump" data-action="show-code">Zu Auftrag und Code ↑</button><div class="room-title"><h2>Die freie Bodenfläche</h2><small>${room.width} × ${room.height} Kacheln</small></div><div class="room-scenery">Basteltisch <span>✂ Papier</span><span>Stifte</span></div>${grid(room,trace,step)}<p class="clean-counter">${now.cleaned.length} von ${total} Kacheln gereinigt</p><div class="room-legend"><span><i></i> Krümel: noch offen</span><span><i class="clean"></i> ✓ besucht</span><span><i class="robot"></i> Roboter &amp; Blick</span></div><div class="step-controls"><button data-action="back" aria-label="Vorige Aktion" ${step===0?'disabled':''}>←</button><strong>Aktion ${step}${w.run?` von ${trace.length-1}`:''}</strong><button data-action="step" aria-label="Nächste Aktion" ${finished?'disabled':''}>→</button></div><p class="step-description" aria-live="polite">${step===0?'Start: ':`Nach „${now.action}“${now.iteration?` · Durchlauf ${now.iteration}`:''}: `}(${now.pos[0]},${now.pos[1]}), Blick ${names[now.pos[2]]}.${now.error?' Der versuchte Schritt liegt außerhalb der Fläche. Der Roboter bleibt stehen.':''}</p>${finished?`<div class="feedback ${w.run.success?'':'warn'}" role="status"><strong>${w.run.success?'Die ganze Fläche ist erreicht.':w.run.status==='wall'?'Stopp am Rand.':w.run.status==='limit'?'Nach 100 Aktionen angehalten.':'Die Fahrt ist beendet. Die Fläche ist noch nicht vollständig.'}</strong><p>${w.run.missing.length?`Noch offen: ${fieldList(w.run.missing)}.`:'Alle vereinbarten Bodenfelder wurden besucht.'}</p>${screen==='entwurf'?`<p>${w.snapshot.hasRepeat?'Eine feste Wiederholung ist enthalten.':'Für deinen Auftrag fehlt noch eine feste Wiederholung.'}</p>`:''}<p>Prüfe jetzt deine Vorhersage und erkläre eine entscheidende Spurstelle.</p></div>`:''}<p class="clean-note"><strong>So gilt es in unserem Modell:</strong> Jede besuchte Kachel zählt als sauber. Die Startkachel zählt mit. Drehen reinigt keine weitere Kachel. Tisch und Stühle stehen außerhalb der freien Fläche. Der Roboter reagiert nicht selbst auf Hindernisse.</p></section></div>${w.run?`<section class="card"><h2>Was zeigt meine Prüfung?</h2><p class="state-note">Vor diesem Lauf festgehalten: ${w.snapshot.prediction?escapeHTML(w.snapshot.prediction):'Noch keine eigene Erwartung. Für einen Beleg: Erwartung eintragen und den ganzen Code erneut prüfen.'}</p><label for="reason">Meine Erklärung zur Spur und zur Änderung</label><textarea id="reason" data-field="reason" placeholder="Entscheidend ist Aktion … . Meine Vorhersage … . Ich ändere …, weil …">${escapeHTML(w.reason)}</textarea><button data-action="record">Diesen Vergleich als Beleg festhalten</button><p class="micro">Die Simulation prüft die Fahrt. Eine Erklärung besprichst du mit der Lehrkraft.</p><p id="record-notice" role="status"></p></section>`:''}${screen==='wiederholung'?`<section class="card"><h2>Deine eigene Ergänzung</h2><p>Zeichne die angefangene Ablaufgrafik auf Papier: Start → wiederhole 4 [vor; …] → Ende. Ergänze den fehlenden Befehl, um die kleine Fläche zu reinigen. Umrahme den ganzen Körper und begründe zwei aufeinanderfolgende Zustände.</p><label for="plan">Mein ergänzter Befehl und meine Erklärung</label><textarea id="plan" data-field="plan">${escapeHTML(w.plan)}</textarea></section>`:''}${evidenceHTML(w)}<div class="actions"><button data-screen="${c.next}">Weiter: ${cases[c.next]?.short||'Weiterdenken'} →</button></div>`;
}
function transfer() { return `<div class="eyebrow">Übertragen &amp; einordnen</div><h1>Was lässt sich übertragen?</h1><p class="lead">Ein Wiederholungskörper ist nicht nur beim Roboter nützlich. Prüfe die Regel in einem anderen Ablauf.</p><section class="card"><h2>Drei Bauteile prüfen</h2><p>Eine Prüfstation beginnt <strong>frei</strong>. „aufnehmen“ braucht frei und macht sie belegt. „prüfen“ braucht belegt und macht sie geprüft. „ablegen“ braucht geprüft und macht sie wieder frei.</p><div class="split"><div class="code"><strong>Plan A</strong><p>3 × [aufnehmen; prüfen; ablegen]</p></div><div class="code"><strong>Plan B</strong><p>3 × [aufnehmen]<br>3 × [prüfen]<br>3 × [ablegen]</p></div></div><label for="station">Führe die ersten drei Aktionen beider Pläne aus. Wo scheitert ein Plan zuerst – und warum?</label><textarea id="station" data-note="station">${escapeHTML(notes.station)}</textarea><p class="micro">Das ist ein manuelles Zustandsmodell. Diese Befehle gehören nicht zur Sprache des Roboters.</p></section><section class="card"><h2>Was kann unser Reinigungsplan noch nicht?</h2><p>Nach dem Planen wird ein Stuhl in die freie Fläche gestellt. Kennt unser Code seine neue Position? Kann der Roboter selbst entscheiden, wie er ausweicht?</p><label for="changedRoom">Meine Erklärung und eine nötige zusätzliche Fähigkeit</label><textarea id="changedRoom" data-note="changedRoom">${escapeHTML(notes.changedRoom)}</textarea><p>Später können Sensoren Informationen über Hindernisse liefern. Wie ein Programm darauf reagiert, untersuchen wir mit Bedingungen in Klasse 7 – optional auch an einem echten ComThink-Modell.</p></section><section class="card"><h2>Plan, Ausführung und digitales System</h2><p><strong>A:</strong> Eine Zeitsteuerung vergleicht Uhrzeit und Startzeit und löst eine Aktion aus. <strong>B:</strong> Eine Wegberechnung verarbeitet Start, Ziel und verfügbare Verbindungen. <strong>C:</strong> Auf Papier steht eine genaue Schrittfolge. <strong>D:</strong> Ein Standbild zeigt nur einen Roboter und Zahlen.</p><label for="systems">Nenne für A und B eine notwendige Verarbeitung. Was kannst du über C und D aussagen, und was bleibt unbekannt?</label><textarea id="systems" data-note="systems">${escapeHTML(notes.systems)}</textarea><p class="micro">Gemeinsame Sicherung: Ein Plan führt sich nicht selbst aus. Aus einem Standbild allein erkennst du keinen Algorithmus.</p></section><button data-screen="rueckkehr">Meinen nächsten Schritt festhalten</button>`; }
function reentry() {
  const w=work[lastWork];
  return `<div class="return-layout"><div class="eyebrow">Pause &amp; Rückkehr</div><h1>Deinen Gedanken wieder aufnehmen.</h1><p class="lead">Du warst bei „${cases[lastWork].short}“. Dein Code bleibt hier zunächst verdeckt.</p><section class="card"><label for="open">Was möchte ich noch klären?</label><textarea id="open" data-note="open">${escapeHTML(notes.open)}</textarea><label for="next">Mein nächster Schritt</label><input id="next" data-note="next" value="${escapeHTML(notes.next)}"><p class="micro">${w.evidence.length} Vergleichsbelege zu diesem Lernschritt. Alles bleibt flüchtig bis zum Neuladen.</p></section><section class="card"><h2>Neuer Termin: erst erinnern</h2><p>Schreibe einen Wiederholungskörper mit zwei verschiedenen Befehlen aus dem Gedächtnis. Entfalte zwei Durchläufe. Begründe einen Zustand oder benenne eine Unsicherheit.</p><label for="recall">Meine Erinnerung</label><textarea id="recall" data-note="recall">${escapeHTML(notes.recall)}</textarea><button data-action="recall">Vergleich öffnen</button><p id="recall-notice" role="status"></p>${recallShown?'<div class="feedback"><strong>Vergleiche deine Körperregel.</strong><p>In jedem Durchlauf werden alle Befehle in der Klammer der Reihe nach ausgeführt. Zeige das an deiner Erinnerung. Die Anzahl der Durchläufe ist nicht die Anzahl einzelner Aktionen.</p></div>':''}</section><button data-screen="${lastWork}">Zu meinem letzten Arbeitsstand</button><p class="micro" style="margin-top:15px">Bei einer kurzen Pause kannst du direkt fortsetzen. Ob ein zeitlich verzögerter Abruf geplant ist, klärt die Lehrkraft. Diese Vorschau besitzt noch keine dauerhafte Speicherung.</p></div>`;
}
function render(focus=false) {
  main.innerHTML=screen==='transfer'?transfer():screen==='rueckkehr'?reentry():lesson();
  document.querySelectorAll('[data-screen]').forEach(b=>{if(b.dataset.screen===screen)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  if(focus){main.focus();main.scrollIntoView({block:'start'});}
}
function navigate(id) { if(cases[id])lastWork=id; screen=cases[id]||['transfer','rueckkehr'].includes(id)?id:'einstieg'; if(location.hash!==`#${screen}`)location.hash=screen;else render(true); }
function execute(w) {
  try {
    const program=M.parse(w.code);
    w.run=M.run(M.rooms[cases[screen].room],program);
    w.snapshot={code:w.code,prediction:w.prediction,hasRepeat:program.some(b=>b.repeat)};
    w.step=0;w.notice='';return true;
  } catch(error) { w.run=null;w.snapshot=null;w.step=0;w.notice=error.message;return false; }
}
document.addEventListener('input',event=>{
  const el=event.target;
  if(el.dataset.note)notes[el.dataset.note]=el.value;
  if(el.dataset.field&&work[screen]) {
    const w=work[screen];w[el.dataset.field]=el.value;
    if(el.dataset.field==='code'&&w.run) {
      w.run=null;w.snapshot=null;w.step=0;w.notice='Code geändert. Prüfe die neue Fassung. Festgehaltene Belege bleiben erhalten.';
      // Keep the editing element and caret in place; mark the visible old result until rerender.
      const oldPanel=main.querySelector('.room-panel');
      if(oldPanel)oldPanel.innerHTML='<h2>Neue Codefassung</h2><p>Die angezeigte Fahrt gehört zum vorherigen Code. Prüfe deine neue Fassung, um die aktuelle Spur zu sehen.</p>';
      const stepButton=main.querySelector('.primary[data-action="step"]');
      if(stepButton){stepButton.disabled=false;stepButton.textContent='Erste Aktion prüfen';}
      main.querySelector('#notice').textContent=w.notice;
    }
  }
});
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.screen){navigate(button.dataset.screen);return;}
  if(button.dataset.add){const w=work[screen];w.code+=(w.code.trim()?'\n':'')+button.dataset.add;w.run=null;w.snapshot=null;w.step=0;w.notice='Code ergänzt. Prüfe die neue Fassung.';render();main.querySelector('#code').focus();return;}
  const action=button.dataset.action;
  if(action==='show-room'||action==='show-code'){const target=action==='show-room'?main.querySelector('.room-panel'):main.querySelector('.cleaning-split > .card');target.setAttribute('tabindex','-1');target.focus();target.scrollIntoView({block:'start'});return;}
  if(action==='recall'){if(!notes.recall.trim()){document.querySelector('#recall-notice').textContent='Notiere zuerst eine Erinnerung oder Unsicherheit.';return;}recallShown=true;render();return;}
  if(!work[screen])return;
  const w=work[screen];
  if(action==='run'){if(execute(w))w.step=w.run.trace.length-1;}
  if(action==='step'){if(w.run||execute(w))w.step=Math.min(w.step+1,w.run.trace.length-1);}
  if(action==='back'&&w.run)w.step=Math.max(0,w.step-1);
  if(action==='record'){
    const notice=document.querySelector('#record-notice');
    if(!w.run||!w.snapshot){notice.textContent='Der Code wurde geändert. Prüfe erst die neue Fassung.';return;}
    if(!w.snapshot.prediction.trim()){notice.textContent='Dieser Lauf hat keine vorher erfasste Erwartung. Trage eine Vorhersage ein und prüfe den ganzen Code erneut.';return;}
    if(w.step!==w.run.trace.length-1){notice.textContent='Prüfe zuerst bis zum Ende der Fahrt.';return;}
    if(!w.reason.trim()){notice.textContent='Begründe eine Spurstelle oder eine Änderung, bevor du den Beleg festhältst.';document.querySelector('#reason').focus();return;}
    w.evidence.push({...w.snapshot,reason:w.reason,cleaned:w.run.cleaned.length,status:w.run.status});w.notice='Vergleichsbeleg in dieser Seite festgehalten. Noch keine fachliche Bewertung.';
  }
  if(action){
    const inRoom=!!button.closest('.room-panel');
    const labelled=button.hasAttribute('aria-label');
    render();
    const target=main.querySelector(`[data-action="${action}"]${labelled?'[aria-label]':''}`);
    if(target&&!target.disabled)target.focus({preventScroll:true});
    else (inRoom?main.querySelector('.room-panel'):main).focus({preventScroll:true});
  }
});
window.addEventListener('hashchange',()=>{if(location.hash==='#main'){main.focus();return;}const id=location.hash.slice(1);screen=cases[id]||['transfer','rueckkehr'].includes(id)?id:'einstieg';if(cases[screen])lastWork=screen;render(true);});
if(matchMedia('(max-width:650px)').matches)document.querySelector('#way-details').open=false;
if(cases[screen])lastWork=screen;
render();
