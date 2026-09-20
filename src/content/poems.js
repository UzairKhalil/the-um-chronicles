// ---------------------------------------------------------------------------
// poems.js — the poetry page.
// ---------------------------------------------------------------------------
// FORMAT — copy one of the three below and edit it. Every field:
//
//   id          unique, lowercase, no spaces. Used for comments and reactions,
//               so DO NOT change an id once people have commented on the poem.
//   lang        'en'   English only
//               'ur'   Urdu only
//               'both' both versions, with a quiet toggle between them
//   title       a string, or { en: '…', ur: '…' } when lang is 'both'
//   body        an array of lines, or { en: [...], ur: [...] } when 'both'.
//               An empty string '' is a stanza break. One array entry = one
//               printed line; the poem is NOT re-wrapped for you.
//   date        optional. Any string: '2024', 'March 2024', 'Lahore, 2019'.
//   dedication  optional. Printed small and italic under the title.
//
// Urdu is rendered with dir="rtl" lang="ur" on the poem element only, in Noto
// Nastaliq Urdu, at a larger size and looser line-height than the English.
// Never add letter-spacing to Urdu — it breaks the letter joining.
// ---------------------------------------------------------------------------

export const poems = [
  {
    id: 'inventory',
    lang: 'en',
    title: 'Inventory',
    date: '',
    dedication: 'For Maryam',
    body: [
      'Things I own: a chair, some books,',
      'a habit of checking the weather',
      'in a city I do not live in.',
      '',
      'Things I keep: the way you say my name',
      'when you are almost asleep —',
      'two syllables, softened at the edges,',
      'as if even my name gets to rest with you.',
      '',
      'Things I would give back: all of it,',
      'the chair, the books, the weather,',
      'for one more ordinary Tuesday',
      'in which nothing happens',
      'and you are in the next room.',
    ],
  },

  {
    id: 'chiragh',
    lang: 'ur',
    title: 'چراغ',
    date: '',
    dedication: 'مریم کے نام',
    body: [
      'شب بھر جلا ہے دل کا چراغ',
      'تمہارے نام کی لَو کے ساتھ',
      '',
      'میں نے دعا نہیں مانگی',
      'میں نے صرف تمہارا نام لیا',
      'اور آسمان نے سمجھ لیا',
      '',
      'جو لوگ محبت کو شور سمجھتے ہیں',
      'انہیں خاموشی کا یہ سلیقہ کون سکھائے',
    ],
  },

  {
    id: 'second-cup',
    lang: 'both',
    title: { en: 'The Second Cup', ur: 'دوسری پیالی' },
    date: '',
    dedication: 'For Maryam',
    body: {
      en: [
        'I make two cups now without thinking,',
        'and on the mornings you are not here',
        'the second one goes cold beside me',
        'like a small, patient argument',
        'for your return.',
        '',
        'I have learned the shape of your absence',
        'the way a room learns a door.',
        'Nothing is broken. Everything',
        'is simply waiting to be opened.',
      ],
      ur: [
        'اب میں دو پیالیاں بناتا ہوں',
        'بغیر سوچے',
        '',
        'جس صبح تم نہیں ہوتیں',
        'دوسری پیالی میرے پاس بیٹھے بیٹھے',
        'ٹھنڈی ہو جاتی ہے',
        'جیسے کوئی نرم سی ضد',
        '',
        'میں نے تمہاری غیر موجودگی کی شکل سیکھ لی ہے',
        'جیسے کمرہ دروازے کو سیکھ لیتا ہے',
        '',
        'کچھ ٹوٹا نہیں ہے',
        'بس سب کچھ کھلنے کا منتظر ہے',
      ],
    },
  },
]

export default poems
