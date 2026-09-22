# Classics — approved text

This file is the source of truth for the text in `src/content/classics.js`,
which is generated from it and never retyped. `src/content/classics.test.js`
fails if any `original`, `roman`, `meaning_en` or `urdu_translation` in the
app differs from this file by a single character.

Every original is verbatim public-domain text. Never rewrite, shorten,
modernise or "improve" it. Never add modern song lyrics, film dialogue, or
poetry first published after 1929 — see CLAUDE.md.

**No references, for any quote or poem** — the owner's rule. No author, work,
year or film appears in the app, in this file, or anywhere else in this
public repository. The provenance record (who wrote each text, where, when,
and the editorial decisions) is kept outside the repository, in
`docs/classics-provenance.local.md`, which is git-ignored.

The `urdu_translation` blocks are **our** translations, approved by the
owner after a native reader checked them. The app always labels them "Urdu
translation" and never presents them as the original.

## Format

One `###` section per entry. The id comes from the words of the text itself,
never from its author: ids ship in the app, name each item's comments and
reactions (`classic:<id>`), and appear on the admin history page. Never
change an id once anyone has commented on it.

`- key: value` lines hold the fields; fenced blocks hold the text. Line
breaks inside a block are part of the text.

---

## English originals (18)

### beloved-is-mine
- lang: en
- tags: belonging, partner
- meaning_en: I belong to the one I love, and the one I love belongs to me.

```original
I am my beloved's, and my beloved is mine.
```

```urdu_translation
میں اپنے محبوب کی ہوں، اور میرا محبوب میرا ہے۔
```

### seal-upon-thine-heart
- lang: en
- tags: belonging, devotion
- meaning_en: Keep me close to your heart like a seal. Love is as strong as death, and no flood can wash it away.

```original
Set me as a seal upon thine heart, as a seal upon thine arm: for love is strong as death... Many waters cannot quench love, neither can the floods drown it.
```

```urdu_translation
مجھے اپنے دل پر مُہر کی طرح لگا لو، اپنے بازو پر مُہر کی طرح؛ کیونکہ محبت موت جتنی طاقتور ہے… بہت سارا پانی بھی محبت کو بجھا نہیں سکتا، نہ ہی سیلاب اسے ڈبو سکتے ہیں۔
```

### true-love-hath-my-heart
- lang: en
- tags: belonging, partner
- meaning_en: We swapped hearts fairly. I keep his heart safe, and he has mine. It was the best trade ever made.

```original
My true love hath my heart, and I have his,
By just exchange one for the other given:
I hold his dear, and mine he cannot miss;
There never was a better bargain driven.
```

```urdu_translation
میرے سچے پیار کے پاس میرا دل ہے، اور میرے پاس اُس کا،
پورے انصاف سے، ایک کے بدلے دوسرا دیا گیا:
میں اُس کا دل سنبھال کر رکھتی ہوں، اور میرا دل ہمیشہ اُس کے پاس رہتا ہے؛
اس سے اچھا سودا کبھی نہیں ہوا۔
```

### if-ever-two-were-one
- lang: en
- tags: partner, belonging
- meaning_en: If two people ever became one, it is us. No husband was loved more, and no wife was happier.

```original
If ever two were one, then surely we.
If ever man were loved by wife, then thee;
If ever wife was happy in a man,
Compare with me, ye women, if you can.
```

```urdu_translation
اگر کبھی دو لوگ ایک ہوئے ہیں، تو یقیناً ہم ہیں۔
اگر کبھی کسی بیوی نے شوہر سے محبت کی ہے، تو تم سے؛
اگر کبھی کوئی بیوی اپنے شوہر کے ساتھ خوش رہی ہے،
تو اے عورتو، ہو سکے تو میرا مقابلہ کر کے دکھاؤ۔
```

### marriage-of-true-minds
- lang: en
- tags: devotion, partner
- meaning_en: Nothing should come between two people truly joined. Real love does not change when things change.

```original
Let me not to the marriage of true minds
Admit impediments. Love is not love
Which alters when it alteration finds,
Or bends with the remover to remove:
```

```urdu_translation
میں سچے دلوں کے ملن میں
کوئی رکاوٹ نہیں مانتا۔ وہ محبت، محبت نہیں
جو حالات بدلتے ہی بدل جائے،
یا کوئی دور جائے تو خود بھی دور ہو جائے۔
```

### a-summers-day
- lang: en
- tags: admiration
- meaning_en: You are lovelier and calmer than a summer day. As long as people read this poem, you will live on.

```original
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
...
So long as men can breathe or eyes can see,
So long lives this, and this gives life to thee.
```

```urdu_translation
کیا میں تمہیں گرمیوں کے ایک دن جیسا کہوں؟
تم اُس سے کہیں زیادہ پیاری ہو، اور زیادہ نرم بھی:
…
جب تک لوگ سانس لیتے رہیں گے اور آنکھیں دیکھتی رہیں گی،
یہ نظم زندہ رہے گی، اور یہ تمہیں زندگی دیتی رہے گی۔
```

### boundless-as-the-sea
- lang: en
- tags: devotion
- meaning_en: My love is as deep as the sea. The more I give you, the more I have, because it never ends.

```original
My bounty is as boundless as the sea,
My love as deep; the more I give to thee,
The more I have, for both are infinite.
```

```urdu_translation
میری سخاوت سمندر کی طرح بے حد ہے،
میری محبت بھی اُتنی ہی گہری؛ میں تمہیں جتنا دیتی ہوں،
اُتنا ہی میرے پاس اور ہوتا ہے، کیونکہ دونوں کی کوئی حد نہیں۔
```

### never-doubt-i-love
- lang: en
- tags: devotion
- meaning_en: You can doubt anything in the world, but never doubt that I love you.

```original
Doubt thou the stars are fire;
Doubt that the sun doth move;
Doubt truth to be a liar;
But never doubt I love.
```

```urdu_translation
چاہو تو شک کرو کہ ستارے آگ ہیں؛
شک کرو کہ سورج چلتا ہے؛
شک کرو کہ سچ بھی جھوٹا ہے؛
مگر کبھی شک نہ کرنا کہ مجھے تم سے محبت ہے۔
```

### count-the-ways
- lang: en
- tags: devotion, partner
- meaning_en: How much do I love you? As deep, as wide and as high as my soul can reach.

```original
How do I love thee? Let me count the ways.
I love thee to the depth and breadth and height
My soul can reach...
```

```urdu_translation
میں تم سے کتنی محبت کرتی ہوں؟ آؤ، گن کر بتاتی ہوں۔
میں تم سے اُتنی گہری، اُتنی چوڑی اور اُتنی اونچی محبت کرتی ہوں
جہاں تک میری روح پہنچ سکتی ہے…
```

### a-red-red-rose
- lang: en
- tags: admiration
- meaning_en: My love is like a fresh red rose in June, and like a sweet song played perfectly.

```original
O my Luve is like a red, red rose
That's newly sprung in June;
O my Luve is like the melody
That's sweetly play'd in tune.
```

```urdu_translation
میری محبوبہ ایک سرخ، سرخ گلاب جیسی ہے
جو جون میں ابھی ابھی کھلا ہو؛
میری محبوبہ اُس دُھن جیسی ہے
جو میٹھے سُر میں بجائی گئی ہو۔
```

### walks-in-beauty
- lang: en
- tags: admiration
- meaning_en: She is beautiful like a clear, starry night. The best of dark and light meet in her face and eyes.

```original
She walks in beauty, like the night
Of cloudless climes and starry skies;
And all that's best of dark and bright
Meet in her aspect and her eyes.
```

```urdu_translation
وہ یوں حسن سے چلتی ہے، جیسے رات
صاف موسموں اور تاروں بھرے آسمانوں کی؛
اور اندھیرے اور اُجالے میں جو بھی سب سے اچھا ہے
وہ اُس کے چہرے اور آنکھوں میں آ ملتا ہے۔
```

### come-live-with-me
- lang: en
- tags: partner
- meaning_en: Come and share your life with me, and we will enjoy every good thing together.

```original
Come live with me and be my love,
And we will all the pleasures prove.
```

```urdu_translation
آؤ، میرے ساتھ رہو اور میری محبت بن جاؤ،
اور ہم مل کر ہر خوشی کا مزہ چکھیں گے۔
```

### cannot-exist-without-you
- lang: en
- tags: longing
- meaning_en: I cannot live without you.

```original
I cannot exist without you.
```

```urdu_translation
میں تمہارے بغیر جی نہیں سکتا۔
```

### souls-are-the-same
- lang: en
- tags: belonging
- meaning_en: Whatever our souls are made of, his and mine are made of the same thing.

```original
Whatever our souls are made of, his and mine are the same.
```

```urdu_translation
ہماری روحیں جس چیز سے بھی بنی ہوں، اُس کی روح اور میری روح ایک ہی چیز سے بنی ہیں۔
```

### a-string-under-my-ribs
- lang: en
- tags: belonging, partner
- meaning_en: When you are near me, it feels like a string ties my heart to yours, knotted so tight it cannot come loose.

```original
I sometimes have a queer feeling with regard to you—especially when you are near me, as now: it is as if I had a string somewhere under my left ribs, tightly and inextricably knotted to a similar string situated in the corresponding quarter of your little frame.
```

```urdu_translation
مجھے کبھی کبھی تمہارے بارے میں ایک عجیب سا احساس ہوتا ہے — خاص طور پر جب تم میرے پاس ہوتی ہو، جیسے ابھی: ایسا لگتا ہے جیسے میری بائیں پسلیوں کے نیچے کہیں ایک دھاگا ہے، جو تمہارے ننھے سے جسم میں ٹھیک اُسی جگہ ایک ویسے ہی دھاگے سے کس کر بندھا ہے، ایسی گرہ سے جو کبھی نہیں کھلتی۔
```

### how-ardently
- lang: en
- tags: confession
- meaning_en: I tried to fight it, but I can't. Let me tell you how deeply I admire and love you.

```original
In vain I have struggled. It will not do. My feelings will not be repressed. You must allow me to tell you how ardently I admire and love you.
```

```urdu_translation
میں نے بہت کوشش کی، مگر بے فائدہ۔ اب اور نہیں ہو سکتا۔ میرے جذبات دبائے نہیں دبتے۔ آپ مجھے اجازت دیجیے کہ میں بتاؤں کہ میں آپ کی کتنی دل سے قدر کرتا ہوں، اور آپ سے کتنی محبت کرتا ہوں۔
```

### half-agony-half-hope
- lang: en
- tags: longing, confession
- meaning_en: You touch my soul deeply. I am half in pain and half full of hope.

```original
You pierce my soul. I am half agony, half hope.
```

```urdu_translation
آپ میری روح کو چیر کر رکھ دیتی ہیں۔ میں آدھا درد ہوں، آدھی اُمید۔
```

### if-i-loved-you-less
- lang: en
- tags: confession
- meaning_en: I love you so much that I can't find the words.

```original
If I loved you less, I might be able to talk about it more.
```

```urdu_translation
اگر مجھے آپ سے کم محبت ہوتی، تو شاید میں اس کے بارے میں زیادہ بات کر پاتا۔
```


---

## Urdu originals (10)

### munh-par-raunaq
- lang: ur
- tags: longing
- meaning_en: When she looks at me, my face lights up, so she thinks this lovesick man is doing fine.

```original
ان کے دیکھے سے جو آ جاتی ہے منہ پر رونق
وہ سمجھتے ہیں کہ بیمار کا حال اچھا ہے
```

```roman
Un ke dekhe se jo aa jaati hai munh par raunaq
Woh samajhte hain ke beemaar ka haal achha hai
```

### jeene-aur-marne
- lang: ur
- tags: devotion
- meaning_en: In love, living and dying are the same. I live by looking at the very one I would die for.

```original
محبت میں نہیں ہے فرق جینے اور مرنے کا
اسی کو دیکھ کر جیتے ہیں جس کافر پہ دم نکلے
```

```roman
Mohabbat mein nahin hai farq jeene aur marne ka
Usi ko dekh kar jeete hain jis kaafir pe dam nikle
```

### nikamma-kar-diya
- lang: ur
- tags: playful
- meaning_en: Love made me useless. Before that, I was actually good for something.

```original
عشق نے غالبؔ نکما کر دیا
ورنہ ہم بھی آدمی تھے کام کے
```

```roman
Ishq ne Ghalib nikamma kar diya
Warna hum bhi aadmi the kaam ke
```

### tum-mere-paas
- lang: ur
- tags: belonging, longing
- meaning_en: When no one else is around, it feels like you are right here with me.

```original
تم مرے پاس ہوتے ہو گویا
جب کوئی دوسرا نہیں ہوتا
```

```roman
Tum mere paas hote ho goya
Jab koi doosra nahin hota
```

### naazuki-us-ke-lab
- lang: ur
- tags: admiration
- meaning_en: How can I describe how soft her lips are? Like the petal of a rose.

```original
نازکی اس کے لب کی کیا کہیے
پنکھڑی اک گلاب کی سی ہے
```

```roman
Naazuki us ke lab ki kya kahiye
Pankhuri ik gulaab ki si hai
```

### patta-patta
- lang: ur
- tags: longing
- meaning_en: Every leaf and every plant knows how I feel. The whole garden knows. Only the flower herself does not.

```original
پتا پتا بوٹا بوٹا حال ہمارا جانے ہے
جانے نہ جانے گل ہی نہ جانے باغ تو سارا جانے ہے
```

```roman
Patta patta boota boota haal hamaara jaane hai
Jaane na jaane gul hi na jaane, baagh to saara jaane hai
```

### chupke-chupke
- lang: ur
- tags: memory, longing
- meaning_en: I still remember crying quietly day and night. I still remember those days of being in love.

```original
چپکے چپکے رات دن آنسو بہانا یاد ہے
ہم کو اب تک عاشقی کا وہ زمانہ یاد ہے
```

```roman
Chupke chupke raat din aansu bahaana yaad hai
Hum ko ab tak aashiqi ka woh zamaana yaad hai
```

### ishq-ki-intiha
- lang: ur
- tags: devotion
- meaning_en: I want the very highest level of your love. Look how simple I am, and look what I am asking for.

```original
تیرے عشق کی انتہا چاہتا ہوں
مری سادگی دیکھ کیا چاہتا ہوں
```

```roman
Tere ishq ki intiha chahta hoon
Meri saadgi dekh kya chahta hoon
```

### is-mizaaj-ka
- lang: ur
- tags: partner
- meaning_en: God, if you give me a heart, give me one that can pass even sad moments happily.

```original
دل دے تو اس مزاج کا پروردگار دے
جو رنج کی گھڑی بھی خوشی سے گزار دے
```

```roman
Dil de to is mizaaj ka parwardigaar de
Jo ranj ki ghari bhi khushi se guzaar de
```

### dil-e-naadaan
- lang: ur
- tags: longing
- meaning_en: My foolish heart, what has happened to you? What is the cure for this pain?

```original
دلِ ناداں تجھے ہوا کیا ہے
آخر اس درد کی دوا کیا ہے
```

```roman
Dil-e-naadaan tujhe hua kya hai
Aakhir is dard ki dawa kya hai
```
