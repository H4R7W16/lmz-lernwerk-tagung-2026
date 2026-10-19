/* Lokale Moderationsnotizen; kein Versand und keine automatische Auswertung. */
(() => {
  function download(text){
    const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));
    const link=document.createElement('a');
    link.href=url;link.download='lmz-lernwerk-feedback-45min.txt';link.hidden=true;
    document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  const fields=[...document.querySelectorAll('[data-feedback-field]')];
  if(!fields.length){
    // Nur der eigene Kompositionsframe darf die Textsicherung im Host anfordern.
    // Das Sandbox-Fenster selbst darf weiterhin keine Downloads starten.
    if(document.querySelector('hyperframes-slideshow'))window.addEventListener('message',event=>{
      const frame=document.querySelector('hyperframes-player')?.shadowRoot?.querySelector('iframe');
      if(event.origin!==location.origin||event.source!==frame?.contentWindow)return;
      if(event.data?.type!=='lmz-feedback-export'||typeof event.data.text!=='string'||event.data.text.length>200000)return;
      download(event.data.text);
      event.source.postMessage({type:'lmz-feedback-export-ready'},location.origin);
    });
    return;
  }
  const key='lmz-lernwerk-feedback-review-45min-v1';
  const status=[...document.querySelectorAll('[data-feedback-status]')];
  const labels={verstehen:'Verstehen',handeln:'Selbst handeln',pruefen:'Prüfen und weiterlernen'};
  const read=()=>Object.fromEntries(fields.map(field=>[field.dataset.feedbackField,field.value]));
  const report=message=>status.forEach(element=>{element.textContent=message;});
  function restore(value){
    if(!value||typeof value!=='object'||Array.isArray(value))return;
    fields.forEach(field=>{if(typeof value[field.dataset.feedbackField]==='string')field.value=value[field.dataset.feedbackField];});
  }
  try{
    const saved=localStorage.getItem(key);
    if(saved){restore(JSON.parse(saved));report('Sammelstand in diesem Browser wiederhergestellt.');}
  }catch{report('Speichern im Browser nicht verfügbar. Bitte als Text sichern.');}
  function save(){
    try{localStorage.setItem(key,JSON.stringify(read()));report('Sammelstand in diesem Browser gespeichert.');}
    catch{report('Speichern im Browser nicht möglich. Bitte als Text sichern.');}
  }
  fields.forEach(field=>{
    field.addEventListener('input',save);
    // Schreib- und Pfeiltasten gehören hier zum Text, nicht zur Foliensteuerung.
    field.addEventListener('keydown',event=>event.stopPropagation());
    field.addEventListener('keyup',event=>event.stopPropagation());
  });
  window.addEventListener('storage',event=>{
    if(event.key!==key||event.newValue===null)return;
    try{restore(JSON.parse(event.newValue));report('Sammelstand aus einem anderen Fenster aktualisiert.');}catch{}
  });
  window.addEventListener('message',event=>{
    if(event.origin===location.origin&&event.source===parent&&event.data?.type==='lmz-feedback-export-ready')report('Textdatei zum Sichern bereitgestellt.');
  });
  function exportText(){
    const value=read();
    const lines=['LMZ · Lernwerk · Feedback und Fragen','Moderationsnotizen aus der kurzen Sichtung',''];
    Object.entries(labels).forEach(([id,label])=>{
      lines.push(label,'Stelle / Beobachtung: '+(value[id+'-beobachtung']||'—'),'Impuls (erhalten / ändern / prüfen): '+(value[id+'-impuls']||'—'),'');
    });
    lines.push('Offene Frage: '+(value.frage||'—'),'','Nächster Entwicklungsschritt: '+(value.schritt||'—'),'Prüfzeichen: '+(value.pruefzeichen||'—'),'','Eigene Beobachtung, Deutung und Vermutungen über Lernende unterscheiden.');
    const text=lines.join('\n')+'\n';
    if(parent!==window){
      report('Textsicherung angefordert.');
      parent.postMessage({type:'lmz-feedback-export',text},location.origin);
    }else{
      download(text);
      report('Textdatei zum Sichern bereitgestellt.');
    }
  }
  document.querySelectorAll('[data-feedback-export]').forEach(button=>button.addEventListener('click',exportText));
})();
