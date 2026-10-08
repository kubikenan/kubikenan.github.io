# ADA Öğrenci Takip — dış arayüz (GitHub Pages)

Bu depo yalnız derlenmiş arayüzü (index.html) barındırır.
Veri ve giriş doğrulaması Apps Script sunucusundadır (doPost rpc köprüsü);
bu sayfada hiçbir şifre veya öğrenci verisi YOKTUR.

Kaynak: ~/Documents/Ogrenci Takip Site (build_index.py → dist/)
Güncelleme: python3 build_index.py && cp dist/index.html dist/sw.js <bu depo>/ && git commit + push
PWA (v44): sw.js uygulama kabuğunu önbelleğe alır (önce önbellek, arkada tazele); index.html'deki SURUM_DAMGA
her derlemede değişir, açık uygulamada "Yeni sürüm hazır · Yenile" şeridi çıkar. Apps Script istekleri SW'ye girmez.
