/* Stable Turkish lookup keys; document filenames and content are not translated. */
let uiLang='en';
const UI_TEXT={};
// TR | EN | DE. Edit this table in the source package.
const UI_ROWS=`
Türkçe|Turkish|Türkisch
Türkçe + English + Deutsch|Turkish + English + German|Türkisch + Englisch + Deutsch
PDF uzantılı bir dosya seçin.|Choose a file with the PDF extension.|Wählen Sie eine Datei mit der PDF-Endung.
OCR sonucunu PDF olarak kaydet|Save OCR results as PDF|OCR-Ergebnis als PDF speichern
Sayfa görünümü, görseller ve yerleşim korunur. Tanınan metin PDF’de aranabilir ve seçilebilir olur. Tüm belge kaydedilir.|Page appearance, images and layout are preserved. Recognized text becomes searchable and selectable in the PDF. The entire document is saved.|Seitenansicht, Bilder und Layout bleiben erhalten. Erkannter Text wird im PDF durchsuchbar und auswählbar. Das gesamte Dokument wird gespeichert.
Düzeni koruyarak PDF kaydet|Save PDF preserving layout|PDF mit erhaltenem Layout speichern
Bu düğme, OCR ile metin tanındığında etkinleşir.|This button is enabled once OCR recognizes text.|Diese Schaltfläche wird aktiviert, sobald OCR Text erkannt hat.
OCR tamamlanınca PDF olarak kaydet|Save as PDF when OCR finishes|Nach OCR automatisch als PDF speichern
OCR işleminin bitmesini bekleyin.|Wait for OCR to finish.|Warten Sie, bis OCR abgeschlossen ist.
Önce OCR ile metin tanıyın.|Run OCR to recognize text first.|Führen Sie zuerst OCR zur Texterkennung aus.
Düzeni koruyan OCR PDF hazırlanıyor…|Preparing OCR PDF with preserved layout…|OCR-PDF mit erhaltenem Layout wird vorbereitet…
Farklı kaydet|Save as|Speichern unter
Farklı kaydet (Ctrl+Shift+S)|Save as (Ctrl+Shift+S)|Speichern unter (Strg+Umschalt+S)
Dosya adı|File name|Dateiname
Geçerli bir dosya adı yazın.|Enter a valid file name.|Geben Sie einen gültigen Dateinamen ein.
Yeni bir PDF adı seçin. Tarayıcı destekliyorsa kaydedilecek konumu da seçebilirsiniz; diğer tarayıcılarda dosya bu adla indirilir.|Choose a new PDF name. Where supported, choose a save location; other browsers download the file with this name.|Wählen Sie einen neuen PDF-Namen. Unterstützte Browser ermöglichen auch die Wahl des Speicherorts; andere Browser laden die Datei mit diesem Namen herunter.
PDF belgesi|PDF document|PDF-Dokument
Dosya konumu seçilemedi.|Could not select a save location.|Der Speicherort konnte nicht ausgewählt werden.
PDF kaydedildi.|PDF saved.|PDF gespeichert.
Devam eden işlemin bitmesini bekleyin.|Wait for the current operation to finish.|Warten Sie, bis der laufende Vorgang abgeschlossen ist.
Yazdırılacak PDF|PDF for printing|PDF zum Drucken
Yazdırma görünümü açılamadı.|Could not open the print view.|Die Druckansicht konnte nicht geöffnet werden.
Yazdırma hazırlanıyor…|Preparing to print…|Druck wird vorbereitet…
Yazdırma iptal edildi.|Printing cancelled.|Drucken abgebrochen.
Yazdırılacak sayfa hazırlanamadı.|Could not prepare the page for printing.|Die Seite konnte nicht zum Drucken vorbereitet werden.
Yazdır|Print|Drucken
Yazdır (Ctrl+P)|Print (Ctrl+P)|Drucken (Strg+P)
Yazıcı ve sayfa seçeneklerini tarayıcının yazdırma penceresinden seçin.|Choose the printer and page settings in the browser print dialog.|Wählen Sie Drucker und Seiteneinstellungen im Druckdialog des Browsers.
OCR aracında dili ve sayfaları seçip tanımayı başlatın. Sonrasında Düzeni koruyarak PDF kaydet düğmesini kullanın. Sayfaların görünümü korunur; tanınan yazılar PDF’de aranabilir ve seçilebilir olur. OCR tamamlanınca PDF olarak kaydet seçeneği otomatik indirmeyi açar. Tüm belge kaydedilir. Sonuçları kontrol edin.|Choose OCR language and pages, then start recognition. Use Save PDF preserving layout afterwards. Page appearance is preserved; recognized text becomes searchable and selectable. Save as PDF when OCR finishes enables automatic download. The entire document is saved. Review the results.|Wählen Sie OCR-Sprache und Seiten und starten Sie die Erkennung. Anschließend PDF mit erhaltenem Layout speichern verwenden. Die Seitenansicht bleibt erhalten; erkannter Text wird durchsuchbar und auswählbar. Nach OCR automatisch als PDF speichern aktiviert den automatischen Download. Das gesamte Dokument wird gespeichert. Prüfen Sie die Ergebnisse.
Kaydet, PDF dışa aktar veya Farklı kaydet ile PDF oluşturun. Farklı kaydet yeni dosya adı seçmenizi sağlar; desteklenen tarayıcılarda konumu da seçebilirsiniz. DOCX, TXT, XLSX, JPEG ve PNG çıktıları da kullanılabilir. Karmaşık tabloları kontrol edin.|Create PDFs using Save, PDF export or Save as. Save as lets you choose a new file name and, in supported browsers, a save location. DOCX, TXT, XLSX, JPEG and PNG exports are also available. Review complex tables.|PDF über Speichern, PDF-Export oder Speichern unter erstellen. Speichern unter ermöglicht einen neuen Dateinamen und in unterstützten Browsern auch einen Speicherort. DOCX, TXT, XLSX, JPEG und PNG sind ebenfalls verfügbar. Komplexe Tabellen prüfen.
Yazıcıdan yazdırma|Print to a printer|Auf einem Drucker drucken
Üst çubuktaki Yazdır düğmesini veya Ctrl+P kullanın. Tarayıcının yazdırma penceresinde yazıcıyı, kâğıdı, sayfa aralığını ve ölçeği seçin. Mevcut düzenlemeler çıktıya uygulanır. Fiziksel yazıcının kenar boşlukları ve kâğıt boyutu görünümü etkileyebilir.|Use Print in the toolbar or Ctrl+P. Choose the printer, paper, page range and scale in the browser print dialog. Current edits are applied to the output. Printer margins and paper size may affect the appearance.|Verwenden Sie Drucken in der Werkzeugleiste oder Strg+P. Wählen Sie Drucker, Papier, Seitenbereich und Skalierung im Druckdialog des Browsers. Aktuelle Änderungen werden angewendet. Druckerränder und Papierformat können das Erscheinungsbild beeinflussen.
Ctrl+O: aç · Ctrl+S: kaydet · Ctrl+Shift+S: farklı kaydet · Ctrl+P: yazdır · Ctrl+Z: geri al · Ctrl+Y: yinele · Ctrl+F: ara · Delete: seçileni sil · Esc: aracı bırak. Uzun metinlerde satır taşmasını kontrol edin.|Ctrl+O: open · Ctrl+S: save · Ctrl+Shift+S: save as · Ctrl+P: print · Ctrl+Z: undo · Ctrl+Y: redo · Ctrl+F: search · Delete: delete selection · Esc: leave tool. Check overflow with long text.|Strg+O: öffnen · Strg+S: speichern · Strg+Umschalt+S: speichern unter · Strg+P: drucken · Strg+Z: rückgängig · Strg+Y: wiederholen · Strg+F: suchen · Entf: Auswahl löschen · Esc: Werkzeug verlassen. Bei langen Texten Überlauf prüfen.
PDF çıktısı tüm düzenlemeleri ve aranabilir OCR katmanını içerir.|PDF output includes all edits and the searchable OCR layer.|PDF-Ausgabe enthält alle Änderungen und die durchsuchbare OCR-Textebene.
PDF metinlerini düzenleyin, taramaları okuyun, dosyaları dönüştürüp koruyun. Açık kaynak bileşenlerle yerel çalışma: dosyalarınız cihazınızda kalır.|Edit PDF text, run OCR, convert files and protect documents. Local processing with open-source components: your files stay on your device.|PDF-Texte bearbeiten, OCR nutzen, Dateien umwandeln und Dokumente schützen. Lokale Verarbeitung mit Open-Source-Komponenten: Ihre Dateien bleiben auf Ihrem Gerät.
Yazı tipi|Font family|Schriftart
İtalik|Italic|Kursiv
Altı çizili|Underlined|Unterstrichen
Normal|Regular|Normal
Tahmin|Estimate|Schätzung
Belirlenemedi|Not determined|Nicht bestimmt
Karakter desteği için kullanılan:|Character fallback font:|Ersatzschrift für Zeichen:
Orijinal biçim:|Original format:|Originalformat:
Yeni metnin biçimi|New text format|Format für neuen Text
Yazı biçimini tanı|Identify text format|Schriftformat erkennen
PDF font adını okuyun; tarama biçimini tahmin edin.|Read PDF font names; estimate scanned text format.|PDF-Schriftnamen lesen; Scan-Schriftformat schätzen.
Yazı biçimi bilgisi|Text format information|Informationen zum Schriftformat
Bu metni düzenle|Edit this text|Diesen Text bearbeiten
Sayfada biçim seç|Select text on page|Text auf der Seite auswählen
Metin bulunamadı. Taranmış sayfada önce OCR çalıştırın.|No text found. Run OCR first for a scanned page.|Kein Text gefunden. Bei Scans zuerst OCR ausführen.
PDF metninde kayıtlı font bilgisi okunur. Taramada, en yakın yerel font tahmini gösterilir.|Font information is read from PDF text. Scans show an estimate of the closest local font.|Bei PDF-Text werden gespeicherte Schriftinformationen gelesen. Scans zeigen eine Schätzung der nächsten lokalen Schrift.
Yazı tipi adı ve punto PDF kaydından okunur. Alt çizgi, çizim öğelerinden tespit edilir.|Font name and size are read from the PDF. Underlines are detected from drawing objects.|Schriftname und Größe werden aus dem PDF gelesen. Unterstreichungen werden aus Zeichenelementen erkannt.
Tarama tahmini, ekli yazı tipleriyle görsel karşılaştırmaya dayanır. Skor fontun kesin tanındığı anlamına gelmez.|Scan estimates compare the image with bundled fonts. A score does not confirm the original font.|Scan-Schätzungen vergleichen das Bild mit enthaltenen Schriften. Ein Wert bestätigt nicht die Originalschrift.
Eski metin kaldırılır; yeni metin seçtiğiniz fontla yazılır. Paragraflar otomatik yeniden akmaz.|Original text is removed and replaced using your chosen font. Paragraphs do not reflow automatically.|Originaltext wird entfernt und mit Ihrer gewählten Schrift ersetzt. Absätze werden nicht automatisch neu umbrochen.
Biçimini görmek istediğiniz metne tıklayın. Taramalar için önce OCR çalıştırın.|Click text to inspect its format. Run OCR first for scans.|Text anklicken, um das Format zu prüfen. Bei Scans zuerst OCR ausführen.
Yazı biçimleri tahmin ediliyor…|Estimating text formats…|Schriftformate werden geschätzt…
PDF bağlantısı|PDF link|PDF-Link
Bağlantı yeni tarayıcı sekmesinde açılır. PDF’yi oradan indirip bu programa dosya olarak ekleyin.|The link opens in a new browser tab. Download the PDF there and select it in this program.|Der Link öffnet sich in einem neuen Browsertab. PDF dort herunterladen und hier als Datei auswählen.
Yeni sekmede aç|Open in new tab|In neuem Tab öffnen
Bağlantıyı yeniden aç|Open link again|Link erneut öffnen
İndirilen PDF’yi aktar|Import downloaded PDF|Heruntergeladenes PDF importieren
Yeni sekmede PDF’yi açın ve indirin.|Open and download the PDF in the new tab.|PDF im neuen Tab öffnen und herunterladen.
PDF Atölyesi sekmesine dönün.|Return to the PDF Workshop tab.|Zum PDF-Werkstatt-Tab zurückkehren.
Aşağıdaki düğmeyle indirdiğiniz PDF’yi seçin.|Select the downloaded PDF using the button below.|Heruntergeladenes PDF mit der Schaltfläche unten auswählen.
Tarayıcı indirme klasörünüzü otomatik okuyamaz. Aktarılacak dosyayı siz seçersiniz.|The browser cannot automatically read your downloads folder. You select the file to import.|Der Browser kann Ihren Downloadordner nicht automatisch lesen. Sie wählen die Datei zum Importieren aus.
İndirilen PDF’yi seç|Select downloaded PDF|Heruntergeladenes PDF auswählen
URL bağlantısı yeni sekmede açılır. PDF’yi indirip dosya seçerek programa aktarın.|The URL opens in a new tab. Download the PDF and select the file to import it.|Die URL öffnet sich in einem neuen Tab. PDF herunterladen und zum Importieren als Datei auswählen.
İngilizce|English|Englisch
Almanca|German|Deutsch
Fransızca|French|Französisch
İspanyolca|Spanish|Spanisch
İtalyanca|Italian|Italienisch
Portekizce|Portuguese|Portugiesisch
Felemenkçe|Dutch|Niederländisch
Lehçe|Polish|Polnisch
Rusça|Russian|Russisch
Ukraynaca|Ukrainian|Ukrainisch
Yunanca|Greek|Griechisch
Arapça|Arabic|Arabisch
Farsça|Persian|Persisch
Birden fazla dil seç|Select multiple languages|Mehrere Sprachen auswählen
Tanınan yazı biçimleri|Recognized text formats|Erkannte Schriftformate
14 OCR dili cihazınıza gömülüdür. İnternet gerekmez. Aynı anda yalnızca belgedeki dilleri seçmek doğruluğu ve hızı artırır.|14 OCR languages are bundled for offline use. Select only the languages present in the document for better speed and accuracy.|14 OCR-Sprachen sind offline enthalten. Nur Dokumentsprachen auswählen, um Geschwindigkeit und Genauigkeit zu verbessern.
En az bir OCR dili seçin.|Select at least one OCR language.|Mindestens eine OCR-Sprache auswählen.
Font adı taramada kesin bilinemez. Font tahmini, kalın/italik/alt çizgi ve yaklaşık punto ayrıca gösterilir.|A scan cannot confirm a font name. Font estimates, bold, italic, underlining and approximate size are shown separately.|Ein Scan bestätigt keinen Schriftnamen. Schriftvorschläge, Fett, Kursiv, Unterstreichung und ungefähre Größe werden separat angezeigt.
Yorumunuzu klavyeden yazın…|Type your comment…|Kommentar eingeben…
Yorum metni|Comment text|Kommentartext
Klavyeden yorum yaz|Type a comment|Kommentar eingeben
Önce yorum metnini yazın.|Enter your comment first.|Zuerst Kommentar eingeben.
Yorumu sayfaya yerleştir|Place comment on page|Kommentar auf Seite platzieren
Metni yazın, düğmeye basın ve sayfada konum seçin. Yorumu sonradan metin biçimi panelinden düzenleyebilirsiniz.|Type text, press the button and choose a position on the page. You can edit it later in the text format panel.|Text eingeben, Schaltfläche drücken und Position auf der Seite wählen. Später im Schriftformatbereich bearbeiten.
Yorumun yerini sayfaya tıklayarak seçin.|Click the page to place your comment.|Auf die Seite klicken, um den Kommentar zu platzieren.
PNG damganın yerini sayfaya tıklayarak seçin.|Click the page to place the PNG stamp.|Auf die Seite klicken, um den PNG-Stempel zu platzieren.
PNG biçiminde bir damga seçin.|Choose a PNG stamp.|PNG-Stempel auswählen.
PNG damga yükle|Upload PNG stamp|PNG-Stempel laden
PNG damga|PNG stamp|PNG-Stempel
Şeffaf arka planlı PNG desteklenir. Yükledikten sonra sayfaya tıklayın; damgayı taşıyıp boyutlandırabilirsiniz.|Transparent PNGs are supported. Click the page after uploading, then move or resize the stamp.|Transparente PNGs werden unterstützt. Nach dem Laden auf die Seite klicken; Stempel verschieben und skalieren.
Karartma opaklığı|Redaction fill opacity|Deckkraft der Schwärzung
Opaklık yalnızca dolgunun koyuluğunu değiştirir. Alttaki metin ve görüntü kaydedilen PDF’den kalıcı olarak kaldırılır.|Opacity changes only the fill darkness. Underlying text and images are permanently removed from the saved PDF.|Die Deckkraft ändert nur die Füllungsdunkelheit. Text und Bilder darunter werden aus dem gespeicherten PDF dauerhaft entfernt.
Kullanım rehberi|User guide|Bedienungsanleitung
PDF Atölyesi v0.1.3: belgeler cihazınızda işlenir. İhtiyaç duyduğunuz aracı seçerek başlayın.|PDF Workshop v0.1.3 processes documents on your device. Start by choosing the tool you need.|PDF-Werkstatt v0.1.3 verarbeitet Dokumente auf Ihrem Gerät. Wählen Sie das benötigte Werkzeug.
Dosya ve bağlantı açma|Open files and links|Dateien und Links öffnen
Bilgisayarınızdaki PDF’yi Dosya seç düğmesiyle veya sürükleyerek açın. URL bağlantısı yeni sekmede açılır; indirilen dosyayı programa seçerek aktarın.|Open a local PDF with Choose files or drag and drop. URLs open in a new tab; select the downloaded file to import it.|Lokales PDF über Dateien auswählen oder per Ziehen öffnen. URLs öffnen in einem neuen Tab; heruntergeladene Datei zum Importieren auswählen.
Metin düzenleme ve biçim|Edit and format text|Text bearbeiten und formatieren
PDF’i düzenle → Mevcut metni düzenle seçin, yazıya tıklayın. Font, kalın, italik, alt çizgi, punto ve renk seçebilirsiniz. Kaydetme eski metni kaldırır. Seçili metnin biçimini sağ panelden sonradan değiştirebilirsiniz.|Choose Edit PDF → Edit existing text, then click text. Select font, bold, italic, underline, size and color. Saving removes the original text. The selected text can be reformatted later in the right panel.|PDF bearbeiten → Vorhandenen Text bearbeiten wählen und Text anklicken. Schrift, Fett, Kursiv, Unterstreichung, Größe und Farbe auswählen. Beim Speichern wird der Originaltext entfernt. Das Format lässt sich später rechts ändern.
Yazı biçimini tanıma|Identify text format|Schriftformat erkennen
Yazı biçimini tanı aracı PDF’deki font adını ve boyutunu gösterir. Taramalarda önce OCR çalıştırın. OCR font bilgisi, ekli fontlar arasında bir görsel tahmindir; özgün fontu kesin olarak doğrulamaz.|The format tool shows font name and size from PDF text. Run OCR first for scans. OCR font information is a visual estimate among bundled fonts and cannot confirm the original font.|Das Formatwerkzeug zeigt Schriftname und Größe aus PDF-Text. Bei Scans zuerst OCR ausführen. OCR-Schriftinformationen sind visuelle Schätzungen unter den enthaltenen Schriften und bestätigen nicht die Originalschrift.
OCR ve diller|OCR and languages|OCR und Sprachen
OCR aracında 14 dilden birini veya belgedeki dilleri birlikte seçin. Metinsiz sayfalar varsayılan olarak işlenir. Sonuçları kontrol edin. Kaydedilen PDF’nin aranabilir katmanı ve metin dışa aktarımları OCR sonucunu kullanır.|Choose one of 14 OCR languages or combine document languages. Pages without text are processed by default. Check results. The searchable PDF layer and text exports use OCR results.|Eine von 14 OCR-Sprachen oder mehrere Dokumentsprachen wählen. Standardmäßig werden Seiten ohne Text verarbeitet. Ergebnisse prüfen. PDF-Textebene und Textexporte verwenden OCR-Ergebnisse.
Yorumlar ve PNG damgalar|Comments and PNG stamps|Kommentare und PNG-Stempel
Yorum ekle panelinde klavyeden metin yazıp sayfaya yerleştirin. Damga panelinde PNG damga yükleyin; şeffaflık korunur. Damgayı sürükleyebilir ve köşesinden boyutlandırabilirsiniz.|Type a comment in the annotation panel and place it on the page. Upload PNG stamps in the stamp panel; transparency is preserved. Drag to move or resize from a corner.|Kommentar im Kommentarbereich eingeben und platzieren. PNG-Stempel im Stempelbereich laden; Transparenz bleibt erhalten. Durch Ziehen verschieben und an der Ecke skalieren.
Karartma ve opaklık|Redaction and opacity|Schwärzung und Deckkraft
Alanı çizip opaklığı ayarlayın. Kaydedilen PDF’de o alanın alttaki içeriği kaldırılır; opaklık dolgunun koyuluğunu belirler. Karartılan sayfalar resme dönüştürülür.|Mark the area and adjust opacity. Underlying content is removed from the saved PDF; opacity sets the fill darkness. Redacted pages are rasterized.|Bereich markieren und Deckkraft einstellen. Inhalt darunter wird aus dem gespeicherten PDF entfernt; Deckkraft bestimmt die Füllungsdunkelheit. Geschwärzte Seiten werden in Bilder umgewandelt.
Kaydetme ve dışa aktarma|Save and export|Speichern und exportieren
Kaydet veya PDF dışa aktar seçeneğiyle değişiklikleri PDF’ye yazın. DOCX’te düzenlenebilir metin veya sayfa görüntüsü seçebilirsiniz. TXT, XLSX, JPEG ve PNG de desteklenir. Karmaşık tabloları ve dönüştürülen düzeni kontrol edin.|Use Save or PDF export to write changes. DOCX offers editable text or page images. TXT, XLSX, JPEG and PNG are supported. Review complex tables and converted layouts.|Mit Speichern oder PDF-Export Änderungen sichern. DOCX bietet bearbeitbaren Text oder Seitenbilder. TXT, XLSX, JPEG und PNG werden unterstützt. Komplexe Tabellen und konvertierte Layouts prüfen.
Parola ile koruma|Password protection|Passwortschutz
PDF’yi koru aracında açılış parolasını iki kez girin. İzinleri seçip korumalı PDF indirin. Bu işlem AES-256 şifreleme kullanır. Parolayı saklayın; program parolayı kalıcı olarak tutmaz.|Enter the opening password twice in Protect PDF. Choose permissions and download the protected PDF. This uses AES-256 encryption. Keep the password safe; the program does not store it permanently.|Unter PDF schützen das Öffnungspasswort zweimal eingeben. Berechtigungen wählen und geschütztes PDF herunterladen. AES-256-Verschlüsselung wird verwendet. Passwort aufbewahren; es wird nicht dauerhaft gespeichert.
Yerel çalışma ve güvenlik|Local processing and security|Lokale Verarbeitung und Sicherheit
Çevrimdışı HTML gerekli motorları, fontları ve dil modellerini içerir. Belge işleme sunucuya yükleme gerektirmez. Dış bağlantı açma için internet gerekir. Tema, arayüz dili ve özellikle hatırlanması seçilen imzalar tarayıcıda tutulabilir.|The offline HTML includes engines, fonts and language models. Document processing needs no upload. External links require internet. Theme, interface language and explicitly remembered signatures may be stored in the browser.|Die Offline-HTML enthält Engines, Schriften und Sprachmodelle. Dokumentverarbeitung erfordert keinen Upload. Externe Links benötigen Internet. Design, Sprache und ausdrücklich gespeicherte Unterschriften können im Browser bleiben.
Kısayollar|Shortcuts|Tastenkürzel
Ctrl+O: aç · Ctrl+S: kaydet · Ctrl+Z: geri al · Ctrl+Y: yinele · Ctrl+F: ara · Delete: seçileni sil · Esc: aracı bırak. Uzun metinleri değiştirirken satır taşmasını kontrol edin.|Ctrl+O: open · Ctrl+S: save · Ctrl+Z: undo · Ctrl+Y: redo · Ctrl+F: search · Delete: delete selection · Esc: leave tool. Check overflow when replacing long text.|Strg+O: öffnen · Strg+S: speichern · Strg+Z: rückgängig · Strg+Y: wiederholen · Strg+F: suchen · Entf: Auswahl löschen · Esc: Werkzeug verlassen. Bei langen Ersatztexten Überlauf prüfen.
Açık kaynak ve lisanslar|Open source and licenses|Open Source und Lizenzen
Kaynak kod, bileşen lisansları ve sürüm notları ZIP paketindeki README dosyasındadır.|Source code, component licenses and release notes are included in README in the ZIP package.|Quellcode, Komponentenlizenzen und Versionshinweise stehen in README im ZIP-Paket.
Seç ve taşı (Esc)|Select and move (Esc)|Auswählen und verschieben (Esc)
Önceki eşleşme|Previous match|Vorheriger Treffer
Sonraki eşleşme|Next match|Nächster Treffer
Kaydederken bu alan kalıcı olarak karartılır|This area is permanently redacted on save|Dieser Bereich wird beim Speichern dauerhaft geschwärzt
Belgede en az bir sayfa kalmalı.|At least one page must remain.|Mindestens eine Seite muss erhalten bleiben.
Sayfa silinemedi|Page could not be deleted|Seite konnte nicht gelöscht werden
Sayfalar ayıklanıyor…|Extracting pages…|Seiten werden extrahiert…
Bu damgayı bas|Place this stamp|Diesen Stempel einfügen
Damgayı seçtikten sonra sayfada istediğiniz yere tıklayın. Köşesinden sürükleyerek büyütebilirsiniz.|Choose a stamp and click on the page. Drag its corner to resize.|Stempel auswählen und auf die Seite klicken. Größe an der Ecke ändern.
Sayfa seçmek için üzerine tıklayın. Ctrl ile birden çok, Shift ile aralık seçin.|Click to select pages. Use Ctrl for multiple pages or Shift for a range.|Seiten per Klick auswählen. Strg für mehrere Seiten, Umschalt für einen Bereich.
Öne taşı|Move to start|An den Anfang verschieben
Sona taşı|Move to end|Ans Ende verschieben
Seçilenleri ayıkla|Extract selection|Auswahl extrahieren
Sırayı değiştirmek için sayfaları sürükleyip bırakın. Bir sayfayı açmak için çift tıklayın.|Drag pages to reorder. Double-click to open a page.|Seiten zum Sortieren ziehen. Seite per Doppelklick öffnen.
Çapraz (45°)|Diagonal (45°)|Diagonal (45°)
Saydamlık|Opacity|Deckkraft
Yön|Direction|Richtung
İlk numara|First number|Erste Nummer
Filigran metni|Watermark text|Wasserzeichentext
Boyut|Size|Größe
Yatay|Horizontal|Horizontal
Dikey|Vertical|Vertikal
Bitti|Done|Fertig
Önizleme sayfaların üzerinde görünür; kaydettiğinizde tüm sayfalara uygulanır.|Preview appears on the pages; saving applies it to all pages.|Vorschau erscheint auf den Seiten; beim Speichern wird sie auf alle Seiten angewendet.
Karartılacak alanı seç|Select redaction area|Schwärzungsbereich auswählen
Geçerli bir sayfa sayısı girin.|Enter a valid page count.|Gültige Seitenzahl eingeben.
En az bir sayfa aralığı girin (örn. 1-3, 4-6).|Enter at least one page range (e.g. 1-3, 4-6).|Mindestens einen Seitenbereich eingeben (z. B. 1-3, 4-6).
A4 sayfaya sığdır|Fit to A4 page|An A4-Seite anpassen
Görselin kendi boyutu|Original image size|Originalgröße des Bildes
Görsel|Image|Bild
Yukarı taşı|Move up|Nach oben verschieben
Aşağı taşı|Move down|Nach unten verschieben
Listeden çıkar|Remove from list|Aus Liste entfernen
Görselleri buraya bırakın ya da |Drop images here or |Bilder hier ablegen oder 
PDF ve görselleri buraya bırakın ya da |Drop PDFs and images here or |PDFs und Bilder hier ablegen oder 
Her görsel bir sayfa olur. Sırayı oklarla değiştirebilirsiniz.|Each image becomes a page. Use arrows to reorder.|Jedes Bild wird zu einer Seite. Reihenfolge mit Pfeilen ändern.
Seçtiğiniz dosyaların sayfaları açık belgenin sonuna eklenir.|Pages from selected files are appended to the document.|Seiten aus gewählten Dateien werden am Dokumentende eingefügt.
Dosyalar listedeki sırayla tek PDF belgesinde birleştirilir.|Files are merged in the listed order.|Dateien werden in der angezeigten Reihenfolge zusammengeführt.
Görseller için sayfa boyutu|Page size for images|Seitengröße für Bilder
Görsellerden PDF oluştur|Create PDF from images|PDF aus Bildern erstellen
İmza çizim alanı|Signature drawing area|Zeichenbereich für Unterschrift
Adınızı ve soyadınızı yazın|Enter your full name|Vor- und Nachnamen eingeben
Henüz görsel seçilmedi|No image selected|Noch kein Bild ausgewählt
Fareyle, kalemle ya da parmağınızla imzalayın.|Sign with a mouse, pen or finger.|Mit Maus, Stift oder Finger unterschreiben.
Yüklenen imza|Uploaded signature|Hochgeladene Unterschrift
Görsel seç|Choose image|Bild auswählen
Beyaz arka planı kaldır|Remove white background|Weißen Hintergrund entfernen
Bu imzayı bu tarayıcıda hatırla|Remember signature in this browser|Unterschrift in diesem Browser merken
İmzayı yerleştir|Place signature|Unterschrift einfügen
Önce imzanızı çizin.|Draw your signature first.|Zuerst Unterschrift zeichnen.
Önce adınızı yazın.|Enter your name first.|Zuerst Namen eingeben.
Önce bir görsel seçin.|Choose an image first.|Zuerst Bild auswählen.
İmza boş görünüyor.|The signature appears empty.|Die Unterschrift scheint leer zu sein.
PDF Atölyesi|PDF Workshop|PDF-Werkstatt
Ana sayfa|Home|Startseite
Araçlar|Tools|Werkzeuge
Tüm araçlar|All tools|Alle Werkzeuge
Tüm araçları göster|Show all tools|Alle Werkzeuge anzeigen
Açık belgeye dön|Return to document|Zurück zum Dokument
PDF aç|Open PDF|PDF öffnen
Dosya aç|Open file|Datei öffnen
Dosya seç|Choose files|Dateien auswählen
PDF dosyanızı buraya bırakın|Drop your PDF here|PDF hier ablegen
Birden çok dosya bırakırsanız tek belgede birleştirilir. Görseller PDF sayfasına dönüşür.|Multiple files are merged into one document. Images become PDF pages.|Mehrere Dateien werden zusammengeführt. Bilder werden zu PDF-Seiten.
PDF açın, sayfaları düzenleyin, form doldurup imzalayın, dosyaları birleştirin. Hepsi Türkçe, hepsi tarayıcınızda.|Edit PDF text, run OCR, sign forms, export files and protect PDFs. Everything runs on your device.|PDF-Texte bearbeiten, OCR nutzen, Formulare unterschreiben, Dateien exportieren und PDFs schützen. Alles läuft auf Ihrem Gerät.
Dosyalarınız hiçbir sunucuya gönderilmez. Bütün işlemler bu sayfanın içinde, kendi cihazınızda yapılır.|Your documents stay on your device. All processing happens locally in this page.|Ihre Dokumente bleiben auf Ihrem Gerät. Alle Bearbeitungsschritte erfolgen lokal auf dieser Seite.
Sık kullanılanlar|Frequently used|Häufig verwendet
Oluştur ve düzenle|Create and edit|Erstellen und bearbeiten
İncele ve işaretle|Review and annotate|Prüfen und markieren
Formlar ve imzalar|Forms and signatures|Formulare und Unterschriften
Koru|Protect|Schützen
PDF oluştur|Create PDF|PDF erstellen
Fotoğraf ve görsellerden PDF yapın.|Create PDFs from photos and images.|PDFs aus Fotos und Bildern erstellen.
Dosyaları birleştir|Merge files|Dateien zusammenführen
PDF'leri ve görselleri tek dosyada toplayın.|Combine PDFs and images in one file.|PDFs und Bilder in einer Datei zusammenführen.
Sayfaları düzenle|Organize pages|Seiten organisieren
Döndürün, silin, sıralayın, sayfa ekleyin.|Rotate, delete, reorder and add pages.|Seiten drehen, löschen, sortieren und hinzufügen.
PDF'i düzenle|Edit PDF|PDF bearbeiten
Metin ve resim ekleyin, alanları beyazla örtün.|Add text and images or cover areas.|Text und Bilder hinzufügen oder Bereiche abdecken.
Mevcut metni seçip değiştirin; metin ve resim ekleyin.|Select and replace existing text; add text and images.|Vorhandenen Text auswählen und ersetzen; Text und Bilder hinzufügen.
PDF'i dışa aktar|Export PDF|PDF exportieren
DOCX, TXT, JPEG, PNG veya XLSX olarak kaydedin.|Save as DOCX, TXT, JPEG, PNG or XLSX.|Als DOCX, TXT, JPEG, PNG oder XLSX speichern.
Sayfaları PNG resme ya da düz metne çevirin.|Convert pages to PNG or plain text.|Seiten in PNG oder Klartext umwandeln.
Belgeyi böl|Split document|Dokument teilen
Sayfa aralıklarına göre ayrı dosyalara ayırın.|Split into files by page ranges.|Nach Seitenbereichen in Dateien aufteilen.
Yorum ekle|Annotate|Kommentieren
Vurgulayın, çizin, yapışkan not bırakın.|Highlight, draw and add notes.|Hervorheben, zeichnen und Notizen hinzufügen.
Damga|Stamp|Stempel
Onaylandı, Taslak gibi damgalar basın.|Add Approved, Draft and other stamps.|Stempel wie Genehmigt oder Entwurf einfügen.
Filigran ve sayfa numarası|Watermark and page numbers|Wasserzeichen und Seitenzahlen
Tüm sayfalara filigran ve numara ekleyin.|Add watermarks and numbers to all pages.|Wasserzeichen und Seitenzahlen auf allen Seiten hinzufügen.
Doldur ve İmzala|Fill and sign|Ausfüllen und unterschreiben
Form alanlarını doldurun, imzanızı ekleyin.|Fill form fields and add your signature.|Formularfelder ausfüllen und Unterschrift hinzufügen.
Karart|Redact|Schwärzen
Gizli bilgileri belgeden kalıcı olarak silin.|Permanently remove sensitive information.|Vertrauliche Informationen dauerhaft entfernen.
Belge özellikleri|Document properties|Dokumenteigenschaften
Başlık, yazar ve meta verileri düzenleyin.|Edit title, author and metadata.|Titel, Autor und Metadaten bearbeiten.
OCR · Metin tanıma|OCR · Text recognition|OCR · Texterkennung
Taranmış sayfaları okuyun; aranabilir metin ekleyin.|Read scanned pages and add searchable text.|Scans lesen und durchsuchbaren Text hinzufügen.
Bağlantılar|Links|Links
PDF bağlantılarını okuyun, ekleyin ve kaldırın.|Read, add and remove PDF links.|PDF-Links anzeigen, hinzufügen und entfernen.
PDF’yi koru|Protect PDF|PDF schützen
PDF’yi AES-256 ile şifreleyin; izinleri seçin.|Encrypt with AES-256 and choose permissions.|Mit AES-256 verschlüsseln und Berechtigungen auswählen.
Kaydet|Save|Speichern
Kaydet (Ctrl+S)|Save (Ctrl+S)|Speichern (Strg+S)
Geri al|Undo|Rückgängig
Yinele|Redo|Wiederholen
Geri al (Ctrl+Z)|Undo (Ctrl+Z)|Rückgängig (Strg+Z)
Yinele (Ctrl+Y)|Redo (Ctrl+Y)|Wiederholen (Strg+Y)
Kapat|Close|Schließen
Belgeyi kapat|Close document|Dokument schließen
Kaydedilmemiş değişiklikler|Unsaved changes|Ungespeicherte Änderungen
Kaydetmeden kapat|Close without saving|Ohne Speichern schließen
Yine de aç|Open anyway|Trotzdem öffnen
Tamam|OK|OK
Vazgeç|Cancel|Abbrechen
Devam et|Continue|Weiter
Aç|Open|Öffnen
Uygula|Apply|Anwenden
Sil|Delete|Löschen
Kaldır|Remove|Entfernen
Düzenle|Edit|Bearbeiten
Bitti (Esc)|Done (Esc)|Fertig (Esc)
İşlem tamamlanamadı|Action failed|Vorgang fehlgeschlagen
Parola|Password|Passwort
Parola gerekli|Password required|Passwort erforderlich
Kaydetme iptal edildi.|Saving cancelled.|Speichern abgebrochen.
Önceki kaydetme onayı hâlâ açık.|The previous save confirmation is still open.|Die vorherige Speicherbestätigung ist noch geöffnet.
Dosya bu görünümde kaydedilemeyecek kadar büyük.|The file is too large to save in this view.|Die Datei ist zum Speichern in dieser Ansicht zu groß.
Dosyalar açılıyor…|Opening files…|Dateien werden geöffnet…
PDF hazırlanıyor…|Preparing PDF…|PDF wird vorbereitet…
Sayfalar resme çevriliyor…|Converting pages to images…|Seiten werden in Bilder umgewandelt…
ZIP dosyası hazırlanıyor…|Preparing ZIP…|ZIP wird vorbereitet…
Metin çıkarılıyor…|Extracting text…|Text wird extrahiert…
Aranıyor…|Searching…|Suche läuft…
Çalışıyor…|Working…|Wird verarbeitet…
Küçük resimler|Thumbnails|Miniaturansichten
Yakınlaştırma|Zoom|Zoom
Genişliğe sığdır|Fit width|An Breite anpassen
Sayfaya sığdır|Fit page|An Seite anpassen
Sayfa numarası|Page number|Seitenzahl
Belgede ara|Search document|Dokument durchsuchen
Önceki sayfa|Previous page|Vorherige Seite
Sonraki sayfa|Next page|Nächste Seite
Yakınlaştır|Zoom in|Vergrößern
Uzaklaştır|Zoom out|Verkleinern
Seçim aracı|Selection tool|Auswahlwerkzeug
Seç|Select|Auswählen
Araç paneli|Tools panel|Werkzeugbereich
Tüm araçlara dön|Back to all tools|Zurück zu allen Werkzeugen
Metin|Text|Text
Yeni metin|New text|Neuer Text
Metin ekle|Add text|Text hinzufügen
Resim|Image|Bild
Resim ekle|Add image|Bild hinzufügen
İmza|Signature|Unterschrift
Beyaz kutu|White box|Weißes Rechteck
Beyaz kutuyla ört|Cover with white box|Weiß abdecken
Karartma alanı|Redaction area|Schwärzungsbereich
Dikdörtgen|Rectangle|Rechteck
Vurgu|Highlight|Hervorhebung
Çizim|Drawing|Zeichnung
Onay işareti|Check mark|Häkchen
Çarpı işareti|Cross mark|Kreuz
Yapışkan not|Sticky note|Haftnotiz
Öğe|Item|Element
Yazı boyutu|Font size|Schriftgröße
Renk|Color|Farbe
Kalınlık|Thickness|Strichstärke
Kalın|Bold|Fett
Metni düzenle|Edit text|Text bearbeiten
Sil (Delete)|Delete (Delete)|Löschen (Entf)
Öğeyi sil|Delete item|Element löschen
Boyutlandır|Resize|Größe ändern
Mevcut metni düzenle|Edit existing text|Vorhandenen Text bearbeiten
Orijinal metne dön|Restore original text|Originaltext wiederherstellen
Yazıyı seçip değiştirin. Taranmış sayfalarda önce OCR çalıştırın.|Select text to replace it. Run OCR first for scanned pages.|Text zum Ersetzen auswählen. Bei Scans zuerst OCR ausführen.
Eski metin PDF’den kaldırılır; yerine yeni metin yazılır. Yazı tipi Inter olarak yenilenir. Satır akışı otomatik yeniden kurulmaz.|Original text is removed and replaced using Inter. Paragraphs do not reflow automatically.|Originaltext wird entfernt und in Inter ersetzt. Absätze werden nicht automatisch neu umbrochen.
Metni sil|Delete text|Text löschen
Yazı boyutu 4–200 arasında olmalıdır.|Font size must be between 4 and 200.|Die Schriftgröße muss zwischen 4 und 200 liegen.
Yazı tipinde bulunmayan karakterler:|Characters not supported by this font:|Von dieser Schrift nicht unterstützte Zeichen:
Metin eklemek istediğiniz yere tıklayın.|Click where you want to add text.|Auf die gewünschte Textposition klicken.
Yapışkan notu koymak istediğiniz yere tıklayın.|Click where you want to place a note.|Auf die gewünschte Notizposition klicken.
Tarihi eklemek istediğiniz yere tıklayın.|Click where you want to add the date.|Auf die gewünschte Datumsposition klicken.
Örtmek istediğiniz alanı sürükleyerek seçin.|Drag to select an area to cover.|Den abzudeckenden Bereich durch Ziehen auswählen.
Dikdörtgeni sürükleyerek çizin.|Drag to draw a rectangle.|Ein Rechteck durch Ziehen zeichnen.
Vurgulamak istediğiniz alanı sürükleyerek seçin.|Drag to select an area to highlight.|Den hervorzuhebenden Bereich durch Ziehen auswählen.
Sayfanın üzerinde sürükleyerek çizin.|Drag to draw on the page.|Durch Ziehen auf der Seite zeichnen.
Karartmak istediğiniz alanı sürükleyerek işaretleyin.|Drag to mark the area to redact.|Den zu schwärzenden Bereich durch Ziehen markieren.
Damgayı basmak istediğiniz yere tıklayın.|Click to place a stamp.|Auf die gewünschte Stempelposition klicken.
İmzanın yerini tıklayarak seçin.|Click to place your signature.|Auf die gewünschte Unterschriftsposition klicken.
Resmi koymak istediğiniz yere tıklayın.|Click to place an image.|Auf die gewünschte Bildposition klicken.
Onay işaretini koymak istediğiniz yere tıklayın.|Click to place a check mark.|Auf die gewünschte Häkchenposition klicken.
Çarpı işaretini koymak istediğiniz yere tıklayın.|Click to place a cross mark.|Auf die gewünschte Kreuzposition klicken.
Değiştirmek istediğiniz mevcut metne tıklayın. Taramalar için önce OCR çalıştırın.|Click existing text to replace it. Run OCR first for scans.|Auf vorhandenen Text zum Ersetzen klicken. Bei Scans zuerst OCR ausführen.
Bağlantı alanını sayfa üzerinde sürükleyerek seçin.|Drag to select a link area on the page.|Den Linkbereich auf der Seite durch Ziehen auswählen.
Eklediğiniz öğeyi taşımak için sürükleyin, metni değiştirmek için çift tıklayın, silmek için Delete tuşuna basın.|Drag added items to move them, double-click text to edit, and press Delete to remove.|Elemente durch Ziehen verschieben, Text durch Doppelklick bearbeiten und mit Entf löschen.
Vurgula|Highlight|Hervorheben
Kalemle çiz|Draw|Zeichnen
Vurgu rengi|Highlight color|Hervorhebungsfarbe
Kalem|Pen|Stift
Yorumlar kaydederken sayfanın bir parçası olarak işlenir; her PDF okuyucuda aynı görünür.|Annotations become part of the page when saved and look the same in every reader.|Markierungen werden beim Speichern Teil der Seite und sehen in allen PDF-Readern gleich aus.
İmza oluştur|Create signature|Unterschrift erstellen
Kayıtlı imzalar|Saved signatures|Gespeicherte Unterschriften
Bu imzayı yerleştir|Place this signature|Diese Unterschrift einfügen
Kayıtlı imza|Saved signature|Gespeicherte Unterschrift
İmzayı unut|Forget signature|Unterschrift vergessen
Ekle|Add|Hinzufügen
Bugünün tarihi|Today's date|Heutiges Datum
Form alanları|Form fields|Formularfelder
Form alanları aranıyor…|Looking for form fields…|Formularfelder werden gesucht…
Bu belgede doldurulabilir form alanı yok. Metin, tarih ve işaretleri istediğiniz yere ekleyebilirsiniz.|This PDF has no fillable fields. Add text, dates and marks anywhere.|Dieses PDF hat keine ausfüllbaren Felder. Text, Datum und Markierungen können frei eingefügt werden.
Kaydederken formu düzleştir|Flatten form when saving|Formular beim Speichern reduzieren
Alanlar düz yazıya dönüşür, sonradan değiştirilemez.|Fields become static content and cannot be edited later.|Felder werden zu statischem Inhalt und sind danach nicht mehr bearbeitbar.
Kendi damganız|Custom stamp|Eigener Stempel
Örn. ÖDENDİ|e.g. PAID|z. B. BEZAHLT
ONAYLANDI|APPROVED|GENEHMIGT
REDDEDİLDİ|REJECTED|ABGELEHNT
TASLAK|DRAFT|ENTWURF
GİZLİ|CONFIDENTIAL|VERTRAULICH
ALINDI|RECEIVED|ERHALTEN
KOPYA|COPY|KOPIE
Filigran|Watermark|Wasserzeichen
Sayfa numaraları|Page numbers|Seitenzahlen
Metin / filigran|Text / watermark|Text / Wasserzeichen
Şeffaflık|Opacity|Deckkraft
Açı|Angle|Winkel
Konum|Position|Position
Başlangıç numarası|Start number|Startnummer
Biçim|Format|Format
Sayfa {n} / {N}|Page {n} / {N}|Seite {n} / {N}
Alt orta|Bottom center|Unten mittig
Alt sol|Bottom left|Unten links
Alt sağ|Bottom right|Unten rechts
Üst orta|Top center|Oben mittig
Üst sol|Top left|Oben links
Üst sağ|Top right|Oben rechts
İşaretleri kaldır|Clear marks|Markierungen entfernen
Henüz karartma için işaretli alan yok.|No areas marked for redaction.|Noch keine Bereiche zum Schwärzen markiert.
Kaydettiğinizde işaretli alanların altındaki yazı ve görüntü kalıcı olarak silinir. Karartma yapılan sayfalar yüksek çözünürlüklü resme dönüştürülür; bu sayfalardaki metin artık seçilemez ve aranamaz.|Saving permanently removes content under the marked areas. Redacted pages become high-resolution images; their original text is no longer selectable or searchable.|Beim Speichern wird der Inhalt markierter Bereiche dauerhaft entfernt. Geschwärzte Seiten werden zu hochauflösenden Bildern; der Originaltext ist nicht mehr auswählbar oder durchsuchbar.
Kaydetmeden önce işaretli alanları taşıyabilir, büyütebilir ya da silebilirsiniz.|Move, resize or remove marked areas before saving.|Markierte Bereiche lassen sich vor dem Speichern verschieben, vergrößern oder löschen.
Bölme yöntemi|Split method|Teilungsmethode
Her N sayfada bir|Every N pages|Alle N Seiten
Sayfa aralıklarına göre|By page ranges|Nach Seitenbereichen
Kaç sayfada bir bölünsün?|Pages per file?|Seiten pro Datei?
Sayfa aralıkları (her biri ayrı dosya olur)|Page ranges (one file per range)|Seitenbereiche (eine Datei pro Bereich)
Örn. 1-3, 4-6, 7|e.g. 1-3, 4-6, 7|z. B. 1-3, 4-6, 7
Böl ve ZIP olarak kaydet|Split and save ZIP|Teilen und als ZIP speichern
Belge bölünüyor…|Splitting document…|Dokument wird geteilt…
Resim (PNG)|Image (PNG)|Bild (PNG)
Resim (JPEG)|Image (JPEG)|Bild (JPEG)
Düz metin (TXT)|Plain text (TXT)|Klartext (TXT)
Word (DOCX)|Word (DOCX)|Word (DOCX)
Excel (XLSX)|Excel (XLSX)|Excel (XLSX)
Ekran (72 dpi)|Screen (72 dpi)|Bildschirm (72 dpi)
Standart (150 dpi)|Standard (150 dpi)|Standard (150 dpi)
Baskı (300 dpi)|Print (300 dpi)|Druck (300 dpi)
Çözünürlük|Resolution|Auflösung
Dışa aktar|Export|Exportieren
DOCX hazırlanıyor…|Preparing DOCX…|DOCX wird erstellt…
XLSX hazırlanıyor…|Preparing XLSX…|XLSX wird erstellt…
Çıkarılabilir metin yok. Önce OCR çalıştırın.|No extractable text. Run OCR first.|Kein extrahierbarer Text. Zuerst OCR ausführen.
Düzenlenebilir metin|Editable text|Bearbeitbarer Text
Sayfa görünümünü koru (görsel)|Preserve page appearance (image)|Seitendarstellung erhalten (Bild)
Word çıktısı|Word output|Word-Ausgabe
JPEG kalitesi (%)|JPEG quality (%)|JPEG-Qualität (%)
Düzenlenebilir DOCX metni yeniden akıtır. Görsel modu görünümü korur ancak metin düzenlenemez.|Editable DOCX reflows text. Image mode preserves appearance, but the text cannot be edited.|Bearbeitbare DOCX-Dateien brechen Text neu um. Im Bildmodus bleibt die Darstellung erhalten; der Text ist nicht bearbeitbar.
Her PDF sayfası bir Excel sayfasına aktarılır. Sütunlar metin konumlarından tahmin edilir; sonuçları kontrol edin.|Each PDF page becomes one worksheet. Columns are inferred from text positions; check the result.|Jede PDF-Seite wird zu einem Tabellenblatt. Spalten werden aus Textpositionen abgeleitet; Ergebnis prüfen.
UTF-8 metin çıktısı, düzenlemeleri ve OCR metnini içerir.|UTF-8 text includes your edits and OCR text.|UTF-8-Text enthält Ihre Änderungen und OCR-Text.
Birden çok sayfa resim olarak ZIP içinde indirilir.|Multiple page images are downloaded in a ZIP.|Mehrere Seitenbilder werden in einer ZIP-Datei heruntergeladen.
Tarama sayfalarının metin çıktısı için önce OCR çalıştırın.|Run OCR first to export text from scanned pages.|Für Textausgaben aus Scans zuerst OCR ausführen.
Excel sayfa sınırı aşıldı.|Excel worksheet limit exceeded.|Excel-Tabellenblattgrenze überschritten.
Başlık|Title|Titel
Yazar|Author|Autor
Konu|Subject|Betreff
Anahtar sözcükler|Keywords|Schlüsselwörter
virgülle ayırın|separate with commas|durch Kommas trennen
Kaydederken yukarıdakiler dışındaki tüm meta verileri temizle|Remove other metadata on save|Andere Metadaten beim Speichern entfernen
OCR dili|OCR language|OCR-Sprache
Sayfalar|Pages|Seiten
Tüm sayfalar|All pages|Alle Seiten
Geçerli sayfa|Current page|Aktuelle Seite
Seçili sayfalar|Selected pages|Ausgewählte Seiten
Metin katmanı olan sayfaları atla|Skip pages with a text layer|Seiten mit Textebene überspringen
OCR çalıştır|Run OCR|OCR ausführen
OCR hazırlanıyor…|Preparing OCR…|OCR wird vorbereitet…
OCR sayfası|OCR page|OCR-Seite
Metin tanınıyor…|Recognizing text…|Text wird erkannt…
OCR tamamlandı.|OCR finished.|OCR abgeschlossen.
metinli sayfa atlandı.|pages with text skipped.|Seiten mit Text übersprungen.
Durdur|Stop|Stoppen
Durduruluyor…|Stopping…|Wird angehalten…
OCR sonucu|OCR result|OCR-Ergebnis
Geçerli sayfanın sonucu|Current page result|Ergebnis der aktuellen Seite
Güven oranı|Confidence|Erkennungssicherheit
Tanınan metni düzenle|Edit recognized text|Erkannten Text bearbeiten
Önce sayfaları düzenle aracında sayfa seçin.|Select pages in Organize pages first.|Zuerst Seiten unter Seiten organisieren auswählen.
OCR cihazınızda çalışır. İnternet gerekmez. Sonuçları kontrol edin; özellikle tablolar ve düşük kaliteli taramalarda hata olabilir.|OCR runs on your device without internet. Review results, especially tables and poor scans.|OCR läuft ohne Internet auf Ihrem Gerät. Ergebnisse prüfen, besonders bei Tabellen und schlechten Scans.
Kaydedilen PDF aranabilir olur. OCR metni DOCX, TXT ve XLSX çıktısına da eklenir.|The saved PDF is searchable. OCR text is also included in DOCX, TXT and XLSX exports.|Das gespeicherte PDF ist durchsuchbar. OCR-Text wird auch in DOCX, TXT und XLSX exportiert.
OCR metin konumlarını döndürmedi. Yeniden deneyin.|OCR did not return text positions. Try again.|OCR hat keine Textpositionen geliefert. Erneut versuchen.
PDF motoru başlatılamadı. Güncel Chrome, Edge veya Firefox ile deneyin.|The PDF engine could not start. Try a current Chrome, Edge or Firefox.|Die PDF-Engine konnte nicht starten. Aktuelles Chrome, Edge oder Firefox verwenden.
PDF parolası doğrulanamadı.|The PDF password could not be verified.|Das PDF-Passwort konnte nicht bestätigt werden.
Açılış parolası|Opening password|Passwort zum Öffnen
Parolayı tekrar girin|Confirm password|Passwort wiederholen
Sahip parolası|Owner password|Besitzerpasswort
İsteğe bağlı|Optional|Optional
İzinler|Permissions|Berechtigungen
Yazdırmaya izin ver|Allow printing|Drucken erlauben
Metin kopyalamaya izin ver|Allow text copying|Textkopieren erlauben
Düzenlemeye izin ver|Allow editing|Bearbeiten erlauben
Korumalı PDF indir|Download protected PDF|Geschütztes PDF herunterladen
PDF şifreleniyor…|Encrypting PDF…|PDF wird verschlüsselt…
PDF, açılış parolasıyla AES-256 olarak şifrelenir. Parolayı güvenli bir yerde saklayın.|The PDF is encrypted with AES-256 and an opening password. Keep the password in a safe place.|Das PDF wird mit AES-256 und einem Öffnungspasswort verschlüsselt. Passwort sicher aufbewahren.
Sahip parolası boşsa rastgele oluşturulur. İzinler okuyucunun desteğine bağlıdır; açılış parolası şifreleme sağlar.|A blank owner password is generated randomly. Permissions depend on reader support; the opening password provides encryption.|Ein leeres Besitzerpasswort wird zufällig erzeugt. Berechtigungen hängen vom Reader ab; das Öffnungspasswort sorgt für Verschlüsselung.
Açılış parolası girin.|Enter an opening password.|Passwort zum Öffnen eingeben.
Parolalar eşleşmiyor.|Passwords do not match.|Die Passwörter stimmen nicht überein.
Sahip parolası açılış parolasından farklı olmalıdır.|Owner and opening passwords must differ.|Besitzer- und Öffnungspasswort müssen unterschiedlich sein.
Parolada virgül veya kontrol karakteri kullanmayın.|Do not use commas or control characters in passwords.|Keine Kommas oder Steuerzeichen im Passwort verwenden.
Bağlantı|Link|Link
Yeni bağlantı|New link|Neuer Link
Bağlantı ekle|Add link|Link hinzufügen
Bağlantıyı düzenle|Edit link|Link bearbeiten
Bağlantıyı aç|Open link|Link öffnen
Bağlantı adresi|Link address|Linkadresse
Geçerli bir bağlantı girin.|Enter a valid link.|Gültigen Link eingeben.
Yalnızca http, https, mailto ve tel bağlantıları desteklenir.|Only http, https, mailto and tel links are supported.|Nur http-, https-, mailto- und tel-Links werden unterstützt.
Hedef sayfa belgede bulunamadı.|The target page is not in this document.|Die Zielseite ist nicht im Dokument vorhanden.
Seçili alan tıklanabilir bağlantı olarak PDF’ye eklenir.|The selected area becomes a clickable PDF link.|Der ausgewählte Bereich wird als klickbarer PDF-Link eingefügt.
Bu sayfada PDF bağlantısı yok.|No PDF links on this page.|Keine PDF-Links auf dieser Seite.
Önce bağlantı alanını çizip adresi girin. Mevcut bağlantılar aşağıda listelenir.|Draw a link area and enter its address. Existing links are listed below.|Linkbereich zeichnen und Adresse eingeben. Vorhandene Links stehen unten.
Geçerli sayfanın bağlantıları|Current page links|Links der aktuellen Seite
URL’den PDF aç|Open PDF from URL|PDF über URL öffnen
URL’den açma için sunucunun CORS izni gerekir. Açılmazsa PDF’yi indirip dosya olarak açın.|Opening a URL requires the server to allow CORS. Otherwise download the PDF and open it as a file.|Zum Öffnen einer URL muss der Server CORS erlauben. Sonst PDF herunterladen und als Datei öffnen.
PDF indiriliyor…|Downloading PDF…|PDF wird heruntergeladen…
Bağlantı bir PDF dosyası döndürmedi.|The link did not return a PDF file.|Der Link hat keine PDF-Datei geliefert.
URL açılamadı. Sunucu CORS izni vermiyor veya bağlantı erişilemiyor.|Could not open URL. CORS is blocked or the link is unavailable.|URL konnte nicht geöffnet werden. CORS ist gesperrt oder der Link ist nicht erreichbar.
Sayfa|Page|Seite
PDF Atölyesi hakkında|About PDF Workshop|Über PDF-Werkstatt
Klavye kısayolları|Keyboard shortcuts|Tastenkürzel
Bilinen sınırlar|Known limitations|Bekannte Grenzen
Açık kaynak bileşenler|Open-source components|Open-Source-Komponenten
Dosyaları açmak için bırakın|Drop to open files|Dateien zum Öffnen ablegen
Arayüz dili|Interface language|Sprache der Oberfläche
Açık / koyu tema|Light / dark theme|Helles / dunkles Design
Temayı değiştir|Toggle theme|Design wechseln
Yardım ve kısayollar|Help and shortcuts|Hilfe und Tastenkürzel
Yardım|Help|Hilfe
Sayfa küçük resimleri|Page thumbnails|Seitenminiaturen
Araç paneli|Tools panel|Werkzeugbereich
Sayfayı sil|Delete page|Seite löschen
Sola döndür|Rotate left|Nach links drehen
Sağa döndür|Rotate right|Nach rechts drehen
Boş sayfa ekle|Add blank page|Leere Seite hinzufügen
Dosyadan sayfa ekle|Insert pages from file|Seiten aus Datei einfügen
Seçili sayfaları ayıkla|Extract selected pages|Ausgewählte Seiten extrahieren
Tümünü seç|Select all|Alle auswählen
Seçimi kaldır|Deselect|Auswahl aufheben
Sayfaları sil|Delete pages|Seiten löschen
İmza ekle|Add signature|Unterschrift hinzufügen
Çiz|Draw|Zeichnen
Yaz|Type|Schreiben
Görsel yükle|Upload image|Bild hochladen
Temizle|Clear|Leeren
İmzayı kaydet|Save signature|Unterschrift speichern
Birleştir|Merge|Zusammenführen
Dosya ekle|Add files|Dateien hinzufügen
Görsel ekle|Add images|Bilder hinzufügen
PDF oluşturuluyor…|Creating PDF…|PDF wird erstellt…
İmza hazırlanıyor…|Preparing signature…|Unterschrift wird vorbereitet…
Resim hazırlanıyor…|Preparing image…|Bild wird vorbereitet…
Önizleme|Preview|Vorschau
Filigran ekle|Add watermark|Wasserzeichen hinzufügen
Sayfa numarası ekle|Add page numbers|Seitenzahlen hinzufügen
Üste taşı|Move up|Nach oben verschieben
Alta taşı|Move down|Nach unten verschieben
Seçili sayfaları sil|Delete selected pages|Ausgewählte Seiten löschen
Seçili sayfaları döndür|Rotate selected pages|Ausgewählte Seiten drehen
Boş sayfa|Blank page|Leere Seite
Dosyadan ekle|Insert from file|Aus Datei einfügen
Ayıkla ve kaydet|Extract and save|Extrahieren und speichern
Seçili sayfalar ayrı PDF olarak kaydedilir.|Selected pages are saved as a separate PDF.|Ausgewählte Seiten werden als eigene PDF gespeichert.
İmzanızı yazın|Type your signature|Unterschrift eingeben
İmzanızı buraya çizin|Draw your signature here|Unterschrift hier zeichnen
Bu imzayı hatırla|Remember this signature|Diese Unterschrift merken
Görüntü boyutu|Image size|Bildgröße
Sayfa boyutu|Page size|Seitengröße
Görsel boyutu|Image size|Bildgröße
Orijinal boyut|Original size|Originalgröße
A4'e sığdır|Fit to A4|An A4 anpassen
Adınız ve soyadınız|Your full name|Vor- und Nachname
Dosyaları ne yapalım?|What should happen to these files?|Was soll mit den Dateien geschehen?
Yeni belge olarak aç|Open as new document|Als neues Dokument öffnen
Belgeye ekle|Add to document|Zum Dokument hinzufügen
PDF Atölyesi yüklenemedi|PDF Workshop could not load|PDF-Werkstatt konnte nicht geladen werden
Gerekli kütüphaneler indirilemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.|Required libraries could not load. Check the connection or use the offline version.|Benötigte Bibliotheken konnten nicht geladen werden. Verbindung prüfen oder Offline-Version verwenden.
Metin değiştirme, OCR, dışa aktarma, bağlantılar ve parola koruması bu sürüme eklendi.|This version includes text replacement, OCR, exports, links and password protection.|Diese Version bietet Textersetzung, OCR, Export, Links und Passwortschutz.
Yeni metin Inter ile yazılır; eski paragrafların düzeni otomatik olarak yeniden akmaz.|Replacement text uses Inter; existing paragraphs do not reflow automatically.|Ersatztext verwendet Inter; bestehende Absätze werden nicht automatisch neu umbrochen.
DOCX ve XLSX çıktılarının düzenini kontrol edin. Karmaşık PDF tabloları birebir dönüştürülmez.|Check DOCX and XLSX layout. Complex PDF tables are not converted exactly.|DOCX- und XLSX-Layout prüfen. Komplexe PDF-Tabellen werden nicht exakt konvertiert.
URL’den açma sunucunun CORS desteğine bağlıdır. PDF yer imleri kaydederken korunmayabilir.|Opening URLs depends on server CORS support. PDF bookmarks may not survive saving.|Das Öffnen von URLs hängt von CORS ab. PDF-Lesezeichen können beim Speichern verloren gehen.
Seçili öğeyi ya da sayfaları sil|Delete selected item or pages|Ausgewähltes Element oder Seiten löschen
Aracı bırak, seçimi kaldır|Leave tool, clear selection|Werkzeug verlassen, Auswahl aufheben
Seçili öğeyi kaydır (Shift ile 10 pt)|Move selected item (Shift: 10 pt)|Element verschieben (Umschalt: 10 pt)
Ok tuşları|Arrow keys|Pfeiltasten
`;
for(const row of UI_ROWS.trim().split('\n')){const [key,en,de]=row.split('|');if(key&&en&&de)UI_TEXT[key]={en,de};}
const UI_PATTERNS=[
 ['{0} sayfa seçili','{0} pages selected','{0} Seiten ausgewählt'],
 ['“{0}” açılamadı. Yalnızca PDF ve görsel dosyaları (JPG, PNG, WebP, GIF, BMP) desteklenir.','Could not open “{0}”. Only PDFs and images (JPG, PNG, WebP, GIF, BMP) are supported.','„{0}“ konnte nicht geöffnet werden. Nur PDFs und Bilder (JPG, PNG, WebP, GIF, BMP) werden unterstützt.'],
 ['“{0}” anlaşılamadı. Aralıkları 1-3 ya da 5 biçiminde yazın.','Could not parse “{0}”. Use ranges such as 1-3 or 5.','„{0}“ wurde nicht erkannt. Bereiche wie 1-3 oder 5 eingeben.'],
 ['“{0}” aralığı geçersiz. Belgede {1} sayfa var.','Invalid range “{0}”. The document has {1} pages.','Ungültiger Bereich „{0}“. Das Dokument hat {1} Seiten.'],
 ['“{0}” görsel değil, atlandı.','“{0}” is not an image and was skipped.','„{0}“ ist kein Bild und wurde übersprungen.'],
 ['“{0}” kaydedilmek üzere işlenemedi: {1}','Could not process “{0}” for saving: {1}','„{0}“ konnte zum Speichern nicht verarbeitet werden: {1}'],
 ['Kaydedildi: {0}','Saved: {0}','Gespeichert: {0}'],['İndirildi: {0}','Downloaded: {0}','Heruntergeladen: {0}'],
 ['Açılıyor ({0}/{1}): {2}','Opening ({0}/{1}): {2}','Wird geöffnet ({0}/{1}): {2}'],
 ['{0} sayfa eklendi.','{0} pages added.','{0} Seiten hinzugefügt.'],
 ['Araçlar açık belgeye uygulanır: {0}','Tools apply to: {0}','Werkzeuge werden angewendet auf: {0}'],
 ['Bir araç seçin. Belge gerektiren araçlar önce dosya seçmenizi ister.','Choose a tool. Document tools ask you to open a file first.','Werkzeug auswählen. Bei Dokumentwerkzeugen wird zuerst eine Datei geöffnet.'],
 ['“{0}” bulunamadı.','“{0}” not found.','„{0}“ nicht gefunden.'],
 ['Sayfa {0}/{1} işleniyor…','Processing page {0}/{1}…','Seite {0}/{1} wird verarbeitet…'],
 ['Sayfa {0}/{1} çiziliyor…','Rendering page {0}/{1}…','Seite {0}/{1} wird gerendert…'],
 ['Bölüm {0}/{1} hazırlanıyor…','Preparing part {0}/{1}…','Teil {0}/{1} wird vorbereitet…'],
 ['Renk {0}','Color {0}','Farbe {0}'],
 ['Bu belgede {0} form alanı var. Alanların içine tıklayıp doğrudan yazabilirsiniz.','This document has {0} form fields. Click a field to fill it.','Dieses Dokument hat {0} Formularfelder. Zum Ausfüllen in ein Feld klicken.'],
 ['{0} sayfadan {1} dosya oluşur.','{0} pages produce {1} files.','Aus {0} Seiten werden {1} Dateien.'],
 ['{0} alan karartma için işaretli.','{0} areas marked for redaction.','{0} Bereiche zum Schwärzen markiert.'],
 ['Dosya adı: {0}. Kaydedilen dosyada oluşturucu olarak “PDF Workshop” yazar.','Filename: {0}. The creator is recorded as PDF Workshop.','Dateiname: {0}. PDF-Werkstatt wird als Ersteller eingetragen.'],
 ['Beklenmeyen bir hata oluştu: {0}','An unexpected error occurred: {0}','Unerwarteter Fehler: {0}'],
 ['“{0}” parola korumalı. Açmak için parolayı girin.','“{0}” is password protected. Enter the password.','„{0}“ ist passwortgeschützt. Passwort eingeben.'],
 ['Parola yanlış. “{0}” için parolayı yeniden girin.','Incorrect password. Try again for “{0}”.','Falsches Passwort. Für „{0}“ erneut eingeben.'],
 ['“{0}” için parola girilmediği için dosya açılmadı.','“{0}” was not opened because no password was entered.','„{0}“ wurde ohne Passworteingabe nicht geöffnet.'],
 ['“{0}” okunamadı. Dosya bozuk ya da PDF değil.','Could not read “{0}”. The file is damaged or is not a PDF.','„{0}“ konnte nicht gelesen werden. Datei beschädigt oder kein PDF.'],
 ['“{0}” görseli okunamadı.','Could not read image “{0}”.','Bild „{0}“ konnte nicht gelesen werden.'],
 ['“{0}” belgesinde kaydedilmemiş değişiklikler var. Yeni dosyayı açarsanız bu değişiklikler kaybolur.','“{0}” has unsaved changes. Opening a new file discards them.','„{0}“ hat ungespeicherte Änderungen. Beim Öffnen einer neuen Datei gehen diese verloren.'],
 ['“{0}” belgesindeki kaydedilmemiş değişiklikler kaybolacak.','Unsaved changes to “{0}” will be lost.','Ungespeicherte Änderungen an „{0}“ gehen verloren.'],
 ['{0} dosya bıraktınız. Açık belgeye mi eklensin, yoksa yeni belge olarak mı açılsın?','You dropped {0} files. Add them to the document or open a new document?','{0} Dateien abgelegt. Zum Dokument hinzufügen oder als neues Dokument öffnen?'],
];
const patternCache=UI_PATTERNS.map(([key,en,de])=>{
  const parts=key.split(/(\{\d+\})/),indices=[];
  const regex='^'+parts.map(p=>{if(/^\{\d+\}$/.test(p)){indices.push(+p.slice(1,-1));return '(.*?)';}return p.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('')+'$';
  return {regex:new RegExp(regex,'s'),en,de,indices};
});
function tr(value){
  const s=String(value??'');if(uiLang==='tr')return s;
  const exact=UI_TEXT[s];if(exact)return exact[uiLang]||s;
  if(/^Sayfa (\d+|\{n\})$/.test(s))return (uiLang==='de'?'Seite ':'Page ')+s.slice(6);
  for(const p of patternCache){const m=p.regex.exec(s);if(m){const args={};p.indices.forEach((n,i)=>args[n]=m[i+1]);return p[uiLang].replace(/\{(\d+)\}/g,(_,n)=>args[n]??'');}}
  return s;
}
function applyLanguage(language,rebuild=true){
  commitEditing();uiLang=['tr','en','de'].includes(language)?language:'en';
  try{localStorage.setItem('pdf-workshop.language',uiLang);}catch{}
  document.documentElement.lang=uiLang;document.title=tr('PDF Atölyesi')+' v'+APP_VERSION;
  $('#brand .txt').textContent=tr('PDF Atölyesi')+' v'+APP_VERSION;$('#brand').setAttribute('aria-label',tr('PDF Atölyesi')+' · '+tr('Ana sayfa'));
  $('#languageSelect').value=uiLang;$('#languageSelect').setAttribute('aria-label',tr('Arayüz dili'));
  for(const [id,title,aria]of [['themeBtn','Açık / koyu tema','Temayı değiştir'],['aboutBtn','Kullanım rehberi','Kullanım rehberi'],['thumbs',null,'Sayfa küçük resimleri'],['pane',null,'Araç paneli']]){
    const e=$('#'+id);if(title)e.title=tr(title);e.setAttribute('aria-label',tr(aria));
  }
  $('#dragcover').textContent=tr('Dosyaları açmak için bırakın');
  // Never translate stamps, watermarks or text already added to a document.
  const originalStamps=['ONAYLANDI','REDDEDİLDİ','TASLAK','GİZLİ','ALINDI','KOPYA'];
  STAMPS.forEach((s,i)=>s.text=tr(originalStamps[i]));
  if(rebuild){renderTabs();renderHome();renderTools();if(S.doc)rebuildDoc();}
}
const baseNewDoc=newDoc;
newDoc=function(name){const doc=baseNewDoc(name);doc.settings.wm.text=tr('TASLAK');doc.settings.pn.fmt=tr('Sayfa {n} / {N}');return doc;};
const baseTrackCurrent=trackCurrent;
trackCurrent=function(){const prior=S.cur;baseTrackCurrent();if(S.cur!==prior&&['ocr','links','fontinfo'].includes(S.tool))renderPane();};
const baseGoPage=goPage;
goPage=function(i){baseGoPage(i);if(['ocr','links','fontinfo'].includes(S.tool))renderPane();};
// Search includes local OCR and text replacements, as well as visible PDF text.
runSearch=async function(q,dir=1){
  if(!S.doc)return;q=(q||'').trim();if(!q){clearSearch();return;}
  const lower=s=>s.toLocaleLowerCase(uiLang==='tr'?'tr':uiLang==='de'?'de':'en');
  if(!S.search||S.search.q!==q){
    const hits=[],needle=lower(q);
    await busy(tr('Aranıyor…'),async()=>{
      for(const page of S.doc.pages){
        const candidates=await nativeCandidates(page);
        candidates.push(...page.items.filter(it=>it.type==='text'&&it.text).map(it=>({text:it.text,box:it})));
        for(const c of candidates){if(page.items.some(it=>it.type==='redact'&&overlap(c.box,it)>0))continue;
          const text=lower(c.text);let index=text.indexOf(needle);
          while(index>=0&&hits.length<2000){hits.push({pageId:page.id,box:{x:c.box.x+c.box.w*index/Math.max(1,text.length),y:c.box.y,w:Math.max(3,c.box.w*needle.length/Math.max(1,text.length)),h:c.box.h}});index=text.indexOf(needle,index+1);}
        }
      }
    });
    S.search={q,hits,i:-1};
  }
  const result=S.search;if(!result.hits.length){$('#searchCnt').textContent='0';toast(tr('“'+q+'” bulunamadı.'));return;}
  result.i=(result.i+dir+result.hits.length)%result.hits.length;
  const hit=result.hits[result.i],page=pageById(hit.pageId);
  S.doc.pages.forEach(p=>renderItems(p));goPage(S.doc.pages.indexOf(page));
  $('#searchCnt').textContent=`${result.i+1}/${result.hits.length}`;
};
const baseMarkDirty=markDirty;
markDirty=function(){S.search=null;baseMarkDirty();};
aboutDialog=function(){
  dialog(tr('PDF Atölyesi hakkında'),h('div',null,h('p',null,tr('Metin değiştirme, OCR, dışa aktarma, bağlantılar ve parola koruması bu sürüme eklendi.')),
    h('h4',null,tr('Klavye kısayolları')),h('p',null,'Ctrl+O · Ctrl+S · Ctrl+Z · Ctrl+Y · Ctrl+F · Delete · Esc'),
    h('h4',null,tr('Bilinen sınırlar')),h('ul',null,
      h('li',null,tr('Yeni metin Inter ile yazılır; eski paragrafların düzeni otomatik olarak yeniden akmaz.')),
      h('li',null,tr('DOCX ve XLSX çıktılarının düzenini kontrol edin. Karmaşık PDF tabloları birebir dönüştürülmez.')),
      h('li',null,tr('URL’den açma sunucunun CORS desteğine bağlıdır. PDF yer imleri kaydederken korunmayabilir.'))),
    h('h4',null,tr('Açık kaynak bileşenler')),h('p',null,'PDF.js 3.11.174 · pdf-lib 1.17.1 · fontkit 1.1.1 · JSZip 3.10.1 · Tesseract.js 7.0.0 · MuPDF 1.26.4 (AGPL-3.0-or-later) · Inter · Dancing Script · Lucide')),
    [{label:tr('Kapat'),kind:'primary',value:true}],{width:600});
};

