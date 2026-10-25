/* BIG BROTHER Staff Relation — compact mobile enhancement V2.
   Presentation only. Uses BBMobileFunctionIconsV1 from the dashboard.
   NO changes to Supabase RPCs, request logic, or authorization. */
(function(){
  'use strict';
  if(window.BBStaffRelationCompactMobileV2)return;
  var started=false,pendingFrame=false;

  function makeIcon(name,tone){
    var el=document.createElement('span');
    el.className='bb-sr-icon';
    el.setAttribute('data-bb-icon',name);
    el.setAttribute('data-bb-tone',tone||'blue');
    return el;
  }
  function fillIcons(root){
    var host=root||document;
    var icons=window.BBMobileFunctionIconsV1;
    if(!icons||typeof icons.named!=='function')return;
    var slots=[];
    if(host.matches&&host.matches('.bb-sr-icon[data-bb-icon]:not([data-bb-drawn])'))slots.push(host);
    slots.push.apply(slots,host.querySelectorAll?.('.bb-sr-icon[data-bb-icon]:not([data-bb-drawn])')||[]);
    slots.forEach(function(el){
      var name=el.getAttribute('data-bb-icon');
      el.innerHTML=icons.named(name);
      el.setAttribute('data-bb-drawn','1');
    });
  }
  function updateRefresh(){
    var button=document.getElementById('refreshBtn');
    if(!button)return;
    // Shared renderer replaces textContent after every refresh, so reinstate
    // the SAME outline icon rather than modifying the main renderer.
    if(!button.querySelector('.bb-sr-icon')){
      var caption=button.textContent||'';
      button.setAttribute('aria-label',/staff view/i.test(caption)?'Refresh staff view':'Refresh Staff Relation');
      button.prepend(makeIcon('rotate-ccw','blue'));
      fillIcons(button);
    }
  }
  function updateComparison(){
    var card=document.getElementById('earningCompareCard');
    if(!card)return;
    var heading=card.querySelector('.card-head strong');
    if(heading&&!heading.querySelector('.bb-sr-icon')){
      heading.textContent=heading.textContent.replace(/^📊\s*/u,'');
      heading.prepend(makeIcon('chart-column','blue'));
      fillIcons(heading);
    }
    var head=card.querySelector('.card-head');
    if(head&&!head.querySelector('.bb-sr-compare-toggle')){
      var button=document.createElement('button');
      button.type='button';
      button.className='bb-sr-compare-toggle';
      button.textContent='Details';
      button.setAttribute('aria-expanded','false');
      button.setAttribute('aria-label','Show monthly earning comparison details');
      button.onclick=function(){
        var open=card.classList.toggle('bb-sr-compare-expanded');
        button.textContent=open?'Hide details':'Details';
        button.setAttribute('aria-expanded',String(open));
        button.setAttribute('aria-label',open?'Hide monthly earning comparison details':'Show monthly earning comparison details');
      };
      head.appendChild(button);
    }
    var types={
      '💵':'banknote',
      '💼':'chart-line',
      '🚚':'truck',
      '🎁':'package',
      '➕':'plus'
    };
    card.querySelectorAll('#earningCompareRows tr td:first-child').forEach(function(td){
      if(td.querySelector('.bb-sr-icon'))return;
      var line=td.textContent||'';
      var emoji=Object.keys(types).find(function(k){return line.indexOf(k)===0;});
      if(!emoji)return;
      td.textContent=line.slice(emoji.length).trimStart();
      td.prepend(makeIcon(types[emoji],emoji==='🚚'?'indigo':'blue'));
      fillIcons(td);
    });
  }
  function stripBuiltInEmoji(value){
    // Shared staff engine still prefixes earning names with legacy emojis.
    // Strip ONLY those system symbols on mobile; do not touch user remarks.
    return String(value||'').replace(/(?:💼|🚚|💵|🎁|➕|📊)/gu,'').replace(/ {2,}/g,' ').trim();
  }
  function decorateEarnings(){
    document.querySelectorAll('#earningList .earning-title').forEach(function(title){
      if(title.querySelector('.bb-sr-icon'))return;
      var text=stripBuiltInEmoji(title.textContent);
      title.textContent=text;
      var type=/driver/i.test(text)?'truck':
        /incentive/i.test(text)?'chart-line':
        /special/i.test(text)?'package':
        /salary/i.test(text)?'banknote':'wallet';
      title.prepend(makeIcon(type,/driver/i.test(text)?'indigo':'blue'));
      fillIcons(title);
    });
    // Table labels come from the shared Staff Relation renderer as well.
    document.querySelectorAll('#pendingPaymentRows td:nth-child(3) div, #historyRows td:nth-child(4)').forEach(function(el){
      if(el.dataset.bbSrCleanLabel==='1')return;
      var clean=stripBuiltInEmoji(el.textContent);
      if(clean!==el.textContent)el.textContent=clean;
      el.dataset.bbSrCleanLabel='1';
    });
  }
  function updatePending(){
    var rows=document.getElementById('pendingPaymentRows');
    var card=rows?.closest('.card');
    if(!rows||!card)return;
    var empty=!!rows.querySelector('.empty');
    card.classList.toggle('bb-sr-hidden-empty',empty);
  }
  function ensureAboutEarnings(){
    var page=document.getElementById('page-payment');
    var note=page?.querySelector(':scope > .note');
    if(!note||page.querySelector('.bb-sr-about-earnings'))return;
    var details=document.createElement('details');
    details.className='bb-sr-about-earnings';
    var summary=document.createElement('summary');
    summary.textContent='About staff earnings';
    details.appendChild(summary);
    note.parentNode.insertBefore(details,note);
    details.appendChild(note);
  }
  function wireViewAll(){
    var button=document.getElementById('bbSrViewAllEarnings');
    var page=document.getElementById('page-payment');
    if(!button||!page||button.dataset.bbSrBound)return;
    button.dataset.bbSrBound='1';
    button.addEventListener('click',function(){
      var open=page.classList.toggle('bb-sr-all-earnings');
      button.textContent=open?'Compact':'View All';
      button.setAttribute('aria-expanded',String(open));
    });
  }
  function update(){
    fillIcons(document);
    updateRefresh();
    updateComparison();
    decorateEarnings();
    updatePending();
    ensureAboutEarnings();
    wireViewAll();
  }
  function schedule(){
    if(pendingFrame)return;
    pendingFrame=true;
    requestAnimationFrame(function(){
      pendingFrame=false;
      update();
    });
  }
  function start(){
    if(started)return;
    started=true;
    update();
    var main=document.getElementById('mainContent');
    if(main){
      var observer=new MutationObserver(schedule);
      // All tabs share the Staff Relation renderer. Watch their DOM changes
      // (not a timer) to clean new payment names and keep the SVG style.
      observer.observe(main,{childList:true,subtree:true});
    }
    var refresh=document.getElementById('refreshBtn');
    if(refresh)new MutationObserver(schedule).observe(refresh,{childList:true,subtree:true,characterData:true});
  }
  window.BBStaffRelationCompactMobileV2={update:update};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
