// n8n Workflow Monitor — Property Inspector (browser side)
// Uses the real $UD global created by ../libs/js/ulanzideckApi.js
let ACTION_SETTING = {};
let ready = false;   // don't persist until saved settings have loaded (prevents blanking)
let filled = false;  // stop re-requesting once the backend's config has arrived

const $ = (id) => document.getElementById(id);
const val = (id) => { const e = $(id); return e ? e.value : ''; };
const setVal = (id, v) => { const e = $(id); if (e && v != null) e.value = v; };
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }

const THEMES = ['midnight', 'carbon', 'ocean', 'grape', 'slate', 'mono', 'paper', 'snow', 'daylight', 'sand'];
const LAYOUTS = [['chips','Chips'],['header','Status header'],['ring','Ring'],['split','Split'],['minimal','Minimal'],['line','Line graph'],['bars','Bar graph'],['dual','Two numbers'],['statusHero','Status hero'],['rows','Labeled rows'],['progress','Progress bar'],['dots','Run dots'],['grid','2×2 grid'],['nameHero','Name hero'],['sidebar','Side accent'],['gauge','Gauge']];

// ── i18n (interface language) ────────────────────────────────────────────────────
const I18N = {
  en: {
    language: 'Language', conn: 'n8n Connection', baseUrl: 'Base URL', apiKey: 'API Key',
    apiKeyHint: 'Stored locally in the action settings. Never leaves your machine.',
    wfId: 'Workflow ID', wfIdHint: 'From the n8n URL:', onPress: 'On key press, open',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (run history)',
    thresholds: 'Thresholds', warnErr: 'Warn at errors ≥', critErr: 'Critical at errors ≥',
    slowMs: 'Slow if last run > (ms)', display: 'Display', bigNumber: 'Big number',
    period: 'Period', layout: 'Layout',
    cardText: 'Card text size — chips & labels (1–10):',
    cardTextHint: 'Bigger = larger secondary text (chips / labels). High levels may overlap — pick your sweet spot.',
    longName: 'Long name', nm_left: 'Left — clip, static (default)', nm_fit: 'Fit — auto-size to width',
    nm_paginate: 'Paginate — page through', nm_scroll: 'Scroll — marquee',
    titleSize: 'Title size (1–10):', checkEvery: 'Check every (sec)', color: 'Color',
    save: 'Save settings', checkNow: '↻ Check now', notify: 'Desktop alert on failure'
  },
  ru: {
    language: 'Язык', conn: 'Подключение n8n', baseUrl: 'Базовый URL', apiKey: 'API-ключ',
    apiKeyHint: 'Хранится локально в настройках кнопки. Никуда не отправляется.',
    wfId: 'ID workflow', wfIdHint: 'Из URL n8n:', onPress: 'При нажатии открывать',
    opt_workflow: 'Workflow (редактор)', opt_executions: 'Executions (история запусков)',
    thresholds: 'Пороги', warnErr: 'Внимание при ошибках ≥', critErr: 'Критично при ошибках ≥',
    slowMs: 'Медленно если запуск > (мс)', display: 'Отображение', bigNumber: 'Главное число',
    period: 'Период', layout: 'Вид карточки',
    cardText: 'Размер текста карточки — чипы и подписи (1–10):',
    cardTextHint: 'Крупнее = больше вторичный текст (чипы / подписи). Высокие уровни могут наезжать — выбери свой.',
    longName: 'Длинное имя', nm_left: 'Left — обрезка, статично (деф)', nm_fit: 'Fit — авто под ширину',
    nm_paginate: 'Paginate — страницами', nm_scroll: 'Scroll — бегущая строка',
    titleSize: 'Размер заголовка (1–10):', checkEvery: 'Проверять каждые (сек)', color: 'Цвет',
    save: 'Сохранить', checkNow: '↻ Проверить сейчас', notify: 'Уведомление при сбое'
  },
  es: {
    language: 'Idioma', conn: 'Conexión n8n', baseUrl: 'URL base', apiKey: 'Clave API',
    apiKeyHint: 'Se guarda localmente en los ajustes del botón. Nunca sale de tu equipo.',
    wfId: 'ID del workflow', wfIdHint: 'De la URL de n8n:', onPress: 'Al pulsar la tecla, abrir',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (historial)',
    thresholds: 'Umbrales', warnErr: 'Aviso si errores ≥', critErr: 'Crítico si errores ≥',
    slowMs: 'Lento si última ejecución > (ms)', display: 'Visualización', bigNumber: 'Número grande',
    period: 'Periodo', layout: 'Diseño',
    cardText: 'Tamaño de texto — chips y etiquetas (1–10):',
    cardTextHint: 'Más grande = texto secundario mayor (chips / etiquetas). Niveles altos pueden solaparse.',
    longName: 'Nombre largo', nm_left: 'Left — recortar, estático (def.)', nm_fit: 'Fit — ajustar al ancho',
    nm_paginate: 'Paginate — por páginas', nm_scroll: 'Scroll — marquesina',
    titleSize: 'Tamaño del título (1–10):', checkEvery: 'Comprobar cada (s)', color: 'Color',
    save: 'Guardar', checkNow: '↻ Comprobar ahora'
  },
  fr: {
    language: 'Langue', conn: 'Connexion n8n', baseUrl: 'URL de base', apiKey: 'Clé API',
    apiKeyHint: 'Stockée localement dans les réglages du bouton. Ne quitte jamais votre machine.',
    wfId: 'ID du workflow', wfIdHint: "Depuis l'URL n8n :", onPress: "À l'appui de la touche, ouvrir",
    opt_workflow: 'Workflow (éditeur)', opt_executions: 'Executions (historique)',
    thresholds: 'Seuils', warnErr: 'Alerte si erreurs ≥', critErr: 'Critique si erreurs ≥',
    slowMs: 'Lent si dernière exéc. > (ms)', display: 'Affichage', bigNumber: 'Grand nombre',
    period: 'Période', layout: 'Disposition',
    cardText: 'Taille du texte — puces et libellés (1–10) :',
    cardTextHint: 'Plus grand = texte secondaire plus grand (puces / libellés). Niveaux élevés : chevauchement possible.',
    longName: 'Nom long', nm_left: 'Left — rogner, statique (déf.)', nm_fit: 'Fit — ajuster à la largeur',
    nm_paginate: 'Paginate — par pages', nm_scroll: 'Scroll — défilement',
    titleSize: 'Taille du titre (1–10) :', checkEvery: 'Vérifier toutes les (s)', color: 'Couleur',
    save: 'Enregistrer', checkNow: '↻ Vérifier'
  },
  de: {
    language: 'Sprache', conn: 'n8n-Verbindung', baseUrl: 'Basis-URL', apiKey: 'API-Schlüssel',
    apiKeyHint: 'Lokal in den Tasteneinstellungen gespeichert. Verlässt nie Ihren Rechner.',
    wfId: 'Workflow-ID', wfIdHint: 'Aus der n8n-URL:', onPress: 'Bei Tastendruck öffnen',
    opt_workflow: 'Workflow (Editor)', opt_executions: 'Executions (Verlauf)',
    thresholds: 'Schwellenwerte', warnErr: 'Warnung bei Fehlern ≥', critErr: 'Kritisch bei Fehlern ≥',
    slowMs: 'Langsam wenn letzter Lauf > (ms)', display: 'Anzeige', bigNumber: 'Große Zahl',
    period: 'Zeitraum', layout: 'Layout',
    cardText: 'Textgröße — Chips & Labels (1–10):',
    cardTextHint: 'Größer = größerer Sekundärtext (Chips / Labels). Hohe Stufen können überlappen.',
    longName: 'Langer Name', nm_left: 'Left — abschneiden, statisch (Std.)', nm_fit: 'Fit — an Breite anpassen',
    nm_paginate: 'Paginate — seitenweise', nm_scroll: 'Scroll — Lauftext',
    titleSize: 'Titelgröße (1–10):', checkEvery: 'Prüfen alle (s)', color: 'Farbe',
    save: 'Speichern', checkNow: '↻ Jetzt prüfen'
  },
  it: {
    language: 'Lingua', conn: 'Connessione n8n', baseUrl: 'URL base', apiKey: 'Chiave API',
    apiKeyHint: 'Salvata localmente nelle impostazioni del tasto. Non lascia mai il tuo computer.',
    wfId: 'ID workflow', wfIdHint: "Dall'URL di n8n:", onPress: 'Alla pressione del tasto, apri',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (cronologia)',
    thresholds: 'Soglie', warnErr: 'Avviso se errori ≥', critErr: 'Critico se errori ≥',
    slowMs: 'Lento se ultima esec. > (ms)', display: 'Visualizzazione', bigNumber: 'Numero grande',
    period: 'Periodo', layout: 'Layout',
    cardText: 'Dimensione testo — chip ed etichette (1–10):',
    cardTextHint: 'Più grande = testo secondario più grande (chip / etichette). Livelli alti possono sovrapporsi.',
    longName: 'Nome lungo', nm_left: 'Left — taglia, statico (pred.)', nm_fit: 'Fit — adatta alla larghezza',
    nm_paginate: 'Paginate — a pagine', nm_scroll: 'Scroll — scorrimento',
    titleSize: 'Dimensione titolo (1–10):', checkEvery: 'Controlla ogni (s)', color: 'Colore',
    save: 'Salva', checkNow: '↻ Controlla ora'
  },
  nl: {
    language: 'Taal', conn: 'n8n-verbinding', baseUrl: 'Basis-URL', apiKey: 'API-sleutel',
    apiKeyHint: 'Lokaal opgeslagen in de knopinstellingen. Verlaat nooit je computer.',
    wfId: 'Workflow-ID', wfIdHint: 'Uit de n8n-URL:', onPress: 'Bij toetsdruk openen',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (geschiedenis)',
    thresholds: 'Drempels', warnErr: 'Waarschuwing bij fouten ≥', critErr: 'Kritiek bij fouten ≥',
    slowMs: 'Traag als laatste run > (ms)', display: 'Weergave', bigNumber: 'Groot getal',
    period: 'Periode', layout: 'Lay-out',
    cardText: 'Tekstgrootte — chips & labels (1–10):',
    cardTextHint: 'Groter = grotere secundaire tekst (chips / labels). Hoge niveaus kunnen overlappen.',
    longName: 'Lange naam', nm_left: 'Left — afkappen, statisch (std.)', nm_fit: 'Fit — passend maken',
    nm_paginate: 'Paginate — per pagina', nm_scroll: 'Scroll — lopende tekst',
    titleSize: 'Titelgrootte (1–10):', checkEvery: 'Controleer elke (s)', color: 'Kleur',
    save: 'Opslaan', checkNow: '↻ Nu controleren'
  },
  pl: {
    language: 'Język', conn: 'Połączenie n8n', baseUrl: 'Bazowy URL', apiKey: 'Klucz API',
    apiKeyHint: 'Przechowywany lokalnie w ustawieniach przycisku. Nigdy nie opuszcza komputera.',
    wfId: 'ID workflow', wfIdHint: 'Z adresu n8n:', onPress: 'Po naciśnięciu klawisza otwórz',
    opt_workflow: 'Workflow (edytor)', opt_executions: 'Executions (historia)',
    thresholds: 'Progi', warnErr: 'Ostrzeżenie przy błędach ≥', critErr: 'Krytyczne przy błędach ≥',
    slowMs: 'Wolno jeśli ostatni run > (ms)', display: 'Wyświetlanie', bigNumber: 'Duża liczba',
    period: 'Okres', layout: 'Układ',
    cardText: 'Rozmiar tekstu — żetony i etykiety (1–10):',
    cardTextHint: 'Większy = większy tekst drugorzędny (żetony / etykiety). Wysokie poziomy mogą się nakładać.',
    longName: 'Długa nazwa', nm_left: 'Left — przycięcie, statycznie (dom.)', nm_fit: 'Fit — dopasuj do szerokości',
    nm_paginate: 'Paginate — stronami', nm_scroll: 'Scroll — przewijanie',
    titleSize: 'Rozmiar tytułu (1–10):', checkEvery: 'Sprawdzaj co (s)', color: 'Kolor',
    save: 'Zapisz', checkNow: '↻ Sprawdź teraz'
  },
  'pt-BR': {
    language: 'Idioma', conn: 'Conexão n8n', baseUrl: 'URL base', apiKey: 'Chave API',
    apiKeyHint: 'Armazenada localmente nas configurações do botão. Nunca sai do seu computador.',
    wfId: 'ID do workflow', wfIdHint: 'Da URL do n8n:', onPress: 'Ao pressionar a tecla, abrir',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (histórico)',
    thresholds: 'Limites', warnErr: 'Aviso se erros ≥', critErr: 'Crítico se erros ≥',
    slowMs: 'Lento se última exec. > (ms)', display: 'Exibição', bigNumber: 'Número grande',
    period: 'Período', layout: 'Layout',
    cardText: 'Tamanho do texto — chips e rótulos (1–10):',
    cardTextHint: 'Maior = texto secundário maior (chips / rótulos). Níveis altos podem sobrepor.',
    longName: 'Nome longo', nm_left: 'Left — cortar, estático (padrão)', nm_fit: 'Fit — ajustar à largura',
    nm_paginate: 'Paginate — por páginas', nm_scroll: 'Scroll — letreiro',
    titleSize: 'Tamanho do título (1–10):', checkEvery: 'Verificar a cada (s)', color: 'Cor',
    save: 'Salvar', checkNow: '↻ Verificar agora'
  },
  'zh-CN': {
    language: '语言', conn: 'n8n 连接', baseUrl: '基础 URL', apiKey: 'API 密钥',
    apiKeyHint: '本地保存在按键设置中，绝不离开你的电脑。',
    wfId: 'Workflow ID', wfIdHint: '来自 n8n 网址：', onPress: '按键时打开',
    opt_workflow: 'Workflow（编辑器）', opt_executions: 'Executions（运行历史）',
    thresholds: '阈值', warnErr: '错误 ≥ 时警告', critErr: '错误 ≥ 时严重',
    slowMs: '上次运行 > (毫秒) 视为慢', display: '显示', bigNumber: '主数字',
    period: '周期', layout: '布局',
    cardText: '卡片文字大小 — 标签 (1–10)：',
    cardTextHint: '越大 = 次要文字越大（标签）。等级过高可能重叠。',
    longName: '长名称', nm_left: 'Left — 裁剪、静态（默认）', nm_fit: 'Fit — 自适应宽度',
    nm_paginate: 'Paginate — 分页翻动', nm_scroll: 'Scroll — 滚动',
    titleSize: '标题大小 (1–10)：', checkEvery: '检查间隔 (秒)', color: '颜色',
    save: '保存', checkNow: '↻ 立即检查'
  },
  ja: {
    language: '言語', conn: 'n8n 接続', baseUrl: 'ベース URL', apiKey: 'API キー',
    apiKeyHint: 'ボタン設定にローカル保存され、デバイス外には送信されません。',
    wfId: 'Workflow ID', wfIdHint: 'n8n の URL から：', onPress: 'キー押下時に開く',
    opt_workflow: 'Workflow（エディタ）', opt_executions: 'Executions（実行履歴）',
    thresholds: 'しきい値', warnErr: 'エラー ≥ で警告', critErr: 'エラー ≥ で重大',
    slowMs: '前回実行 > (ms) で遅い', display: '表示', bigNumber: 'メイン数値',
    period: '期間', layout: 'レイアウト',
    cardText: 'カード文字サイズ — チップ／ラベル (1–10)：',
    cardTextHint: '大きいほど副次テキスト（チップ／ラベル）が大きくなります。高すぎると重なる場合があります。',
    longName: '長い名前', nm_left: 'Left — 切り詰め・静的（既定）', nm_fit: 'Fit — 幅に合わせる',
    nm_paginate: 'Paginate — ページ送り', nm_scroll: 'Scroll — スクロール',
    titleSize: 'タイトルサイズ (1–10)：', checkEvery: '確認間隔 (秒)', color: '色',
    save: '保存', checkNow: '↻ 今すぐ確認'
  },
  ko: {
    language: '언어', conn: 'n8n 연결', baseUrl: '기본 URL', apiKey: 'API 키',
    apiKeyHint: '버튼 설정에 로컬로 저장되며 기기를 벗어나지 않습니다.',
    wfId: 'Workflow ID', wfIdHint: 'n8n URL에서:', onPress: '키를 누르면 열기',
    opt_workflow: 'Workflow (편집기)', opt_executions: 'Executions (실행 기록)',
    thresholds: '임계값', warnErr: '오류 ≥ 시 경고', critErr: '오류 ≥ 시 심각',
    slowMs: '마지막 실행 > (ms)이면 느림', display: '표시', bigNumber: '큰 숫자',
    period: '기간', layout: '레이아웃',
    cardText: '카드 글자 크기 — 칩/라벨 (1–10):',
    cardTextHint: '클수록 보조 텍스트(칩/라벨)가 커집니다. 너무 높으면 겹칠 수 있습니다.',
    longName: '긴 이름', nm_left: 'Left — 자르기, 정적 (기본)', nm_fit: 'Fit — 너비에 맞춤',
    nm_paginate: 'Paginate — 페이지 넘김', nm_scroll: 'Scroll — 스크롤',
    titleSize: '제목 크기 (1–10):', checkEvery: '확인 주기 (초)', color: '색상',
    save: '저장', checkNow: '↻ 지금 확인'
  },
  tr: {
    language: 'Dil', conn: 'n8n Bağlantısı', baseUrl: 'Temel URL', apiKey: 'API Anahtarı',
    apiKeyHint: 'Tuş ayarlarında yerel olarak saklanır. Cihazınızdan asla çıkmaz.',
    wfId: 'Workflow ID', wfIdHint: 'n8n URL’sinden:', onPress: 'Tuşa basınca aç',
    opt_workflow: 'Workflow (düzenleyici)', opt_executions: 'Executions (geçmiş)',
    thresholds: 'Eşikler', warnErr: 'Hata ≥ olunca uyar', critErr: 'Hata ≥ olunca kritik',
    slowMs: 'Son çalışma > (ms) ise yavaş', display: 'Görünüm', bigNumber: 'Büyük sayı',
    period: 'Dönem', layout: 'Düzen',
    cardText: 'Kart metni boyutu — çipler ve etiketler (1–10):',
    cardTextHint: 'Daha büyük = daha büyük ikincil metin (çipler / etiketler). Yüksek seviyeler çakışabilir.',
    longName: 'Uzun ad', nm_left: 'Left — kırp, sabit (varsayılan)', nm_fit: 'Fit — genişliğe sığdır',
    nm_paginate: 'Paginate — sayfa sayfa', nm_scroll: 'Scroll — kayan yazı',
    titleSize: 'Başlık boyutu (1–10):', checkEvery: 'Kontrol aralığı (sn)', color: 'Renk',
    save: 'Kaydet', checkNow: '↻ Şimdi kontrol et'
  },
  uk: {
    language: 'Мова', conn: 'Підключення n8n', baseUrl: 'Базова URL', apiKey: 'API-ключ',
    apiKeyHint: 'Зберігається локально в налаштуваннях кнопки. Ніколи не залишає ваш пристрій.',
    wfId: 'ID workflow', wfIdHint: 'З URL n8n:', onPress: 'Під час натискання відкрити',
    opt_workflow: 'Workflow (редактор)', opt_executions: 'Executions (історія запусків)',
    thresholds: 'Пороги', warnErr: 'Увага при помилках ≥', critErr: 'Критично при помилках ≥',
    slowMs: 'Повільно якщо останній запуск > (мс)', display: 'Відображення', bigNumber: 'Головне число',
    period: 'Період', layout: 'Вигляд картки',
    cardText: 'Розмір тексту картки — чіпи й підписи (1–10):',
    cardTextHint: 'Більше = більший вторинний текст (чіпи / підписи). Високі рівні можуть накладатися.',
    longName: 'Довга назва', nm_left: 'Left — обрізка, статично (типово)', nm_fit: 'Fit — за шириною',
    nm_paginate: 'Paginate — сторінками', nm_scroll: 'Scroll — рядок, що біжить',
    titleSize: 'Розмір заголовка (1–10):', checkEvery: 'Перевіряти кожні (с)', color: 'Колір',
    save: 'Зберегти', checkNow: '↻ Перевірити зараз'
  },
  id: {
    language: 'Bahasa', conn: 'Koneksi n8n', baseUrl: 'URL dasar', apiKey: 'Kunci API',
    apiKeyHint: 'Disimpan lokal di pengaturan tombol. Tidak pernah keluar dari perangkat Anda.',
    wfId: 'ID workflow', wfIdHint: 'Dari URL n8n:', onPress: 'Saat tombol ditekan, buka',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (riwayat)',
    thresholds: 'Ambang', warnErr: 'Peringatan jika error ≥', critErr: 'Kritis jika error ≥',
    slowMs: 'Lambat jika run terakhir > (ms)', display: 'Tampilan', bigNumber: 'Angka besar',
    period: 'Periode', layout: 'Tata letak',
    cardText: 'Ukuran teks kartu — chip & label (1–10):',
    cardTextHint: 'Lebih besar = teks sekunder lebih besar (chip / label). Level tinggi bisa tumpang tindih.',
    longName: 'Nama panjang', nm_left: 'Left — potong, statis (default)', nm_fit: 'Fit — sesuaikan lebar',
    nm_paginate: 'Paginate — per halaman', nm_scroll: 'Scroll — teks berjalan',
    titleSize: 'Ukuran judul (1–10):', checkEvery: 'Periksa tiap (dtk)', color: 'Warna',
    save: 'Simpan', checkNow: '↻ Periksa sekarang'
  },
  'zh-TW': {
    language: '語言', conn: 'n8n 連線', baseUrl: '基礎 URL', apiKey: 'API 金鑰',
    apiKeyHint: '本機儲存在按鍵設定中，絕不離開你的電腦。',
    wfId: 'Workflow ID', wfIdHint: '來自 n8n 網址：', onPress: '按鍵時開啟',
    opt_workflow: 'Workflow（編輯器）', opt_executions: 'Executions（執行紀錄）',
    thresholds: '門檻', warnErr: '錯誤 ≥ 時警告', critErr: '錯誤 ≥ 時嚴重',
    slowMs: '上次執行 > (毫秒) 視為慢', display: '顯示', bigNumber: '主要數字',
    period: '週期', layout: '版面',
    cardText: '卡片文字大小 — 標籤 (1–10)：',
    cardTextHint: '越大 = 次要文字越大（標籤）。等級過高可能重疊。',
    longName: '長名稱', nm_left: 'Left — 裁切、靜態（預設）', nm_fit: 'Fit — 自動符合寬度',
    nm_paginate: 'Paginate — 分頁翻動', nm_scroll: 'Scroll — 跑馬燈',
    titleSize: '標題大小 (1–10)：', checkEvery: '檢查間隔 (秒)', color: '顏色',
    save: '儲存', checkNow: '↻ 立即檢查'
  },
  vi: {
    language: 'Ngôn ngữ', conn: 'Kết nối n8n', baseUrl: 'URL cơ sở', apiKey: 'Khóa API',
    apiKeyHint: 'Lưu cục bộ trong cài đặt phím. Không bao giờ rời khỏi máy của bạn.',
    wfId: 'ID workflow', wfIdHint: 'Từ URL n8n:', onPress: 'Khi nhấn phím, mở',
    opt_workflow: 'Workflow (trình chỉnh sửa)', opt_executions: 'Executions (lịch sử)',
    thresholds: 'Ngưỡng', warnErr: 'Cảnh báo khi lỗi ≥', critErr: 'Nghiêm trọng khi lỗi ≥',
    slowMs: 'Chậm nếu lần chạy cuối > (ms)', display: 'Hiển thị', bigNumber: 'Số lớn',
    period: 'Khoảng thời gian', layout: 'Bố cục',
    cardText: 'Cỡ chữ thẻ — chip & nhãn (1–10):',
    cardTextHint: 'Lớn hơn = chữ phụ lớn hơn (chip / nhãn). Mức cao có thể chồng lên nhau.',
    longName: 'Tên dài', nm_left: 'Left — cắt, tĩnh (mặc định)', nm_fit: 'Fit — vừa chiều rộng',
    nm_paginate: 'Paginate — theo trang', nm_scroll: 'Scroll — chữ chạy',
    titleSize: 'Cỡ tiêu đề (1–10):', checkEvery: 'Kiểm tra mỗi (giây)', color: 'Màu',
    save: 'Lưu', checkNow: '↻ Kiểm tra ngay'
  },
  cs: {
    language: 'Jazyk', conn: 'Připojení n8n', baseUrl: 'Základní URL', apiKey: 'API klíč',
    apiKeyHint: 'Uloženo lokálně v nastavení tlačítka. Nikdy neopustí váš počítač.',
    wfId: 'ID workflow', wfIdHint: 'Z adresy n8n:', onPress: 'Při stisku klávesy otevřít',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (historie)',
    thresholds: 'Prahy', warnErr: 'Varování při chybách ≥', critErr: 'Kritické při chybách ≥',
    slowMs: 'Pomalé pokud poslední běh > (ms)', display: 'Zobrazení', bigNumber: 'Velké číslo',
    period: 'Období', layout: 'Rozvržení',
    cardText: 'Velikost textu — čipy a popisky (1–10):',
    cardTextHint: 'Větší = větší sekundární text (čipy / popisky). Vysoké úrovně se mohou překrývat.',
    longName: 'Dlouhý název', nm_left: 'Left — oříznout, statické (výchozí)', nm_fit: 'Fit — přizpůsobit šířce',
    nm_paginate: 'Paginate — po stránkách', nm_scroll: 'Scroll — běžící text',
    titleSize: 'Velikost názvu (1–10):', checkEvery: 'Kontrolovat každých (s)', color: 'Barva',
    save: 'Uložit', checkNow: '↻ Zkontrolovat'
  },
  sv: {
    language: 'Språk', conn: 'n8n-anslutning', baseUrl: 'Bas-URL', apiKey: 'API-nyckel',
    apiKeyHint: 'Sparas lokalt i knappinställningarna. Lämnar aldrig din dator.',
    wfId: 'Workflow-ID', wfIdHint: 'Från n8n-URL:en:', onPress: 'Vid knapptryck, öppna',
    opt_workflow: 'Workflow (redigerare)', opt_executions: 'Executions (historik)',
    thresholds: 'Tröskelvärden', warnErr: 'Varna vid fel ≥', critErr: 'Kritiskt vid fel ≥',
    slowMs: 'Långsam om senaste körning > (ms)', display: 'Visning', bigNumber: 'Stort tal',
    period: 'Period', layout: 'Layout',
    cardText: 'Textstorlek — chips & etiketter (1–10):',
    cardTextHint: 'Större = större sekundär text (chips / etiketter). Höga nivåer kan överlappa.',
    longName: 'Långt namn', nm_left: 'Left — klipp, statisk (standard)', nm_fit: 'Fit — anpassa till bredd',
    nm_paginate: 'Paginate — sidvis', nm_scroll: 'Scroll — rullande text',
    titleSize: 'Titelstorlek (1–10):', checkEvery: 'Kontrollera var (s)', color: 'Färg',
    save: 'Spara', checkNow: '↻ Kontrollera nu'
  },
  'pt-PT': {
    language: 'Idioma', conn: 'Ligação n8n', baseUrl: 'URL base', apiKey: 'Chave API',
    apiKeyHint: 'Guardada localmente nas definições do botão. Nunca sai do seu computador.',
    wfId: 'ID do workflow', wfIdHint: 'Do URL do n8n:', onPress: 'Ao premir a tecla, abrir',
    opt_workflow: 'Workflow (editor)', opt_executions: 'Executions (histórico)',
    thresholds: 'Limiares', warnErr: 'Aviso se erros ≥', critErr: 'Crítico se erros ≥',
    slowMs: 'Lento se última execução > (ms)', display: 'Apresentação', bigNumber: 'Número grande',
    period: 'Período', layout: 'Esquema',
    cardText: 'Tamanho do texto — chips e rótulos (1–10):',
    cardTextHint: 'Maior = texto secundário maior (chips / rótulos). Níveis altos podem sobrepor-se.',
    longName: 'Nome longo', nm_left: 'Left — cortar, estático (predef.)', nm_fit: 'Fit — ajustar à largura',
    nm_paginate: 'Paginate — por páginas', nm_scroll: 'Scroll — marquise',
    titleSize: 'Tamanho do título (1–10):', checkEvery: 'Verificar a cada (s)', color: 'Cor',
    save: 'Guardar', checkNow: '↻ Verificar agora'
  },
  ar: {
    language: 'اللغة', conn: 'اتصال n8n', baseUrl: 'الرابط الأساسي', apiKey: 'مفتاح API',
    apiKeyHint: 'يُحفظ محليًا في إعدادات الزر. لا يغادر جهازك أبدًا.',
    wfId: 'معرّف Workflow', wfIdHint: 'من رابط n8n:', onPress: 'عند الضغط على المفتاح، افتح',
    opt_workflow: 'Workflow (المحرر)', opt_executions: 'Executions (سجل التشغيل)',
    thresholds: 'الحدود', warnErr: 'تحذير عند الأخطاء ≥', critErr: 'حرج عند الأخطاء ≥',
    slowMs: 'بطيء إذا آخر تشغيل > (مللي ثانية)', display: 'العرض', bigNumber: 'الرقم الكبير',
    period: 'الفترة', layout: 'التخطيط',
    cardText: 'حجم نص البطاقة — التسميات (1–10):',
    cardTextHint: 'أكبر = نص ثانوي أكبر (التسميات). المستويات العالية قد تتداخل.',
    longName: 'اسم طويل', nm_left: 'Left — قص، ثابت (افتراضي)', nm_fit: 'Fit — ملاءمة العرض',
    nm_paginate: 'Paginate — صفحة بصفحة', nm_scroll: 'Scroll — نص متحرك',
    titleSize: 'حجم العنوان (1–10):', checkEvery: 'تحقق كل (ثانية)', color: 'اللون',
    save: 'حفظ', checkNow: '↻ تحقق الآن'
  },
  he: {
    language: 'שפה', conn: 'חיבור n8n', baseUrl: 'כתובת בסיס', apiKey: 'מפתח API',
    apiKeyHint: 'נשמר מקומית בהגדרות הכפתור. לעולם לא יוצא מהמחשב שלך.',
    wfId: 'מזהה Workflow', wfIdHint: 'מתוך כתובת n8n:', onPress: 'בלחיצה על המקש, פתח',
    opt_workflow: 'Workflow (עורך)', opt_executions: 'Executions (היסטוריה)',
    thresholds: 'ספים', warnErr: 'אזהרה בשגיאות ≥', critErr: 'קריטי בשגיאות ≥',
    slowMs: 'איטי אם ההרצה האחרונה > (אלפיות)', display: 'תצוגה', bigNumber: 'מספר גדול',
    period: 'תקופה', layout: 'פריסה',
    cardText: 'גודל טקסט — תוויות (1–10):',
    cardTextHint: 'גדול יותר = טקסט משני גדול יותר (תוויות). רמות גבוהות עלולות לחפוף.',
    longName: 'שם ארוך', nm_left: 'Left — חיתוך, סטטי (ברירת מחדל)', nm_fit: 'Fit — התאמה לרוחב',
    nm_paginate: 'Paginate — עמוד אחר עמוד', nm_scroll: 'Scroll — טקסט נע',
    titleSize: 'גודל כותרת (1–10):', checkEvery: 'בדוק כל (שניות)', color: 'צבע',
    save: 'שמור', checkNow: '↻ בדוק כעת'
  },
  fa: {
    language: 'زبان', conn: 'اتصال n8n', baseUrl: 'نشانی پایه', apiKey: 'کلید API',
    apiKeyHint: 'به‌صورت محلی در تنظیمات دکمه ذخیره می‌شود. هرگز از دستگاه شما خارج نمی‌شود.',
    wfId: 'شناسه Workflow', wfIdHint: 'از نشانی n8n:', onPress: 'هنگام فشردن کلید، باز کن',
    opt_workflow: 'Workflow (ویرایشگر)', opt_executions: 'Executions (تاریخچه)',
    thresholds: 'آستانه‌ها', warnErr: 'هشدار وقتی خطاها ≥', critErr: 'بحرانی وقتی خطاها ≥',
    slowMs: 'کند اگر آخرین اجرا > (میلی‌ثانیه)', display: 'نمایش', bigNumber: 'عدد بزرگ',
    period: 'دوره', layout: 'چیدمان',
    cardText: 'اندازه متن کارت — برچسب‌ها (1–10):',
    cardTextHint: 'بزرگ‌تر = متن ثانویه بزرگ‌تر (برچسب‌ها). سطوح بالا ممکن است همپوشانی کنند.',
    longName: 'نام بلند', nm_left: 'Left — برش، ثابت (پیش‌فرض)', nm_fit: 'Fit — متناسب با عرض',
    nm_paginate: 'Paginate — صفحه‌به‌صفحه', nm_scroll: 'Scroll — متن روان',
    titleSize: 'اندازه عنوان (1–10):', checkEvery: 'بررسی هر (ثانیه)', color: 'رنگ',
    save: 'ذخیره', checkNow: '↻ بررسی اکنون'
  },
  hi: {
    language: 'भाषा', conn: 'n8n कनेक्शन', baseUrl: 'बेस URL', apiKey: 'API कुंजी',
    apiKeyHint: 'बटन सेटिंग में स्थानीय रूप से सहेजा जाता है। आपके डिवाइस से कभी बाहर नहीं जाता।',
    wfId: 'Workflow ID', wfIdHint: 'n8n URL से:', onPress: 'कुंजी दबाने पर खोलें',
    opt_workflow: 'Workflow (एडिटर)', opt_executions: 'Executions (इतिहास)',
    thresholds: 'सीमाएँ', warnErr: 'त्रुटियाँ ≥ पर चेतावनी', critErr: 'त्रुटियाँ ≥ पर गंभीर',
    slowMs: 'धीमा यदि अंतिम रन > (ms)', display: 'प्रदर्शन', bigNumber: 'बड़ा अंक',
    period: 'अवधि', layout: 'लेआउट',
    cardText: 'कार्ड टेक्स्ट आकार — चिप्स और लेबल (1–10):',
    cardTextHint: 'बड़ा = बड़ा द्वितीयक टेक्स्ट (चिप्स / लेबल)। उच्च स्तर ओवरलैप कर सकते हैं।',
    longName: 'लंबा नाम', nm_left: 'Left — काटें, स्थिर (डिफ़ॉल्ट)', nm_fit: 'Fit — चौड़ाई में फ़िट',
    nm_paginate: 'Paginate — पृष्ठ-दर-पृष्ठ', nm_scroll: 'Scroll — चलती पट्टी',
    titleSize: 'शीर्षक आकार (1–10):', checkEvery: 'हर (सेकंड) जाँचें', color: 'रंग',
    save: 'सहेजें', checkNow: '↻ अभी जाँचें'
  }
};
let LANG = 'en';
const RTL = { ar: 1, he: 1, fa: 1 };   // these flip the panel right-to-left; every other language stays LTR
function applyLang(lang) {
  LANG = I18N[lang] ? lang : 'en';
  const d = I18N[LANG], en = I18N.en;
  document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); const t = d[k] != null ? d[k] : en[k]; if (t != null) el.textContent = t; });
  document.documentElement.setAttribute('dir', RTL[LANG] ? 'rtl' : 'ltr');
  const ls = document.getElementById('lang'); if (ls) ls.value = LANG;
}

function highlightSeg(segId, v) {
  const seg = $(segId);
  if (!seg) return;
  seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === v));
}
function wireSeg(segId, hiddenId) {
  const seg = $(segId);
  if (!seg) return;
  seg.querySelectorAll('button').forEach(b => {
    b.addEventListener('click', () => {
      setVal(hiddenId, b.dataset.v);
      highlightSeg(segId, b.dataset.v);
      sendOne({ [hiddenId]: b.dataset.v });
    });
  });
}

// keep asking the backend for the saved config until it answers (beats the startup race)
function requestConfig(tries) {
  if (filled || tries <= 0) return;
  $UD.sendParamFromPlugin({ __getConfig: true });
  setTimeout(() => requestConfig(tries - 1), 450);
}

// connect with the ACTION uuid (5 segments → property-inspector side)
$UD.connect('com.n8n.workflowmonitor.deck.monitor');

$UD.onConnected(() => {
  const themeSel = $('theme');
  if (themeSel && !themeSel.options.length) {
    THEMES.forEach(name => { const o = document.createElement('option'); o.value = name; o.textContent = name; themeSel.appendChild(o); });
  }
  const laySel = $('layout');
  if (laySel && !laySel.options.length) {
    LAYOUTS.forEach(([k, label]) => { const o = document.createElement('option'); o.value = k; o.textContent = label; laySel.appendChild(o); });
  }
  wireSeg('seg-metric', 'metric');
  wireSeg('seg-period', 'period');
  highlightSeg('seg-metric', val('metric') || 'runs');
  highlightSeg('seg-period', val('period') || '24h');
  const ts = $('textScale'), tsVal = $('tsVal');
  if (ts && tsVal) ts.addEventListener('input', () => { tsVal.textContent = ts.value; });
  const tt = $('titleScale'), ttVal = $('tsValTitle');
  if (tt && ttVal) tt.addEventListener('input', () => { ttVal.textContent = tt.value; });

  const form = $('form');
  form.addEventListener('change', (e) => onField(e.target));
  form.addEventListener('input', debounce((e) => onField(e.target), 300));

  const btn = $('btn-check');
  if (btn) btn.addEventListener('click', () => $UD.sendParamFromPlugin({ forceCheck: Date.now() }));

  const sBtn = $('btn-save');
  if (sBtn) sBtn.addEventListener('click', saveNow);

  const langSel = $('lang');
  if (langSel) langSel.addEventListener('change', () => { applyLang(langSel.value); sendOne({ lang: langSel.value }); });
  applyLang(($UD.language && String($UD.language).toLowerCase().startsWith('ru')) ? 'ru' : 'en');   // auto-pick until saved lang arrives

  // ask the backend for the saved config (retried until it replies)
  requestConfig(6);
  setTimeout(() => { ready = true; }, 1500);   // fallback for a brand-new action with no saved settings
});

// explicit Save button → bind settings for sure (with feedback)
function saveNow() {
  ready = true;
  const apiKey = val('apiKey').trim(), workflowId = val('workflowId').trim();
  const obj = {};
  if (apiKey) obj.apiKey = apiKey;
  if (workflowId) obj.workflowId = workflowId;
  if (Object.keys(obj).length) sendOne(obj);
  const sBtn = $('btn-save');
  if (sBtn) { sBtn.textContent = (apiKey && workflowId) ? '✓ Saved' : 'Enter API + ID'; setTimeout(() => { sBtn.textContent = 'Save settings'; }, 1800); }
}

// send ONLY the changed field → never resets other settings (layout change won't touch color, etc.)
function sendOne(obj) {
  if (!ready) return;
  ACTION_SETTING = { ...ACTION_SETTING, ...obj };
  $UD.sendParamFromPlugin(obj);
}

function onField(el) {
  if (!ready || !el || !el.id) return;
  const id = el.id;
  if (id === 'apiKey' || id === 'workflowId') { const v = el.value.trim(); if (v) sendOne({ [id]: v }); return; }
  if (id === 'n8nUrl') return sendOne({ n8nUrl: el.value.trim() });
  if (id === 'notify') return sendOne({ notify: el.checked });
  if (id === 'theme' || id === 'layout' || id === 'textScale' || id === 'titleScale' || id === 'pressAction' || id === 'nameMode') return sendOne({ [id]: el.value });
  if (id === 'intervalSec' || id === 'warnMs' || id === 'warnErrors' || id === 'critErrors') return sendOne({ [id]: parseInt(el.value) || 0 });
}

function applySettings(p) {
  if (!p || p.forceCheck || p.__getConfig) return;
  ACTION_SETTING = { ...ACTION_SETTING, ...p };
  setVal('n8nUrl', p.n8nUrl);
  setVal('apiKey', p.apiKey);
  setVal('workflowId', p.workflowId);
  setVal('intervalSec', p.intervalSec);
  setVal('warnMs', p.warnMs);
  setVal('warnErrors', p.warnErrors);
  setVal('critErrors', p.critErrors);
  setVal('theme', p.theme);
  setVal('layout', p.layout);
  setVal('pressAction', p.pressAction);
  setVal('nameMode', p.nameMode);
  if ($('notify')) $('notify').checked = !!p.notify;
  if (p.metric) { setVal('metric', p.metric); highlightSeg('seg-metric', p.metric); }
  if (p.period) { setVal('period', p.period); highlightSeg('seg-period', p.period); }
  if (p.textScale != null && /^([1-9]|10)$/.test(String(p.textScale))) { setVal('textScale', p.textScale); const tv = $('tsVal'); if (tv) tv.textContent = p.textScale; }
  if (p.titleScale != null && /^([1-9]|10)$/.test(String(p.titleScale))) { setVal('titleScale', p.titleScale); const tv = $('tsValTitle'); if (tv) tv.textContent = p.titleScale; }
  if (p.lang) applyLang(p.lang);
  if (p.apiKey) filled = true;   // got the real config → stop re-requesting
  ready = true;   // saved settings are in the form now → safe to persist edits
}

$UD.onAdd((jsn) => { if (jsn.param) applySettings(jsn.param); });
$UD.onParamFromApp((jsn) => { if (jsn.param) applySettings(jsn.param); });
$UD.onParamFromPlugin((jsn) => { if (jsn.param && !jsn.param.forceCheck) applySettings(jsn.param); });
