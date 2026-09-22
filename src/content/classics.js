// ---------------------------------------------------------------------------
// classics.js — "Their Words, Our Story": love lines by other writers.
// ---------------------------------------------------------------------------
// Shown on the poetry page, BELOW the owner's own poems, under their own
// heading, and never mixed in with them.
//
// THE SOURCE OF TRUTH IS docs/classics-source.md. Every `original`, `roman`,
// `meaning_en` and `urdu_translation` here must match it character for
// character — classics.test.js fails otherwise. To change or add an entry,
// change that file first.
//
// Rules, all deliberate:
//   * Originals are verbatim public-domain text. Never rewrite, shorten or
//     modernise them. Never add modern song lyrics, film dialogue, or poetry
//     first published after 1929 (copyright).
//   * No references: no author, work, year or film is stored here or shown in
//     the app. docs/classics-source.md keeps them as the provenance record.
//   * `urdu_translation` is OUR translation, never the original. The UI
//     always labels it "Urdu translation".
//
// Fields
//   id                stable; comments and reactions hang off 'classic:<id>'
//   lang              the ORIGINAL language: 'en' | 'ur'
//   original          verbatim text; '\n' separates lines
//   meaning_en        plain-English meaning
//   urdu_translation  (English originals) our Urdu, '\n' between lines
//   translation       (English originals) always 'translated'
//   roman             (Urdu originals) Roman Urdu, '\n' between lines
//   tags              belonging, partner, longing, devotion, ...
// ---------------------------------------------------------------------------

export const classics = [
  {
    id: "beloved-is-mine",
    lang: "en",
    original: "I am my beloved's, and my beloved is mine.",
    urdu_translation: "میں اپنے محبوب کی ہوں، اور میرا محبوب میرا ہے۔",
    translation: 'translated',
    meaning_en: "I belong to the one I love, and the one I love belongs to me.",
    tags: ["belonging", "partner"],
  },
  {
    id: "seal-upon-thine-heart",
    lang: "en",
    original: "Set me as a seal upon thine heart, as a seal upon thine arm: for love is strong as death... Many waters cannot quench love, neither can the floods drown it.",
    urdu_translation: "مجھے اپنے دل پر مُہر کی طرح لگا لو، اپنے بازو پر مُہر کی طرح؛ کیونکہ محبت موت جتنی طاقتور ہے… بہت سارا پانی بھی محبت کو بجھا نہیں سکتا، نہ ہی سیلاب اسے ڈبو سکتے ہیں۔",
    translation: 'translated',
    meaning_en: "Keep me close to your heart like a seal. Love is as strong as death, and no flood can wash it away.",
    tags: ["belonging", "devotion"],
  },
  {
    id: "true-love-hath-my-heart",
    lang: "en",
    original: "My true love hath my heart, and I have his,\nBy just exchange one for the other given:\nI hold his dear, and mine he cannot miss;\nThere never was a better bargain driven.",
    urdu_translation: "میرے سچے پیار کے پاس میرا دل ہے، اور میرے پاس اُس کا،\nپورے انصاف سے، ایک کے بدلے دوسرا دیا گیا:\nمیں اُس کا دل سنبھال کر رکھتی ہوں، اور میرا دل ہمیشہ اُس کے پاس رہتا ہے؛\nاس سے اچھا سودا کبھی نہیں ہوا۔",
    translation: 'translated',
    meaning_en: "We swapped hearts fairly. I keep his heart safe, and he has mine. It was the best trade ever made.",
    tags: ["belonging", "partner"],
  },
  {
    id: "if-ever-two-were-one",
    lang: "en",
    original: "If ever two were one, then surely we.\nIf ever man were loved by wife, then thee;\nIf ever wife was happy in a man,\nCompare with me, ye women, if you can.",
    urdu_translation: "اگر کبھی دو لوگ ایک ہوئے ہیں، تو یقیناً ہم ہیں۔\nاگر کبھی کسی بیوی نے شوہر سے محبت کی ہے، تو تم سے؛\nاگر کبھی کوئی بیوی اپنے شوہر کے ساتھ خوش رہی ہے،\nتو اے عورتو، ہو سکے تو میرا مقابلہ کر کے دکھاؤ۔",
    translation: 'translated',
    meaning_en: "If two people ever became one, it is us. No husband was loved more, and no wife was happier.",
    tags: ["partner", "belonging"],
  },
  {
    id: "marriage-of-true-minds",
    lang: "en",
    original: "Let me not to the marriage of true minds\nAdmit impediments. Love is not love\nWhich alters when it alteration finds,\nOr bends with the remover to remove:",
    urdu_translation: "میں سچے دلوں کے ملن میں\nکوئی رکاوٹ نہیں مانتا۔ وہ محبت، محبت نہیں\nجو حالات بدلتے ہی بدل جائے،\nیا کوئی دور جائے تو خود بھی دور ہو جائے۔",
    translation: 'translated',
    meaning_en: "Nothing should come between two people truly joined. Real love does not change when things change.",
    tags: ["devotion", "partner"],
  },
  {
    id: "a-summers-day",
    lang: "en",
    original: "Shall I compare thee to a summer's day?\nThou art more lovely and more temperate:\n...\nSo long as men can breathe or eyes can see,\nSo long lives this, and this gives life to thee.",
    urdu_translation: "کیا میں تمہیں گرمیوں کے ایک دن جیسا کہوں؟\nتم اُس سے کہیں زیادہ پیاری ہو، اور زیادہ نرم بھی:\n…\nجب تک لوگ سانس لیتے رہیں گے اور آنکھیں دیکھتی رہیں گی،\nیہ نظم زندہ رہے گی، اور یہ تمہیں زندگی دیتی رہے گی۔",
    translation: 'translated',
    meaning_en: "You are lovelier and calmer than a summer day. As long as people read this poem, you will live on.",
    tags: ["admiration"],
  },
  {
    id: "boundless-as-the-sea",
    lang: "en",
    original: "My bounty is as boundless as the sea,\nMy love as deep; the more I give to thee,\nThe more I have, for both are infinite.",
    urdu_translation: "میری سخاوت سمندر کی طرح بے حد ہے،\nمیری محبت بھی اُتنی ہی گہری؛ میں تمہیں جتنا دیتی ہوں،\nاُتنا ہی میرے پاس اور ہوتا ہے، کیونکہ دونوں کی کوئی حد نہیں۔",
    translation: 'translated',
    meaning_en: "My love is as deep as the sea. The more I give you, the more I have, because it never ends.",
    tags: ["devotion"],
  },
  {
    id: "never-doubt-i-love",
    lang: "en",
    original: "Doubt thou the stars are fire;\nDoubt that the sun doth move;\nDoubt truth to be a liar;\nBut never doubt I love.",
    urdu_translation: "چاہو تو شک کرو کہ ستارے آگ ہیں؛\nشک کرو کہ سورج چلتا ہے؛\nشک کرو کہ سچ بھی جھوٹا ہے؛\nمگر کبھی شک نہ کرنا کہ مجھے تم سے محبت ہے۔",
    translation: 'translated',
    meaning_en: "You can doubt anything in the world, but never doubt that I love you.",
    tags: ["devotion"],
  },
  {
    id: "count-the-ways",
    lang: "en",
    original: "How do I love thee? Let me count the ways.\nI love thee to the depth and breadth and height\nMy soul can reach...",
    urdu_translation: "میں تم سے کتنی محبت کرتی ہوں؟ آؤ، گن کر بتاتی ہوں۔\nمیں تم سے اُتنی گہری، اُتنی چوڑی اور اُتنی اونچی محبت کرتی ہوں\nجہاں تک میری روح پہنچ سکتی ہے…",
    translation: 'translated',
    meaning_en: "How much do I love you? As deep, as wide and as high as my soul can reach.",
    tags: ["devotion", "partner"],
  },
  {
    id: "a-red-red-rose",
    lang: "en",
    original: "O my Luve is like a red, red rose\nThat's newly sprung in June;\nO my Luve is like the melody\nThat's sweetly play'd in tune.",
    urdu_translation: "میری محبوبہ ایک سرخ، سرخ گلاب جیسی ہے\nجو جون میں ابھی ابھی کھلا ہو؛\nمیری محبوبہ اُس دُھن جیسی ہے\nجو میٹھے سُر میں بجائی گئی ہو۔",
    translation: 'translated',
    meaning_en: "My love is like a fresh red rose in June, and like a sweet song played perfectly.",
    tags: ["admiration"],
  },
  {
    id: "walks-in-beauty",
    lang: "en",
    original: "She walks in beauty, like the night\nOf cloudless climes and starry skies;\nAnd all that's best of dark and bright\nMeet in her aspect and her eyes.",
    urdu_translation: "وہ یوں حسن سے چلتی ہے، جیسے رات\nصاف موسموں اور تاروں بھرے آسمانوں کی؛\nاور اندھیرے اور اُجالے میں جو بھی سب سے اچھا ہے\nوہ اُس کے چہرے اور آنکھوں میں آ ملتا ہے۔",
    translation: 'translated',
    meaning_en: "She is beautiful like a clear, starry night. The best of dark and light meet in her face and eyes.",
    tags: ["admiration"],
  },
  {
    id: "come-live-with-me",
    lang: "en",
    original: "Come live with me and be my love,\nAnd we will all the pleasures prove.",
    urdu_translation: "آؤ، میرے ساتھ رہو اور میری محبت بن جاؤ،\nاور ہم مل کر ہر خوشی کا مزہ چکھیں گے۔",
    translation: 'translated',
    meaning_en: "Come and share your life with me, and we will enjoy every good thing together.",
    tags: ["partner"],
  },
  {
    id: "cannot-exist-without-you",
    lang: "en",
    original: "I cannot exist without you.",
    urdu_translation: "میں تمہارے بغیر جی نہیں سکتا۔",
    translation: 'translated',
    meaning_en: "I cannot live without you.",
    tags: ["longing"],
  },
  {
    id: "souls-are-the-same",
    lang: "en",
    original: "Whatever our souls are made of, his and mine are the same.",
    urdu_translation: "ہماری روحیں جس چیز سے بھی بنی ہوں، اُس کی روح اور میری روح ایک ہی چیز سے بنی ہیں۔",
    translation: 'translated',
    meaning_en: "Whatever our souls are made of, his and mine are made of the same thing.",
    tags: ["belonging"],
  },
  {
    id: "a-string-under-my-ribs",
    lang: "en",
    original: "I sometimes have a queer feeling with regard to you—especially when you are near me, as now: it is as if I had a string somewhere under my left ribs, tightly and inextricably knotted to a similar string situated in the corresponding quarter of your little frame.",
    urdu_translation: "مجھے کبھی کبھی تمہارے بارے میں ایک عجیب سا احساس ہوتا ہے — خاص طور پر جب تم میرے پاس ہوتی ہو، جیسے ابھی: ایسا لگتا ہے جیسے میری بائیں پسلیوں کے نیچے کہیں ایک دھاگا ہے، جو تمہارے ننھے سے جسم میں ٹھیک اُسی جگہ ایک ویسے ہی دھاگے سے کس کر بندھا ہے، ایسی گرہ سے جو کبھی نہیں کھلتی۔",
    translation: 'translated',
    meaning_en: "When you are near me, it feels like a string ties my heart to yours, knotted so tight it cannot come loose.",
    tags: ["belonging", "partner"],
  },
  {
    id: "how-ardently",
    lang: "en",
    original: "In vain I have struggled. It will not do. My feelings will not be repressed. You must allow me to tell you how ardently I admire and love you.",
    urdu_translation: "میں نے بہت کوشش کی، مگر بے فائدہ۔ اب اور نہیں ہو سکتا۔ میرے جذبات دبائے نہیں دبتے۔ آپ مجھے اجازت دیجیے کہ میں بتاؤں کہ میں آپ کی کتنی دل سے قدر کرتا ہوں، اور آپ سے کتنی محبت کرتا ہوں۔",
    translation: 'translated',
    meaning_en: "I tried to fight it, but I can't. Let me tell you how deeply I admire and love you.",
    tags: ["confession"],
  },
  {
    id: "half-agony-half-hope",
    lang: "en",
    original: "You pierce my soul. I am half agony, half hope.",
    urdu_translation: "آپ میری روح کو چیر کر رکھ دیتی ہیں۔ میں آدھا درد ہوں، آدھی اُمید۔",
    translation: 'translated',
    meaning_en: "You touch my soul deeply. I am half in pain and half full of hope.",
    tags: ["longing", "confession"],
  },
  {
    id: "if-i-loved-you-less",
    lang: "en",
    original: "If I loved you less, I might be able to talk about it more.",
    urdu_translation: "اگر مجھے آپ سے کم محبت ہوتی، تو شاید میں اس کے بارے میں زیادہ بات کر پاتا۔",
    translation: 'translated',
    meaning_en: "I love you so much that I can't find the words.",
    tags: ["confession"],
  },
  {
    id: "munh-par-raunaq",
    lang: "ur",
    original: "ان کے دیکھے سے جو آ جاتی ہے منہ پر رونق\nوہ سمجھتے ہیں کہ بیمار کا حال اچھا ہے",
    roman: "Un ke dekhe se jo aa jaati hai munh par raunaq\nWoh samajhte hain ke beemaar ka haal achha hai",
    meaning_en: "When she looks at me, my face lights up, so she thinks this lovesick man is doing fine.",
    tags: ["longing"],
  },
  {
    id: "jeene-aur-marne",
    lang: "ur",
    original: "محبت میں نہیں ہے فرق جینے اور مرنے کا\nاسی کو دیکھ کر جیتے ہیں جس کافر پہ دم نکلے",
    roman: "Mohabbat mein nahin hai farq jeene aur marne ka\nUsi ko dekh kar jeete hain jis kaafir pe dam nikle",
    meaning_en: "In love, living and dying are the same. I live by looking at the very one I would die for.",
    tags: ["devotion"],
  },
  {
    id: "nikamma-kar-diya",
    lang: "ur",
    original: "عشق نے غالبؔ نکما کر دیا\nورنہ ہم بھی آدمی تھے کام کے",
    roman: "Ishq ne Ghalib nikamma kar diya\nWarna hum bhi aadmi the kaam ke",
    meaning_en: "Love made me useless. Before that, I was actually good for something.",
    tags: ["playful"],
  },
  {
    id: "tum-mere-paas",
    lang: "ur",
    original: "تم مرے پاس ہوتے ہو گویا\nجب کوئی دوسرا نہیں ہوتا",
    roman: "Tum mere paas hote ho goya\nJab koi doosra nahin hota",
    meaning_en: "When no one else is around, it feels like you are right here with me.",
    tags: ["belonging", "longing"],
  },
  {
    id: "naazuki-us-ke-lab",
    lang: "ur",
    original: "نازکی اس کے لب کی کیا کہیے\nپنکھڑی اک گلاب کی سی ہے",
    roman: "Naazuki us ke lab ki kya kahiye\nPankhuri ik gulaab ki si hai",
    meaning_en: "How can I describe how soft her lips are? Like the petal of a rose.",
    tags: ["admiration"],
  },
  {
    id: "patta-patta",
    lang: "ur",
    original: "پتا پتا بوٹا بوٹا حال ہمارا جانے ہے\nجانے نہ جانے گل ہی نہ جانے باغ تو سارا جانے ہے",
    roman: "Patta patta boota boota haal hamaara jaane hai\nJaane na jaane gul hi na jaane, baagh to saara jaane hai",
    meaning_en: "Every leaf and every plant knows how I feel. The whole garden knows. Only the flower herself does not.",
    tags: ["longing"],
  },
  {
    id: "chupke-chupke",
    lang: "ur",
    original: "چپکے چپکے رات دن آنسو بہانا یاد ہے\nہم کو اب تک عاشقی کا وہ زمانہ یاد ہے",
    roman: "Chupke chupke raat din aansu bahaana yaad hai\nHum ko ab tak aashiqi ka woh zamaana yaad hai",
    meaning_en: "I still remember crying quietly day and night. I still remember those days of being in love.",
    tags: ["memory", "longing"],
  },
  {
    id: "ishq-ki-intiha",
    lang: "ur",
    original: "تیرے عشق کی انتہا چاہتا ہوں\nمری سادگی دیکھ کیا چاہتا ہوں",
    roman: "Tere ishq ki intiha chahta hoon\nMeri saadgi dekh kya chahta hoon",
    meaning_en: "I want the very highest level of your love. Look how simple I am, and look what I am asking for.",
    tags: ["devotion"],
  },
  {
    id: "is-mizaaj-ka",
    lang: "ur",
    original: "دل دے تو اس مزاج کا پروردگار دے\nجو رنج کی گھڑی بھی خوشی سے گزار دے",
    roman: "Dil de to is mizaaj ka parwardigaar de\nJo ranj ki ghari bhi khushi se guzaar de",
    meaning_en: "God, if you give me a heart, give me one that can pass even sad moments happily.",
    tags: ["partner"],
  },
  {
    id: "dil-e-naadaan",
    lang: "ur",
    original: "دلِ ناداں تجھے ہوا کیا ہے\nآخر اس درد کی دوا کیا ہے",
    roman: "Dil-e-naadaan tujhe hua kya hai\nAakhir is dard ki dawa kya hai",
    meaning_en: "My foolish heart, what has happened to you? What is the cure for this pain?",
    tags: ["longing"],
  },
]

export default classics
