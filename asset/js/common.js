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
      // 実際に縮小されて表示されていたら
      if (img.offsetWidth < img.naturalWidth - 2) {
        img.setAttribute("data-zoomable", "1"); // ←クラス不要、属性でCSS指定
        img.title = "クリックで拡大";
        img.addEventListener("click", openImgModal, { once: true });
      }
    }
    // 画像が未読込のときも安全に
    if (img.complete) enableZoomIfShrinked();
    else img.addEventListener('load', enableZoomIfShrinked);
  });
  // モーダル生成
  function openImgModal(e) {
    const src = e.target.src;
    const modal = document.createElement("div");
    modal.className = "img-modal-overlay";
    modal.innerHTML = `<img src="${src}">`;
    modal.addEventListener("click", function(ev) {
      // 画像外か✕クリックで閉じる
      if (ev.target === modal || ev.target === modal.querySelector('img') || ev.target === modal) {
        document.body.removeChild(modal);
      }
    });
    document.body.appendChild(modal);
  }
});
