/* BIG BROTHER — Staff Relation Mobile Payment History V4.
   View-only renderer; called with the already authorized paymentHistory records
   from staff-relation.js. No new requests, no writes, no authorization changes.
*/
(function(){
  'use strict';
  if(window.BBStaffRelationMobileHistoryV4)return;

  var categories=[
    {key:'sales',name:'Sales Incentive',icon:'chart-line',tone:'blue'},
    {key:'driver',name:'Driver Allowance',icon:'truck',tone:'indigo'},
    {key:'salary',name:'Salary',icon:'banknote',tone:'teal'},
    {key:'special',name:'Special Allowance',icon:'package',tone:'violet'},
    {key:'other',name:'Other Earnings',icon:'wallet',tone:'blue'}
  ];
  var monthAbbr=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function str(value){return String(value==null?'':value).trim()}
  function num(value){var n=Number(value);return Number.isFinite(n)?n:0}
  function esc(value){
    return str(value).replace(/[&<>"']/g,function(ch){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
  }
  function money(value,currency){
    return str(currency).toUpperCase()==='KHR'
      ? '៛'+num(value).toLocaleString('en-US',{maximumFractionDigits:0})
      : '$'+num(value).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function dateText(value,withTime){
    var d=new Date(str(value));
    if(!Number.isFinite(d.getTime()))return str(value)||'—';
    try{
      return new Intl.DateTimeFormat('en-GB',
        withTime?{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}
          :{day:'2-digit',month:'short',year:'numeric'}).format(d);
    }catch(_){return str(value)}
  }
  function sourceDate(item){
    var raw=str(item.sourceDate);
    var m=raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(m&&+m[2]>=1&&+m[2]<=12)return m[3]+' '+monthAbbr[+m[2]-1]+' '+m[1];
    var month=str(item.salaryMonth).match(/^(\d{4})-(\d{2})/);
    if(month&&+month[2]>=1&&+month[2]<=12)return monthAbbr[+month[2]-1]+' '+month[1];
    return '';
  }
  function typeKey(item){
    switch(str(item.earningType).toUpperCase()){
      case 'SALES_INCENTIVE':
      case 'INCENTIVE_ADJUSTMENT':return 'sales';
      case 'DRIVER_ALLOWANCE':
      case 'ALLOWANCE_ADJUSTMENT':return 'driver';
      case 'MONTHLY_SALARY':return 'salary';
      case 'SPECIAL_ALLOWANCE':return 'special';
      default:return 'other';
    }
  }
  function itemTitle(item){
    var type=str(item.earningType).toUpperCase();
    if(type==='DRIVER_ALLOWANCE')return str(item.sourceRole).toUpperCase()==='DRIVER_2'?'Driver 2':'Driver 1';
    if(type==='ALLOWANCE_ADJUSTMENT')return 'Driver Allowance Adjustment';
    if(type==='INCENTIVE_ADJUSTMENT')return 'Sales Incentive Adjustment';
    if(type==='MONTHLY_SALARY')return 'Monthly Salary';
    if(type==='SPECIAL_ALLOWANCE')return 'Special Allowance';
    if(type==='SALES_INCENTIVE')return 'Sales Incentive';
    return str(item.earningType).replaceAll('_',' ')||'Other earning';
  }
  function icon(name,tone){
    var library=window.BBMobileFunctionIconsV1;
    if(!library||typeof library.named!=='function')return '';
    return '<span class="bb-sr-history-icon bb-sr-history-'+esc(tone)+'">'+library.named(name)+'</span>';
  }
  function breakdown(payment,currency){
    var items=Array.isArray(payment?.detail?.items)?payment.detail.items:[];
    var grouped=new Map();
    categories.forEach(function(cat){grouped.set(cat.key,[]);});
    items.forEach(function(item){grouped.get(typeKey(item)).push(item);});
    var html='';
    categories.forEach(function(cat){
      var list=grouped.get(cat.key);
      if(!list.length)return;
      var subtotal=list.reduce(function(sum,item){return sum+num(item.amount)},0);
      html+='<section class="bb-sr-history-category">'+
        '<div class="bb-sr-history-category-total">'+
          icon(cat.icon,cat.tone)+
          '<strong>'+esc(cat.name)+'</strong>'+
          '<b>'+esc(money(subtotal,currency))+'</b>'+
        '</div>';
      list.forEach(function(item){
        var label=itemTitle(item);
        var day=sourceDate(item);
        var location=str(item.locationCode);
        var source=str(item.sourceReference);
        var info=[day,location,source].filter(Boolean).join(' · ');
        html+='<div class="bb-sr-history-source">'+
          '<span class="bb-sr-history-source-copy"><strong>'+esc(label)+'</strong>'+
          (info?'<small>'+esc(info)+'</small>':'')+'</span>'+
          '<span class="bb-sr-history-source-money">'+esc(money(item.amount,currency))+'</span>'+
        '</div>';
      });
      html+='</section>';
    });
    var refs=[str(payment.referenceNo),str(payment.expenseId)].filter(Boolean);
    if(refs.length)html+='<div class="bb-sr-history-references">'+
      esc(refs.join(' · '))+'</div>';
    return html;
  }
  function rowMarkup(payment,index){
    var currency=str(payment.currency||payment?.detail?.currency||'USD');
    var amount=money(payment.amount,currency);
    var date=dateText(payment.paidAt,false);
    var fullDate=dateText(payment.paidAt,true);
    var method=str(payment.paymentMethod)||'—';
    var items=Array.isArray(payment?.detail?.items)?payment.detail.items:[];
    var multi=items.length>1;
    var id='bbSrHistV4Details'+index;
    var line='<span class="bb-sr-history-date" title="'+esc(fullDate)+'">'+esc(date)+'</span>'+
      '<span class="bb-sr-history-method" title="'+esc(method)+'">'+esc(method)+'</span>'+
      '<strong class="bb-sr-history-amount">'+esc(amount)+'</strong>'+
      '<span class="bb-sr-history-chevron" aria-hidden="true">'+(multi?'⌄':'')+'</span>';
    var inner=multi?
      '<button type="button" class="bb-sr-history-line bb-sr-history-toggle" aria-expanded="false" aria-controls="'+id+'" aria-label="Show earning sources for '+esc(date)+', '+esc(amount)+'">'+line+'</button>'+
      '<div class="bb-sr-history-details" id="'+id+'" hidden>'+breakdown(payment,currency)+'</div>'
      :'<div class="bb-sr-history-line bb-sr-history-fixed" aria-label="'+esc(date+', '+amount+', '+method)+'">'+line+'</div>';
    return '<tr class="bb-sr-history-row"><td class="bb-sr-history-cell" colspan="7">'+inner+'</td></tr>';
  }
  function render(data){
    var target=document.getElementById('historyRows');
    if(!target)return;
    var payments=Array.isArray(data)?data.slice():[];
    // Retain the familiar newest-first payment history ordering.
    payments=payments.map(function(payment,index){return {payment:payment,index:index};})
      .sort(function(a,b){
        var tA=Date.parse(str(a.payment?.paidAt))||0;
        var tB=Date.parse(str(b.payment?.paidAt))||0;
        return tB-tA||a.index-b.index;
      }).map(function(x){return x.payment;});
    if(!payments.length){
      target.innerHTML='<tr class="bb-sr-history-row"><td colspan="7" class="bb-sr-history-empty">No payment history yet.</td></tr>';
      return;
    }
    target.innerHTML=payments.map(rowMarkup).join('');
    target.querySelectorAll('.bb-sr-history-toggle').forEach(function(button){
      button.addEventListener('click',function(){
        var details=document.getElementById(button.getAttribute('aria-controls'));
        if(!details)return;
        var open=button.getAttribute('aria-expanded')!=='true';
        button.setAttribute('aria-expanded',String(open));
        button.setAttribute('aria-label',(open?'Hide':'Show')+button.getAttribute('aria-label').replace(/^(?:Show|Hide)/,''));
        details.hidden=!open;
      });
    });
  }

  window.BBStaffRelationMobileHistoryV4=Object.freeze({render:render});
})();