export default function getDefaultOgimage(content) {
  const encodedTitle = encodeURI(content.title);
  const length = content.title.length;
  const textSize = length > 30 ? 42 : length > 22 ? 52 : 60; // 正確な文字数ではないが大体の指標としては十分と判断する
  return `https://images.blog.microcms.io/assets/f5d83e38f9374219900ef1b0cc4d85cd/92c09085ec6243cca78046fa644dd8cd/banner-bg.png?blend-mode=normal&blend-x=88&blend-align=middle&blend64=${Buffer.from(
    `https://assets.imgix.net/~text?txtsize=${textSize}&w=672&txtfont=Hiragino%20Sans%20W8&txt-color=212149&txt=${encodedTitle}`,
    'ascii'
  ).toString('base64')}`;
}