/**
 * Hukuki metinler — TASLAK. Avukat kontrolünden geçmeden yayına alınmamalıdır.
 * [KÖŞELİ PARANTEZ] içindeki yerler doldurulacak. Avukatın özellikle bakması gereken
 * noktalar `lawyerNotes` içinde listelidir (uygulamada gösterilmez).
 */

export interface LegalSection {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Listeden sonra gelen paragraflar. */
  after?: string[];
}

export interface LegalDoc {
  title: string;
  updated: string;
  sections: LegalSection[];
}

export const DRAFT_NOTICE = 'Taslak metin: hukuki kontrol tamamlanmadan yayına alınmayacaktır.';

export const AYDINLATMA: LegalDoc = {
  title: 'Kişisel Verilerin Korunması Aydınlatma Metni',
  updated: '12 Kasım 2026',
  sections: [
    {
      title: '1. Veri sorumlusu',
      paragraphs: [
        '6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla [AD SOYAD / UNVAN] ("[Marka]") tarafından aşağıda açıklanan kapsamda işlenir.',
        'Adres: [ADRES] · E-posta: [KVKK BAŞVURU E-POSTASI]',
      ],
    },
    {
      title: '2. Hangi verileri işliyoruz?',
      bullets: [
        'Hesap bilgisi: giriş için kullandığınız e-posta adresi ve oturum bilgileri (giriş hizmeti sağlayıcısında tutulur).',
        'Profil bilgisi: rolünüz, sektörünüz, deneyim süreniz ve ilgilendiğiniz alanlar.',
        'İsteğe bağlı bilgiler: yaş aralığı, şirket büyüklüğü, ekip yönetimi durumu ve şehir. Bu soruları atlayabilir veya "Belirtmek istemiyorum" seçebilirsiniz.',
        'Sizin yazdıklarınız: kazanım günlüğü kayıtları, araçlara yazdığınız metinler ve bu metinlerden üretilen çıktılar (her araç için en son 10 çıktı saklanır).',
        'Kullanım bilgisi: günlük kullanım sayısı, deneme ve abonelik durumu.',
        'Bildirimler: "Bu çıktıyı bildir" ile gönderdiğiniz notlar ve ilgili çıktı.',
      ],
      after: [
        'Saklamadıklarımız: Prova (rol yapma) sohbetleri ve ATS CV aracına verdiğiniz CV metni yalnızca cevap üretmek için işlenir, sunucumuzda saklanmaz. PDF dosyanız cihazınızda okunur, sunucuya yüklenmez. Adınızı ve çalıştığınız şirketin adını sormayız.',
        'Lütfen yazdıklarınızda sağlık, din, siyasi görüş gibi özel nitelikli kişisel verilere, başka kişilerin kimliğini belirleyen bilgilere ve işvereninize ait gizli bilgilere yer vermeyin.',
      ],
    },
    {
      title: '3. Hangi amaçlarla işliyoruz?',
      bullets: [
        'Kariyer koçluğu hizmetini sunmak ve araç çıktılarını üretmek,',
        'Önerileri profilinize göre kişiselleştirmek,',
        'Hesabınızı, deneme ve abonelik süreçlerinizi yönetmek,',
        'Hizmetin güvenliğini sağlamak, kötüye kullanımı ve aşırı maliyeti önlemek,',
        'Hizmeti geliştirmek için kişiyi tanımlamayan toplu istatistikler üretmek (10 kişiden küçük gruplar raporlanmaz),',
        'Hukuki yükümlülüklerimizi yerine getirmek.',
      ],
    },
    {
      title: '4. Hukuki sebepler',
      paragraphs: [
        'Kişisel verileriniz KVKK m. 5/2 uyarınca; bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (c), veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi (ç) ve temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatimiz (f) hukuki sebeplerine dayanılarak, otomatik yollarla işlenir. [AVUKAT: İsteğe bağlı demografik bilgiler için hukuki sebebi teyit edin.]',
      ],
    },
    {
      title: '5. Kimlere aktarıyoruz?',
      paragraphs: [
        'Hizmeti sunabilmek için verileriniz, bizim adımıza işleyen şu hizmet sağlayıcılarına aktarılır:',
      ],
      bullets: [
        'Anthropic (yapay zekâ modeli; araçlara yazdığınız metinler ve profil bilgileriniz cevap üretmek için) — Amerika Birleşik Devletleri,',
        'Cloudflare (barındırma ve veritabanı) — [SUNUCU KONUMU],',
        'Google Firebase (giriş ve kimlik doğrulama) — [SUNUCU KONUMU].',
      ],
    },
    {
      title: '6. Yurt dışına aktarım',
      paragraphs: [
        'Yukarıdaki sağlayıcıların bir kısmı Türkiye dışındadır. Yurt dışına aktarım, KVKK m. 9 kapsamında uygun güvence sağlanarak (Kurulca ilan edilen standart sözleşme ile) yapılır; standart sözleşmeler imzalanmasından itibaren beş iş günü içinde Kişisel Verileri Koruma Kurumu\'na bildirilir.',
      ],
    },
    {
      title: '7. Ne kadar süre saklıyoruz?',
      paragraphs: [
        'Verileriniz hesabınız açık olduğu sürece saklanır. Hesabınızı uygulama içinden sildiğinizde profiliniz, kazanım günlüğünüz ve kayıtlı çıktılarınız derhal silinir; teknik yedeklerden en geç [YEDEK SAKLAMA SÜRESİ] içinde kalkar. Günlük kullanım sayıları gibi kişiyi tanımlamayan toplam veriler istatistik amacıyla tutulabilir.',
      ],
    },
    {
      title: '8. Haklarınız',
      paragraphs: ['KVKK m. 11 uyarınca veri sorumlusuna başvurarak:'],
      bullets: [
        'Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlenmişse bilgi talep etme,',
        'İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,',
        'Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,',
        'Eksik veya yanlış işlenmişse düzeltilmesini isteme,',
        'KVKK m. 7 çerçevesinde silinmesini veya yok edilmesini isteme,',
        'Düzeltme ve silme işlemlerinin aktarılan üçüncü kişilere bildirilmesini isteme,',
        'Münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,',
        'Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.',
      ],
    },
    {
      title: '9. Başvuru',
      paragraphs: [
        'Taleplerinizi [KVKK BAŞVURU E-POSTASI] adresine iletebilirsiniz. Başvurunuz en geç 30 gün içinde ücretsiz olarak sonuçlandırılır. Hesabınızı ve verilerinizi dilediğiniz an Hesabım > Hesabı sil adımıyla kendiniz de silebilirsiniz.',
      ],
    },
  ],
};

export const KOSULLAR: LegalDoc = {
  title: 'Kullanım Koşulları',
  updated: '12 Kasım 2026',
  sections: [
    {
      title: '1. Hizmet',
      paragraphs: [
        '[Marka], özel sektörde çalışan profesyonellere yapay zekâ destekli kariyer koçluğu araçları sunan bir uygulamadır. Hizmet [AD SOYAD / UNVAN] tarafından sağlanır.',
      ],
    },
    {
      title: '2. Kimler kullanabilir?',
      paragraphs: ['Uygulamayı yalnızca 18 yaşını doldurmuş kişiler kullanabilir. Hesabınızın güvenliğinden siz sorumlusunuz.'],
    },
    {
      title: '3. Danışmanlığın niteliği',
      bullets: [
        'Uygulama genel nitelikte kariyer koçluğu sunar; hukuki, mali, vergisel, tıbbi veya psikolojik danışmanlık yerine geçmez.',
        'Cevaplar yapay zekâ tarafından üretilir ve hatalı, eksik ya da durumunuza uygun olmayabilir. Kararlarınızı kendi değerlendirmenizle verirsiniz.',
        'İş hukukuna ilişkin konularda bir avukata veya ALO 170\'e danışmanızı öneririz. Acil bir durumda 112\'yi arayın.',
        'ATS CV skoru bir tahmindir; işverenlerin kullandığı sistemlerin sonucunu garanti etmez.',
      ],
    },
    {
      title: '4. Kullanım kuralları',
      paragraphs: ['Uygulamayı kullanırken şunları yapmamayı kabul edersiniz:'],
      bullets: [
        'İşvereninize ait ticari sır veya gizli bilgileri girmek,',
        'Başka kişileri tanımlayan kişisel verileri gereksiz yere paylaşmak,',
        'Uygulamayı başkasına zarar vermek, yanıltmak veya hukuka aykırı amaçlarla kullanmak,',
        'CV\'de veya başvurularda gerçeğe aykırı bilgi üretmek için kullanmak,',
        'Hizmetin kotalarını aşmaya, sistemi otomatik araçlarla yormaya veya güvenlik önlemlerini aşmaya çalışmak.',
      ],
    },
    {
      title: '5. Deneme, abonelik ve ücretli araçlar',
      bullets: [
        'Yeni hesaplar [DENEME SÜRESİ] gün ücretsiz deneme ile başlar; deneme süresince günlük kullanım sınırı vardır.',
        'Deneme bitince araçlar kilitlenir; kazanım günlüğünüz ve planlarınız silinmez.',
        'Abonelik ücretleri, yenileme ve iptal koşulları satın alma ekranında gösterilir. [AVUKAT: Ödeme sağlayıcı ve App Store koşullarına göre doldurulacak.]',
        'ATS CV skoru abonelikten ayrı satın alınan, hak ile kullanılan bir araçtır. Teknik bir hata nedeniyle sonuç üretilemezse kullanılan hak iade edilir.',
        'Cayma hakkı: [AVUKAT: Mesafeli Sözleşmeler Yönetmeliği kapsamında dijital içerik/hizmet için cayma hakkı ve istisnaları değerlendirilecek.]',
      ],
    },
    {
      title: '6. İçerikleriniz',
      paragraphs: [
        'Yazdığınız metinler size aittir. Bunları yalnızca hizmeti sunmak için, Aydınlatma Metni\'nde açıklanan şekilde işleriz. Yazdıklarınızı yapay zekâ modellerini eğitmek için kullanmayız. [AVUKAT/TEKNİK: Sağlayıcı sözleşmesiyle teyit edilecek.]',
      ],
    },
    {
      title: '7. Hesabın sonlandırılması',
      paragraphs: [
        'Hesabınızı dilediğiniz zaman uygulama içinden silebilirsiniz. Bu koşullara aykırı kullanım hâlinde hesabınızı askıya alabilir veya kapatabiliriz.',
      ],
    },
    {
      title: '8. Sorumluluğun sınırlandırılması',
      paragraphs: [
        'Hizmet "olduğu gibi" sunulur. Yapay zekâ çıktılarına dayanarak aldığınız kararların sonuçlarından, kanunen sorumluluğun sınırlandırılamadığı hâller saklı kalmak üzere, sorumlu tutulamayız. [AVUKAT: Tüketici mevzuatına uygunluğu kontrol edilecek.]',
      ],
    },
    {
      title: '9. Değişiklikler ve uygulanacak hukuk',
      paragraphs: [
        'Bu koşulları güncelleyebiliriz; önemli değişiklikleri uygulama içinde duyururuz. Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Tüketici işlemlerinde tüketici hakem heyetleri ve tüketici mahkemeleri yetkilidir.',
        'İletişim: [İLETİŞİM E-POSTASI]',
      ],
    },
  ],
};

/** Avukat için kontrol listesi (uygulamada gösterilmez; LEGAL-NOTLAR.md ile aynı). */
export const lawyerNotes = [
  'Veri sorumlusu bireysel kişi (şirket yok): VERBİS kayıt yükümlülüğü ve istisnası.',
  'İsteğe bağlı demografik sorular için hukuki sebep (meşru menfaat mi, açık rıza mı).',
  'Kullanıcıların yazdıklarında üçüncü kişi (yönetici, iş arkadaşı) verisi ve özel nitelikli veri (ör. tükenmişlik/sağlık) ihtimali.',
  'Anthropic, Cloudflare, Google ile standart sözleşmeler ve Kurum\'a 5 iş günü içinde bildirim.',
  'Sağlayıcıların veri saklama ve model eğitimi koşulları (API verisinin eğitimde kullanılmaması teyidi).',
  'Mesafeli satış, cayma hakkı ve abonelik yenileme bildirimleri; App Store koşullarıyla uyum.',
  'Sorumluluk sınırlaması maddesinin tüketici mevzuatına uygunluğu.',
];
