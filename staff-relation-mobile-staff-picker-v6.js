/* BIG BROTHER Staff Relation — mobile-only searchable staff picker V6.
 * Replaces the visual browser select, NOT the authorized staff selection flow.
 * The original #adminStaffSelect remains the source of truth. Selecting a row
 * dispatches its normal change event so the existing Staff Relation code
 * updates URL, permissions and admin view exactly as before.
 */
(function(){
  'use strict';
  if(window.BBStaffRelationMobilePickerV6)return;
  if(!document.body.classList.contains('bb-sr-mobile-v2'))return;

  var select=document.getElementById('adminStaffSelect');
  var wrap=document.getElementById('adminStaffWrap');
  if(!select||!wrap)return;

  var icons=window.BBMobileFunctionIconsV1;
  function icon(name){
    var node=document.createElement('span');
    node.className='bb-sr-staff-picker-icon';
    node.setAttribute('aria-hidden','true');
    var localPaths={
      'chevron-down':'<path d="m6 9 6 6 6-6"/>',
      'x':'<path d="M18 6 6 18M6 6l12 12"/>',
      'check':'<path d="m20 6-11 11-5-5"/>'
    };
    if(localPaths[name]){
      node.innerHTML='<svg class="bb-function-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'+localPaths[name]+'</svg>';
    }else if(icons&&typeof icons.named==='function'){
      node.innerHTML=icons.named(name);
    }
    return node;
  }
  function make(tag,className,text){
    var n=document.createElement(tag);
    if(className)n.className=className;
    if(text!=null)n.textContent=String(text);
    return n;
  }
  function normalize(value){return String(value||'').trim().toLocaleLowerCase();}
  function records(){
    return Array.from(select.options).filter(function(o){return o.value;}).map(function(o){
      // Labels are provided by the existing staff register as "Name — Position";
      // the staff ID is retained in option.value but NEVER rendered in the picker.
      var label=String(o.textContent||'').trim();
      var pivot=label.lastIndexOf(' — ');
      return {
        id:o.value,
        name:pivot<0?label:label.slice(0,pivot),
        position:pivot<0?'':label.slice(pivot+3),
        label:label
      };
    });
  }
  function initials(value){
    var terms=String(value||'').trim().split(/\s+/).filter(Boolean);
    return terms.slice(0,2).map(function(t){return t.charAt(0);}).join('').toLocaleUpperCase()||'BB';
  }

  var trigger=make('button','bb-sr-staff-picker-trigger');
  trigger.type='button';
  trigger.setAttribute('aria-haspopup','dialog');
  trigger.setAttribute('aria-expanded','false');
  trigger.setAttribute('aria-label','Choose staff account');
  var triggerAvatar=make('span','bb-sr-staff-picker-trigger-avatar');
  var triggerText=make('span','bb-sr-staff-picker-trigger-text');
  var triggerCaret=icon('chevron-down');
  trigger.append(triggerAvatar,triggerText,triggerCaret);
  wrap.insertBefore(trigger,select);
  wrap.classList.add('bb-sr-custom-picker-enabled');
  select.setAttribute('tabindex','-1');
  select.setAttribute('aria-hidden','true');

  var overlay=make('div','bb-sr-staff-picker-overlay');
  overlay.hidden=true;
  var sheet=make('section','bb-sr-staff-picker-sheet');
  sheet.setAttribute('role','dialog');
  sheet.setAttribute('aria-modal','true');
  sheet.setAttribute('aria-label','Select staff member');
  var handle=make('div','bb-sr-staff-picker-handle');
  handle.setAttribute('aria-hidden','true');
  var head=make('div','bb-sr-staff-picker-head');
  var headings=make('div','bb-sr-staff-picker-headings');
  var title=make('strong','','Select Staff');
  var count=make('span','bb-sr-staff-picker-count','');
  headings.append(title,count);
  var closeButton=make('button','bb-sr-staff-picker-close');
  closeButton.type='button';
  closeButton.setAttribute('aria-label','Close staff picker');
  closeButton.appendChild(icon('x'));
  head.append(headings,closeButton);
  var searchWrap=make('div','bb-sr-staff-picker-search');
  searchWrap.appendChild(icon('search'));
  var search=make('input');
  search.type='search';
  search.placeholder='Search staff name or position';
  search.autocomplete='off';
  search.setAttribute('aria-label','Search staff name or position');
  search.setAttribute('spellcheck','false');
  searchWrap.appendChild(search);
  var list=make('div','bb-sr-staff-picker-list');
  list.setAttribute('role','listbox');
  list.setAttribute('aria-label','Staff accounts');
  sheet.append(handle,head,searchWrap,list);
  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  var oldBodyOverflow='',open=false;

  function sync(){
    var record=records().find(function(r){return r.id===select.value;});
    triggerAvatar.textContent=initials(record?.name);
    triggerText.textContent=record?.label||'Select staff member';
    trigger.disabled=!records().length;
    if(open)render();
  }
  function render(){
    var options=records();
    var q=normalize(search.value);
    var matches=q?options.filter(function(item){
      return normalize(item.name+' '+item.position).includes(q);
    }):options;
    count.textContent=matches.length+' of '+options.length+' staff';
    var fragment=document.createDocumentFragment();
    matches.forEach(function(item){
      var selected=select.value===item.id;
      var row=make('button','bb-sr-staff-picker-person'+(selected?' is-selected':''));
      row.type='button';
      row.setAttribute('role','option');
      row.setAttribute('aria-selected',String(selected));
      row.setAttribute('aria-label',item.label);
      var avatar=make('span','bb-sr-staff-picker-avatar',initials(item.name));
      avatar.setAttribute('aria-hidden','true');
      var text=make('span','bb-sr-staff-picker-person-label',item.label);
      var check=make('span','bb-sr-staff-picker-check');
      check.setAttribute('aria-hidden','true');
      if(selected)check.appendChild(icon('check'));
      row.append(avatar,text,check);
      row.addEventListener('click',function(){
        var changed=select.value!==item.id;
        select.value=item.id;
        close();
        sync();
        if(changed)select.dispatchEvent(new Event('change',{bubbles:true}));
      });
      fragment.appendChild(row);
    });
    if(!matches.length){
      fragment.appendChild(make('div','bb-sr-staff-picker-no-results','No matching staff found'));
    }
    list.replaceChildren(fragment);
  }
  function openPicker(){
    if(open||!records().length)return;
    open=true;
    oldBodyOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    overlay.hidden=false;
    trigger.setAttribute('aria-expanded','true');
    search.value='';
    render();
    requestAnimationFrame(function(){
      if(open)search.focus({preventScroll:true});
    });
  }
  function close(){
    if(!open)return;
    open=false;
    overlay.hidden=true;
    trigger.setAttribute('aria-expanded','false');
    document.body.style.overflow=oldBodyOverflow;
    trigger.focus({preventScroll:true});
  }
  trigger.addEventListener('click',openPicker);
  closeButton.addEventListener('click',close);
  overlay.addEventListener('click',function(e){if(e.target===overlay)close();});
  sheet.addEventListener('click',function(e){e.stopPropagation();});
  search.addEventListener('input',render);
  overlay.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='Tab'&&open){
      // Keep keyboard navigation within the dialog.
      var controls=[closeButton,search].concat(Array.from(list.querySelectorAll('button')));
      var current=controls.indexOf(document.activeElement);
      if(e.shiftKey&&current===0){e.preventDefault();controls[controls.length-1]?.focus();}
      else if(!e.shiftKey&&current===controls.length-1){e.preventDefault();controls[0].focus();}
    }
  });
  select.addEventListener('change',sync);
  // The authorized admin profiles arrive asynchronously after login.
  new MutationObserver(sync).observe(select,{childList:true,subtree:true});
  // Avoid hiding the modal behind a route switch.
  document.getElementById('personalModeBtn')?.addEventListener('click',close);
  sync();
  window.BBStaffRelationMobilePickerV6=Object.freeze({sync:sync});
})();