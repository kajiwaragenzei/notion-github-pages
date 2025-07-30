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
