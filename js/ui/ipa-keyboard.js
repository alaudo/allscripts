// On-screen IPA keyboard rows. Covers the symbols actually used in the data
// files plus the most common extras a learner is likely to want when
// transcribing a word phonetically.

export const IPA_ROWS = [
  // close/near-close vowels
  ['i', 'ɪ', 'y', 'ʏ', 'ɨ', 'ʉ', 'ɯ', 'u', 'ʊ'],
  // mid vowels
  ['e', 'ø', 'ə', 'ɵ', 'ɤ', 'o', 'ɛ', 'œ', 'ɜ', 'ʌ', 'ɔ'],
  // open vowels + diphthong helpers
  ['æ', 'a', 'ɐ', 'ɑ', 'ɒ', 'ɚ', 'ɝ'],
  // nasals, liquids, glides
  ['m', 'n', 'ɲ', 'ŋ', 'l', 'ʎ', 'ɫ', 'r', 'ɾ', 'ɽ', 'ɹ', 'j', 'w', 'ɥ', 'h', 'ɦ'],
  // stops
  ['p', 'b', 't', 'd', 'ʈ', 'ɖ', 'c', 'ɟ', 'k', 'ɡ', 'q', 'ʔ'],
  // fricatives + affricate digraphs
  ['f', 'v', 'θ', 'ð', 's', 'z', 'ʃ', 'ʒ', 'ç', 'ʝ', 'x', 'ɣ', 'χ', 'ʁ', 'ħ', 'ʕ'],
  // affricates as digraphs + suprasegmentals
  ['t͡s', 'd͡z', 't͡ʃ', 'd͡ʒ', 'ː', 'ˈ', 'ˌ', '̃', '̥', '̩']
];
