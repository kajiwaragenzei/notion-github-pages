// すべての外部リンクに target="_blank" rel="noopener" を付与
document.addEventListener("DOMContentLoaded", function() {
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(function(link) {
    // 自サイトへのリンクは除外
    if (!link.href.startsWith(location.origin)) {
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    }
  });
});

// article内imgを自動判定＆拡大
document.addEventListener("DOMContentLoaded", function() {
  // article内の全imgを走査
  document.querySelectorAll("article img").forEach(function(img) {
    function enableZoomIfShrinked() {
      if (img.offsetWidth < img.naturalWidth - 2) {
        img.setAttribute("data-zoomable", "1");
        img.title = "クリックで拡大";
        // すでにイベントが付いてたら追加しない
        if (!img.hasAttribute("data-zoom-listener")) {
          img.addEventListener("click", openImgModal);
          img.setAttribute("data-zoom-listener", "1");
        }
      }
    }
    if (img.complete) enableZoomIfShrinked();
    else img.addEventListener('load', enableZoomIfShrinked);
  });

  function openImgModal(e) {
    const src = e.target.src;
    const modal = document.createElement("div");
    modal.className = "img-modal-overlay";
    modal.innerHTML = `<img src="${src}">`;
    modal.addEventListener("click", function(ev) {
      if (ev.target === modal || ev.target === modal.querySelector('img')) {
        document.body.removeChild(modal);
      }
    });
    document.body.appendChild(modal);
  }
});
