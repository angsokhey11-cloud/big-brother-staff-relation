/* BIG BROTHER Staff Relation — Desktop Workspace V1.
 * Presentation only. The existing Staff Relation controller remains the sole
 * owner of payment calculations, selection state, staff authorization, and RPCs.
 * Shares the exact professional outline SVG family with BIG BROTHER Mobile.
 */
(function(){
  'use strict';
  if(window.BBStaffRelationDesktopV1)return;
  if(!document.body.classList.contains('bb-sr-desktop-v1'))return;

  var categories=[
    {key:'sales',label:'Sales Incentive',icon:'chart-line',tone:'blue'},
    {key:'driver',label:'Driver Allowance',icon:'truck',tone:'indigo'},
    {key:'salary',label:'Salary',icon:'banknote',tone:'teal'},
    {key:'special',label:'Special Allowance',icon:'package',tone:'violet'},
    {key:'other',label:'Other Earnings',icon:'wallet',tone:'blue'}
  ];
  var prefixes=/^(?:💼|🚚|💵|🎁|➕|📊|✅|🔎|🔐|↻)\s*/u;
  function cleanLabel(value){return String(value||'').replace(prefixes,'').trim();}
  function icon(name,tone){
    var el=document.createElement('span');
    el.className='bb-sr-icon';
    el.dataset.bbIcon=name;
    el.dataset.bbTone=tone||'blue';
    drawIcon(el);
    return el;
  }
  function drawIcon(node){
    if(!node||node.dataset.bbDrawn)return;
    var library=window.BBMobileFunctionIconsV1;
    if(!library||typeof library.named!=='function')return;
    var name=node.dataset.bbIcon;
    if(!name)return;
    node.innerHTML=library.named(name);
    node.dataset.bbDrawn='1';
  }
  function icons(root){
    (root||document).querySelectorAll('.bb-sr-icon[data-bb-icon]').forEach(drawIcon);
  }
  function category(item){
    var t=String(item?.earningType||'').toUpperCase();
    if(t==='SALES_INCENTIVE'||t==='INCENTIVE_ADJUSTMENT')return 'sales';
    if(t==='DRIVER_ALLOWANCE'||t==='ALLOWANCE_ADJUSTMENT')return 'driver';
    if(t==='MONTHLY_SALARY')return 'salary';
    if(t==='SPECIAL_ALLOWANCE')return 'special';
    return 'other';
  }
  function recordDate(item){
    // ISO source dates from authorized backend; original order breaks ties.
    var raw=String(item?.sourceDate||item?.salaryMonth||'').trim();
    if(/^\d{4}-\d{2}-\d{2}/.test(raw))return raw.slice(0,10);
    return '9999-12-31';
  }
  function formatAmount(n,currency){
    var number=Number(n);
    if(!Number.isFinite(number))number=0;
    if(String(currency||'USD').toUpperCase()==='KHR')
      return '៛'+number.toLocaleString('en-US',{maximumFractionDigits:0});
    return '$'+number.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function enhanceRefresh(){
    var button=document.getElementById('refreshBtn');
    if(!button)return;
    // The controller rewrites textContent on each Staff Relation refresh.
    button.textContent=cleanLabel(button.textContent)||'Refresh';
    button.prepend(icon('rotate-ccw','blue'));
  }
  function enhanceComparison(){
    var card=document.getElementById('earningCompareCard');
    if(!card)return;
    var head=card.querySelector('.card-head');
    var title=head?.querySelector('strong');
    if(title&&!title.querySelector('.bb-sr-icon')){
      title.textContent=cleanLabel(title.textContent);
      title.prepend(icon('chart-column','blue'));
    }
    if(head&&!head.querySelector('.bb-sr-compare-toggle')){
      var toggle=document.createElement('button');
      toggle.type='button';
      toggle.className='bb-sr-compare-toggle';
      toggle.setAttribute('aria-expanded','false');
      toggle.setAttribute('aria-label','Show monthly earnings comparison details');
      toggle.textContent='View details';
      toggle.addEventListener('click',function(){
        var expanded=card.classList.toggle('bb-sr-compare-expanded');
        toggle.textContent=expanded?'Hide details':'View details';
        toggle.setAttribute('aria-expanded',String(expanded));
        toggle.setAttribute('aria-label',expanded?'Hide monthly earnings comparison details':'Show monthly earnings comparison details');
      });
      head.appendChild(toggle);
    }
    var nameIcons={
      'Salary':['banknote','teal'],
      'Sales Incentive':['chart-line','blue'],
      'Driver Allowance':['truck','indigo'],
      'Special Allowance':['package','violet'],
      'Other Earning':['wallet','blue']
    };
    card.querySelectorAll('#earningCompareRows tr td:first-child').forEach(function(cell){
      if(cell.querySelector('.bb-sr-icon'))return;
      var label=cleanLabel(cell.textContent);
      cell.textContent=label;
      var def=nameIcons[label];
      if(def)cell.prepend(icon(def[0],def[1]));
    });
  }
  function stripEarnedEmojis(){
    // Only controlled Staff Relation earning labels; never change staff notes.
    document.querySelectorAll('#pendingPaymentRows td:nth-child(3) div').forEach(function(node){
      var text=cleanLabel(node.textContent);
      if(node.textContent!==text)node.textContent=text;
    });
  }
  function updatePending(){
    var rows=document.getElementById('pendingPaymentRows');
    var card=rows?.closest('.card');
    if(card)card.classList.toggle('bb-sr-hidden-empty',!!rows.querySelector('.empty'));
  }
  function ensureAbout(){
    var page=document.getElementById('page-payment');
    var note=page?.querySelector(':scope > .note');
    if(!note||page.querySelector('.bb-sr-about-earnings'))return;
    var details=document.createElement('details');
    details.className='bb-sr-about-earnings';
    var summary=document.createElement('summary');
    summary.textContent='About these earnings';
    details.appendChild(summary);
    note.parentNode.insertBefore(details,note);
    details.appendChild(note);
  }
  function updateToast(){
    var el=document.getElementById('toast');
    if(!el||el.hidden)return;
    var label=cleanLabel(el.textContent);
    if(label===el.textContent)return;
    el.textContent=label;
    if(!el.classList.contains('error'))el.prepend(icon('circle-check','teal'));
  }
  function renderPayments(earnings){
    var list=document.getElementById('earningList');
    if(!list||!Array.isArray(earnings))return;
    var rows=Array.from(list.children).filter(function(node){
      return node.classList.contains('earning');
    });
    if(!rows.length)return;
    // Existing DOM earning rows exactly match the order of paymentData.available.
    // Move the ORIGINAL nodes; don't reconstruct inputs, values or event listeners.
    if(rows.length!==earnings.length)return;
    var groups=new Map(categories.map(function(item){return [item.key,[]]}));
    earnings.forEach(function(record,index){
      var key=category(record),node=rows[index];
      var title=node.querySelector('.earning-title');
      if(title){
        title.textContent=cleanLabel(title.textContent);
        title.prepend(icon(categories.find(function(x){return x.key===key}).icon,key==='driver'?'indigo':key==='salary'?'teal':'blue'));
      }
      var type=String(record.earningType||'').toUpperCase();
      var simple=['SALES_INCENTIVE','MONTHLY_SALARY','SPECIAL_ALLOWANCE'].includes(type);
      node.classList.toggle('bb-sr-payment-simple',simple);
      groups.get(key).push({node:node,data:record,index:index,date:recordDate(record)});
    });
    var result=document.createDocumentFragment();
    categories.forEach(function(cat){
      var items=groups.get(cat.key);
      if(!items.length)return; // No empty salary/driver/etc sections.
      items.sort(function(a,b){
        if(a.date!==b.date)return a.date.localeCompare(b.date);
        var aId=Number(a.data?.earningId),bId=Number(b.data?.earningId);
        if(Number.isFinite(aId)&&Number.isFinite(bId)&&aId!==bId)return aId-bId;
        return a.index-b.index;
      });
      var section=document.createElement('section');
      section.className='bb-sr-payment-group';
      section.dataset.category=cat.key;
      var header=document.createElement('div');
      header.className='bb-sr-payment-group-head';
      header.appendChild(icon(cat.icon,cat.tone));
      var title=document.createElement('strong');
      title.textContent=cat.label;
      header.appendChild(title);
      var count=document.createElement('span');
      count.className='bb-sr-payment-count';
      count.textContent=items.length+' earning'+(items.length===1?'':'s');
      header.appendChild(count);
      var byCurrency={};
      items.forEach(function(item){
        var currency=String(item.data.currency||'USD').toUpperCase();
        byCurrency[currency]=(byCurrency[currency]||0)+(Number(item.data.amount)||0);
      });
      var total=document.createElement('span');
      total.className='bb-sr-payment-category-amount';
      total.textContent=Object.keys(byCurrency).sort().map(function(currency){
        return formatAmount(byCurrency[currency],currency);
      }).join(' + ');
      header.appendChild(total);
      section.appendChild(header);
      var body=document.createElement('div');
      body.className='bb-sr-payment-group-rows';
      items.forEach(function(item){body.appendChild(item.node)});
      section.appendChild(body);
      result.appendChild(section);
    });
    list.replaceChildren(result);
  }
  function render(earnings){
    icons(document);
    enhanceRefresh();
    enhanceComparison();
    renderPayments(earnings||[]);
    stripEarnedEmojis();
    updatePending();
    ensureAbout();
    updateToast();
  }
  window.BBStaffRelationDesktopV1=Object.freeze({render:render});
  // Initial icons are static and don't require polling or changing any data.
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){icons(document)}, {once:true});
  }else icons(document);
})();
