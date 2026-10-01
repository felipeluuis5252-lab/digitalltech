(function(){
  var bar=document.getElementById('bar'),hero=document.getElementById('cta-hero'),fin=document.getElementById('final');
  var heroOut=false,finIn=false;
  function upd(){bar.classList.toggle('on',heroOut&&!finIn);}
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(e){heroOut=!e[0].isIntersecting&&e[0].boundingClientRect.top<0;upd();}).observe(hero);
    new IntersectionObserver(function(e){finIn=e[0].isIntersecting;upd();}).observe(fin);
  }
})();
