(function mirrorReview(){
 const impulse=document.querySelector('#feedback-schritt'),check=document.querySelector('#feedback-pruefzeichen');
 const update=()=>{const a=document.querySelector('[data-review-impulse]'),b=document.querySelector('[data-review-check]');if(a)a.textContent=impulse?.value.trim()||'Der nächste Arbeitsauftrag entsteht aus den Befunden von eben.';if(b)b.textContent=check?.value.trim()||'Ein beobachtbares Prüfzeichen gemeinsam festhalten.';};
 document.addEventListener('input',event=>{if(event.target===impulse||event.target===check)update();});
 const prior=window.LMZStage.show;window.LMZStage.show=function(id,time){update();return prior.call(this,id,time);};update();
})();