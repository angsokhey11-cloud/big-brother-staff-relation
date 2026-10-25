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
  function updateToast(){
    var toast=document.getElementById('toast');
    if(!toast||toast.querySelector('.bb-sr-icon'))return;
    var msg=toast.textContent||'';
    if(!msg.includes('✅'))return;
    toast.textContent=msg.replace(/✅/gu,'').trim();
    toast.prepend(makeIcon('circle-check','teal'));
    fillIcons(toast);
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
  /* V3 Available Payment: one transaction per row, grouped by earning type,
     with oldest dates first within each group. Moves existing live nodes
     so native selection handlers, IDs and currencies remain unchanged. */
  var paymentCategories=[
    {key:'sales',label:'Sales Incentive',icon:'chart-line',tone:'blue'},
    {key:'driver',label:'Driver Allowance',icon:'truck',tone:'indigo'},
    {key:'salary',label:'Salary',icon:'banknote',tone:'teal'},
    {key:'special',label:'Special Allowance',icon:'package',tone:'violet'},
    {key:'other',label:'Other Earnings',icon:'wallet',tone:'blue'}
  ];
  var monthNumbers={
    jan:1,feb:2,mar:3,apr:4,may:5,jun:6,
    jul:7,aug:8,sep:9,oct:10,nov:11,dec:12
  };
  function categoryFor(row){
    var title=stripBuiltInEmoji(row.querySelector('.earning-title')?.textContent||'')
      .toLowerCase();
    if(title.includes('sales incentive')||title.includes('incentive adjustment'))return 'sales';
    if(title.includes('driver')||title.includes('allowance adjustment'))return 'driver';
    if(title.includes('special allowance'))return 'special';
    if(title.includes('salary'))return 'salary';
    return 'other'; // Never discard unexpected future earning types.
  }
  function paymentDate(row){
    var text=String(row.querySelector('.earning-meta')?.textContent||'');
    var date=text.match(/\b(\d{1,2})-([A-Za-z]{3})-(\d{4})\b/);
    if(date){
      var month=monthNumbers[date[2].toLowerCase()];
      if(month)return (+date[3])*10000+month*100+(+date[1]);
    }
    var month=text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/i);
    if(month)return (+month[2])*10000+monthNumbers[month[1].slice(0,3).toLowerCase()]*100+1;
    // Missing dates go last, rather than accidentally being treated as new.
    return Number.MAX_SAFE_INTEGER;
  }
  function groupEarnings(){
    var list=document.getElementById('earningList');
    if(!list)return;
    // The main renderer creates direct .earning children on every data refresh.
    // Already-grouped rows never need a second DOM move.
    var rows=Array.from(list.children).filter(function(el){return el.classList.contains('earning');});
    if(!rows.length)return;
    var groups=new Map();
    paymentCategories.forEach(function(category){groups.set(category.key,[]);});
    rows.forEach(function(row,index){
      var key=categoryFor(row);
      var item={row:row,index:index,date:paymentDate(row)};
      groups.get(key).push(item);
      // A category heading already identifies a normal earning type;
      // retain role/adjustment labels to distinguish special line items.
      var title=stripBuiltInEmoji(row.querySelector('.earning-title')?.textContent||'');
      var simple=(key==='sales'&&title==='Sales Incentive')||
        (key==='salary'&&title==='Monthly Salary')||
        (key==='special'&&title==='Special Allowance');
      row.classList.toggle('bb-sr-payment-simple',simple);
    });
    var fragment=document.createDocumentFragment();
    paymentCategories.forEach(function(category){
      var items=groups.get(category.key);
      if(!items.length)return; // No empty category.
      items.sort(function(a,b){
        if(a.date!==b.date)return a.date-b.date;
        var idA=a.row.querySelector('.earning-check')?.value||'';
        var idB=b.row.querySelector('.earning-check')?.value||'';
        var numericIdA=Number(idA),numericIdB=Number(idB);
        if(idA&&idB&&Number.isFinite(numericIdA)&&Number.isFinite(numericIdB)&&numericIdA!==numericIdB)
          return numericIdA-numericIdB;
        return a.index-b.index;
      });
      var section=document.createElement('section');
      section.className='bb-sr-payment-group';
      section.dataset.category=category.key;
      var head=document.createElement('div');
      head.className='bb-sr-payment-group-head';
      head.appendChild(makeIcon(category.icon,category.tone));
      var label=document.createElement('strong');
      label.textContent=category.label;
      head.appendChild(label);
      var count=document.createElement('span');
      count.className='bb-sr-payment-group-count';
      count.textContent=String(items.length);
      count.setAttribute('aria-label',items.length+' payment'+(items.length===1?'':'s'));
      head.appendChild(count);
      section.appendChild(head);
      var body=document.createElement('div');
      body.className='bb-sr-payment-group-rows';
      items.forEach(function(item){body.appendChild(item.row);});
      section.appendChild(body);
      fragment.appendChild(section);
    });
    list.replaceChildren(fragment);
    fillIcons(list);
  }
  function update(){
    fillIcons(document);
    updateRefresh();
    updateComparison();
    decorateEarnings();
    groupEarnings();
    updateToast();
    updatePending();
    ensureAboutEarnings();
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
    var toast=document.getElementById('toast');
    if(toast)new MutationObserver(schedule).observe(toast,{childList:true,subtree:true,characterData:true});
  }
  window.BBStaffRelationCompactMobileV2={update:update};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
