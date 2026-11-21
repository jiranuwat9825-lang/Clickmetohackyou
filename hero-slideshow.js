/* Decorative carousel: the existing cover stays visible until the first fade. */
(() => {
 const slides=[...document.querySelectorAll('.cover-slide')];
 if(slides.length<2||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 let current=0;
 setInterval(()=>{
  if(document.hidden)return;
  slides[current].classList.remove('is-active');
  current=(current+1)%slides.length;
  slides[current].classList.add('is-active');
 },6500);
})();
