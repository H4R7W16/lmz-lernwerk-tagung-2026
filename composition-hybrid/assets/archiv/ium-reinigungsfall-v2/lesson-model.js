'use strict';
(function(root){
  const M=typeof module!=='undefined'&&module.exports?require('./cleaning-core.js'):root.CleaningModel;
  const rooms={small:M.rooms.small,main:M.rooms.main,own:M.rooms.own,turned:{width:2,height:2,start:[2,1,2]}};
  const cases={
    start:{short:'Bewegen & drehen',label:'Entdecken',title:'Du planst. Der Roboter fährt.',lead:'Nach dem Basteln liegen Papierkrümel auf dem Boden. Hilf unserem Modellroboter beim Reinigen. Entdecke zuerst seine Befehle.',task:'Prüfe erst „vor“, dann „links“. Was verändert sich jeweils?',room:'small',code:'vor\nlinks',editable:false,goal:'Bewegen und Drehen unterscheiden.',question:'Was ändert „links“ am Roboter?',compare:'„vor“ ändert den Ort. „links“ dreht den Roboter auf derselben Kachel. Ort und Blickrichtung zusammen nennen wir hier seinen Zustand.',hints:['Fahre mit dem Finger eine Kachel in Richtung des Pfeils.','Drehe einen Stift auf der Kachel um eine Vierteldrehung nach links. Er bleibt am selben Ort.']},
    vorhersage:{short:'Erst vorhersagen',label:'Selbst versuchen',title:'Wo endet diese kleine Fahrt?',lead:'Jetzt kommen drei Befehle zusammen. Lege vor dem Prüfen fest, wo der Roboter am Ende steht und wohin er blickt.',task:'Wähle eine Endkachel und eine Blickrichtung. Prüfe anschließend deine Vermutung.',room:'small',code:'vor\nlinks\nvor',editable:false,goal:'Einen kurzen Ablauf im Kopf verfolgen.',predict:true,question:'Welche Rolle spielt die Drehung für den letzten Vorwärtsbefehl?',compare:'Nach dem ersten „vor“ steht er rechts unten. „links“ dreht ihn nach oben. Deshalb führt das letzte „vor“ nach rechts oben.',hints:['Beginne links unten. Der Pfeil zeigt nach rechts.','Trenne die drei Aktionen: fahren – am Ort drehen – in die neue Richtung fahren.']},
    wiederholung:{short:'Die Klammer verstehen',label:'Beispiel untersuchen',title:'Immer der ganze Ablauf.',lead:'Alles in der Klammer bildet einen Wiederholungskörper. Erst wenn alle seine Befehle ausgeführt sind, beginnt der nächste Durchlauf.',task:'Prüfe zwei Durchläufe. Beobachte, wie „vor“ und „links“ sich abwechseln.',room:'small',code:'wiederhole 4 [vor; links]',editable:false,goal:'Den ganzen Körper in jedem Durchlauf erkennen.',question:'Warum wird beim Drehen keine weitere Kachel sauber?',compare:'Der Roboter dreht sich auf der Kachel, die er schon erreicht hat. Erst eine Fahrt auf eine bisher unbesuchte Kachel erhöht die Zahl.',hints:['Die Klammer enthält zwei Aktionen: erst „vor“, dann „links“.','Ein Durchlauf ist vor → links. Erst danach folgt wieder vor → links.']},
    ergaenzung:{short:'Selbst ergänzen',label:'Eine neue Aufgabe',title:'Anderer Start. Welcher Körper passt?',lead:'Der Roboter steht diesmal rechts oben und blickt nach unten. Ergänze den Drehbefehl für eine Runde über alle vier Kacheln.',task:'Wähle „links“ oder „rechts“. Verfolge zuerst einen Durchlauf im Kopf, dann prüfe deine Wahl.',room:'turned',code:'wiederhole 4 [vor; …]',editable:true,choice:true,goal:'Das Gelernte bei einer neuen Startlage anwenden.',question:'Warum passt deine Drehung zu dieser Startlage?',compare:'Nach dem ersten „vor“ steht er rechts unten und blickt nach unten. Eine Rechtsdrehung richtet ihn nach links aus – zur nächsten freien Kachel.',hints:['Stelle dir vor, du blickst selbst nach unten im Bild. Wo liegt dann deine rechte Seite?','Prüfe nur den ersten Durchlauf. Zeigt der Pfeil danach zur Nachbarkachel oder nach draußen?']},
    klammer:{short:'Einen Fehler finden',label:'Prüfen & verbessern',title:'Der Plan und die Fahrt passen noch nicht zusammen.',lead:'Die Absicht lautet: viermal zwei Kacheln vorfahren und links drehen. Untersuche, ob der Code diese Absicht erfüllt.',task:'Prüfe die Fahrt in kleinen Schritten. Finde die erste Abweichung von der Absicht und verbessere den Code.',room:'main',code:'wiederhole 4 [vor; vor]\nlinks',editable:true,goal:'Die Klammer so setzen, dass die ganze Randrunde gelingt.',question:'Welche Aktion sollte vor dem zweiten Durchlauf noch stattfinden?',compare:'Nach zwei Vorwärtsbefehlen muss „links“ folgen. Steht es außerhalb der Klammer, wird zunächst weiter vorgefahren. Die Drehung gehört in jeden Durchlauf.',hints:['Vergleiche die ersten drei gewünschten Aktionen mit den tatsächlich ausgeführten.','Welche Befehle werden bei jedem Durchlauf wiederholt? Welche erst nach allen Durchläufen?']},
    flaeche:{short:'Alles sauber?',label:'Genau hinsehen',title:'Eine Runde fertig. Und der Boden?',lead:'Der Roboter kann am Start ankommen, obwohl sein Auftrag noch nicht erledigt ist. Prüfe deshalb die ganze Fläche.',task:'Prüfe diesen Plan. Finde eine noch schmutzige Kachel und ergänze einen Weg dorthin.',room:'main',code:'wiederhole 4 [vor; vor; links]',editable:true,goal:'Alle neun Kacheln erreichen, ohne am Rand zu scheitern.',question:'Welche deiner ergänzten Aktionen erreicht eine neue Kachel?',compare:'Die Randrunde lässt die Mitte frei. Eine Ergänzung muss von der Endposition aus ins Innere führen. Begründe deine Lösung an einer konkreten Aktion.',hints:['Achte auf die Krümel, nicht nur auf den Endort.','Nach der Randrunde steht er links unten und blickt nach rechts. Plane von dort eine Fahrt zur Mitte.']},
    plan:{short:'Mein Reinigungsplan',label:'Eigenständig planen',title:'Dein Plan für die größere Fläche.',lead:'Vier Kacheln breit, drei Kacheln tief: Entwickle eine eigene Route. Es gibt mehrere gute Lösungen.',task:'Skizziere deinen Ablauf auf Papier, markiere Körper und Anzahl einer Wiederholung und übertrage deinen Plan in Code.',room:'own',code:'',editable:true,goal:'Zwölf Kacheln, kein Randfehler, mindestens eine Wiederholung.',question:'Wie sorgt dein Plan dafür, dass keine Kachel ausgelassen wird?',compare:'Zeige, welche Teilflächen dein Plan nacheinander abdeckt. Erkläre den Wechsel zwischen ihnen und wo deine Wiederholung Arbeit übernimmt. Endort und Blickrichtung sind frei.',hints:['Teile die Fläche in Zeilen oder Spalten. Plane zunächst nur eine davon.','Für die untere Zeile brauchst du drei Vorwärtsaktionen. Danach musst du die nächste Zeile erreichen und in sie hineinschauen.']},
    transfer:{short:'Übertragen',label:'Weiterdenken',title:'Ein ganzer Arbeitsgang – auch anderswo.',lead:'Nach dem Basteln werden drei Werkstücke geprüft und weggelegt. Eine kleine Prüfstation nimmt immer nur ein Werkstück auf.',task:'Vergleiche die zwei Pläne. Verfolge dabei den Zustand der Prüfstation.',goal:'Die Körperregel in einem anderen Ablauf erklären.'},
    abschluss:{short:'Was ich jetzt kann',label:'Sichern',title:'Zeig dir selbst, was du verstanden hast.',lead:'Eine neue kleine Aufgabe: Lies den Code und entfalte zwei Durchläufe, bevor du den Vergleich öffnest.',task:'Welche Folge passt zu wiederhole 2 [links; vor]?',goal:'Eine neue Wiederholung eigenständig entfalten und begründen.'}
  };
  const ids=Object.keys(cases),questionIds=['start','wiederholung','station','hindernis','system','recall','returnRecall'];
  function fresh(){return {screen:'start',last:'start',seen:[],work:Object.fromEntries(ids.filter(id=>cases[id].room).map(id=>[id,{code:cases[id].code,prediction:{},reason:'',plan:'',attempt:null,previous:null,records:[],comparison:false}])),answers:Object.fromEntries(questionIds.map(id=>[id,{value:'',checked:false}])),notes:{open:'',next:'',transfer:'',recall:'',returnRecall:''}};}
  function simulate(id,code,prediction){
    const program=M.parse(code),result=M.run(rooms[cases[id].room],program);
    const expanded=[];
    for(const block of program)for(let n=1;n<=block.count;n++)block.body.forEach((action,bodyIndex)=>expanded.push({bodyIndex,count:block.count,repeat:block.repeat,iteration:block.repeat?n:null,line:block.line,action}));
    result.trace=result.trace.map((s,i)=>i?{...s,...expanded[i-1]}:{...s,bodyIndex:null,count:null});
    return {...result,code,program,prediction:{...prediction},hasRepeat:program.some(b=>b.repeat)};
  }
  function predictionResult(run){
    const p=run.prediction;
    const available=Number.isInteger(p.x)&&Number.isInteger(p.y)&&Number.isInteger(p.d);
    return {available,correct:available&&run.end.every((v,i)=>v===[p.x,p.y,p.d][i])};
  }
  function criteria(id,run){
    const safe=run.status==='complete';
    if(['start','vorhersage','wiederholung'].includes(id))return [];
    if(id==='klammer')return [{id:'safe',label:'Fahrt ohne Randfehler beendet',met:safe},{id:'body',label:'Zwei Vorwärtsbefehle und eine Linksdrehung gemeinsam wiederholt',met:run.program.some(b=>b.repeat&&b.count===4&&b.body.join(';')==='vor;vor;links')}];
    const checks=[{id:'coverage',label:`Alle ${rooms[cases[id].room].width*rooms[cases[id].room].height} Kacheln erreicht`,met:run.missing.length===0},{id:'safe',label:'Kein Schritt scheitert am Rand',met:safe}];
    if(id==='plan')checks.push({id:'repeat',label:'Mindestens eine feste Wiederholung verwendet',met:run.hasRepeat});
    return checks;
  }
  function check(id,value){
    const answers={
      start:{answer:'direction',explanation:'„links“ ändert nur die Blickrichtung. Der Roboter bleibt auf derselben Kachel.'},
      wiederholung:{answer:'body',explanation:'Ein Durchlauf ist vor → links. Zwei Durchläufe sind vor → links | vor → links. Die Klammer wird jedes Mal vollständig ausgeführt.'},
      station:{answer:'second',explanation:'Plan B scheitert schon beim zweiten „aufnehmen“: Die Station ist noch belegt. Plan A legt jedes geprüfte Werkstück ab und macht die Station vor dem nächsten Durchlauf wieder frei.'},
      hindernis:{answer:'no',explanation:'Unser fester Ablauf kennt den neu aufgestellten Stuhl nicht. Für eine Reaktion braucht ein reales System Informationen über das Hindernis und Regeln, wie es darauf reagieren soll.'},
      system:{answer:'process',explanation:'Eine Wegberechnung verarbeitet Start, Ziel und Verbindungen. Eine genaue Schrittfolge auf Papier kann einen Algorithmus beschreiben, führt sich aber nicht selbst aus. Ein Standbild allein zeigt keine Ausführung.'},
      returnRecall:{answer:'body',explanation:'Zwei vollständige Durchläufe: rechts → vor | rechts → vor. Jeder Durchlauf enthält zuerst die Drehung, dann die Fahrt.'},
      recall:{answer:'body',explanation:'Richtig entfaltet: links → vor | links → vor. Erst den ganzen Körper ausführen, dann den nächsten Durchlauf beginnen. links → links → vor → vor gruppiert stattdessen die Einzelbefehle.'}
    };
    const a=answers[id];if(!a)throw new Error('Unbekannte Vergleichsfrage.');
    const expected=id==='recall'?'links;vor;links;vor':id==='returnRecall'?'rechts;vor;rechts;vor':a.answer;
    return {available:!!value,correct:value===expected,explanation:a.explanation};
  }
  function encode(state){const text=JSON.stringify({format:'ium-cleaning-v2',version:1,savedAt:new Date().toISOString(),state},null,2);decode(text);return text;}
  function decode(text){
    if(typeof text!=='string'||new TextEncoder().encode(text).length>300000)throw new Error('Diese Sicherung ist zu groß (höchstens 300 KB).');
    let doc;try{doc=JSON.parse(text);}catch{throw new Error('Die Datei ist keine lesbare JSON-Sicherung.');}
    if(!doc||doc.format!=='ium-cleaning-v2'||doc.version!==1)throw new Error('Diese Datei gehört nicht zur Reinigungsfall-Version 2 oder verwendet ein unbekanntes Format.');
    const raw=doc.state,out=fresh();
    const object=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
    if(!object(raw)||!object(raw.work)||!object(raw.answers)||!object(raw.notes))throw new Error('Die Sicherung ist unvollständig. Dein jetziger Stand bleibt erhalten.');
    function str(v,max=8000){if(typeof v!=='string'||v.length>max)throw new Error('Die Sicherung enthält ungültige oder zu lange Eingaben.');return v;}
    function pred(p){if(!object(p))throw new Error('Ungültige Vorhersage.');const result={};for(const [k,max] of [['x',4],['y',3],['d',3]])if(p[k]!==undefined){if(!Number.isInteger(p[k])||p[k]<(k==='d'?0:1)||p[k]>max)throw new Error('Ungültige Kachel oder Blickrichtung.');result[k]=p[k];}return result;}
    function attempt(a){if(a===null)return null;if(!object(a)||!Number.isInteger(a.step)||a.step<0||a.step>100)throw new Error('Ungültiger Prüfstand.');return {code:str(a.code,10000),prediction:pred(a.prediction),step:a.step};}
    if(![...ids,'pause'].includes(raw.screen)||!ids.includes(raw.last))throw new Error('Unbekannter Lernschritt.');
    out.screen=raw.screen;out.last=raw.last;out.seen=Array.isArray(raw.seen)?ids.filter(id=>raw.seen.includes(id)):[];
    for(const id of Object.keys(out.work)){
      const w=raw.work[id];if(!object(w)||!Array.isArray(w.records)||w.records.length>10)throw new Error('Ungültige Arbeitsnotizen.');
      const code=str(w.code,10000);if(!cases[id].editable&&code!==cases[id].code)throw new Error('Ein festes Beispiel wurde in der Sicherung verändert.');
      out.work[id]={code,prediction:pred(w.prediction),reason:str(w.reason),plan:str(w.plan),attempt:attempt(w.attempt),previous:attempt(w.previous),comparison:w.comparison===true,records:w.records.map(r=>{
        if(!object(r))throw new Error('Ungültiger Vergleich.');const a=attempt(r);if(!a)throw new Error('Leerer Vergleich.');return {...a,reason:str(r.reason)};
      })};
      if(out.work[id].attempt&&out.work[id].attempt.code!==code)throw new Error('Prüflauf und Codefassung passen in dieser Sicherung nicht zusammen.');
      for(const saved of [out.work[id].attempt,out.work[id].previous,...out.work[id].records])if(saved){
        let run;try{run=simulate(id,saved.code,saved.prediction);}catch{throw new Error('Die Sicherung enthält einen nicht ausführbaren Prüflauf.');}
        if(saved.step>=run.trace.length)throw new Error('Ein gespeicherter Schritt liegt außerhalb des Prüflaufs.');
      }
    }
    for(const id of questionIds){const a=raw.answers[id];if(!object(a))throw new Error('Eine Antwort fehlt.');out.answers[id]={value:str(a.value,80),checked:a.checked===true};}
    for(const key of Object.keys(out.notes))out.notes[key]=str(raw.notes[key]);
    return out;
  }
  const api={rooms,cases,ids,questionIds,fresh,simulate,predictionResult,criteria,check,encode,decode};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CleaningLesson=api;
})(globalThis);
