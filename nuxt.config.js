import axios from 'axios';

export default {
  mode: 'universal',
  target: 'static',
  /*
   ** Headers of the page
   */
  head: {
    htmlAttrs: {
      prefix: 'og: http://ogp.me/ns#',
      lang: 'ja',
    },
    titleTemplete: '%s | microCMSブログ',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content:
          'microCMSはAPIベースの日本製ヘッドレスCMSです。本ブログはmicroCMSの開発メンバーがmicroCMSの使い方や技術的な内容を発信するブログです。',
      },
      {
        hid: 'og:site_name',
        property: 'og:site_name',
        content: 'microCMSブログ',
      },
      { hid: 'og:type', property: 'og:type', content: 'website' },
      {
        hid: 'og:url',
        property: 'og:url',
        content: 'https://microcms.io/blog/',
      },
      { hid: 'og:title', property: 'og:title', content: 'microCMSブログ' },
      {
        hid: 'og:description',
        property: 'og:description',
        content:
          'microCMSはAPIベースの日本製ヘッドレスCMSです。本ブログはmicroCMSの開発メンバーがmicroCMSの使い方や技術的な内容を発信するブログです。',
      },
      {
        hid: 'og:image',
        property: 'og:image',
        content: 'https://microcms.io/blog/images/ogp.png',
      },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@micro_cms' },
    ],
    link: [
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: 'https://microcms.io/images/favicon.png',
      },
      {
        rel: 'alternate',
        type: 'application/atom+xml',
        href: 'https://microcms.io/blog/feed.xml',
        title: 'Atom',
      },
    ],
  },
  /*
   ** Customize the progress-bar color
   */
  loading: { color: '#331cbf' },
  /*
   ** Global CSS
   */
  css: [
    '@/assets/styles/reset.css',
    '@/assets/styles/colors.css',
    {
      src: '~/node_modules/highlight.js/styles/hybrid.css',
      lang: 'css',
    },
  ],
  /*
   ** Plugins to load before mounting the App
   */
  plugins: ['~/plugins/vue-scrollto'],
  components: true,
  buildModules: ['@nuxtjs/eslint-module', '@nuxtjs/pwa'],
  /*
   ** Nuxt.js modules
   */
  modules: [
    ['@nuxtjs/moment', ['ja']],
    [
      '@nuxtjs/google-analytics',
      {
        id: 'UA-109902480-8',
      },
    ],
    ['@nuxtjs/sitemap'],
    '@nuxtjs/feed',
  ],
  pwa: {
    workbox: {
      runtimeCaching: [
        {
          urlPattern: 'https://images.microcms-assets.io/.*',
          handler: 'cacheFirst',
        },
        {
          urlPattern: '/blog/.*/index.html',
          handler: 'cacheFirst',
        }
      ]
    }
  },
  /*
   ** Build configuration
   */
  build: {
    postcss: {
      plugins: {
        'postcss-custom-properties': {
          preserve: false,
          importFrom: ['assets/styles/colors.css'],
        },
        'postcss-nested': {},
      },
    },
    extend(config, ctx) {
      // Run ESLint on save
      if (ctx.isDev && ctx.isClient) {
        config.module.rules.push({
          enforce: 'pre',
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          exclude: /(node_modules)/,
        });
      }
    },
  },
  router: {
    base: '/blog',
    extendRoutes(routes, resolve) {
      routes.push({
        path: '/page/:id',
        component: resolve(__dirname, 'pages/index.vue'),
        name: 'pages',
      });
      routes.push({
        path: '/category/:categoryId/page/:id',
        component: resolve(__dirname, 'pages/index.vue'),
        name: 'categories',
      });
      routes.push({
        path: '*',
        component: resolve(__dirname, 'pages/404.vue'),
        name: 'custom',
      });
    },
  },
  generate: {
    async routes() {
      const range = (start, end) =>
        [...Array(end - start + 1)].map((_, i) => start + i);
      const pages = await axios
        .get(`https://microcms.microcms.io/api/v1/blog?limit=100&depth=2`, {
          headers: { 'X-API-KEY': '1c801446-5d12-4076-aba6-da78999af9a8' },
        })
        .then((res) => {
          const articles = res.data.contents.map((content) => ({
            route: `/${content.id}`,
            payload: content,
          }));
          return [
            ...articles,
            ...range(1, Math.ceil(res.data.contents.length / 10)).map((p) => ({
              route: `/page/${p}`,
            })),
          ];
        });
      const categories = await axios
        .get(
          `https://microcms.microcms.io/api/v1/categories?limit=100&fields=id`,
          {
            headers: { 'X-API-KEY': '1c801446-5d12-4076-aba6-da78999af9a8' },
          }
        )
        .then(({ data }) => {
          return data.contents.map((content) => content.id);
        });
      const categoryPages = await Promise.all(
        categories.map((category) =>
          axios
            .get(
              `https://microcms.microcms.io/api/v1/blog?limit=100&filters=category[equals]${category}`,
              {
                headers: {
                  'X-API-KEY': '1c801446-5d12-4076-aba6-da78999af9a8',
                },
              }
            )
            .then((res) => {
              return range(1, Math.ceil(res.data.contents.length / 10)).map(
                (p) => ({
                  route: `/category/${category}/page/${p}`,
                })
              );
            })
        )
      );
      const flattenCategoryPages = [].concat.apply([], categoryPages);
      return [...pages, ...flattenCategoryPages];
    },
    dir: 'dist/blog',
  },
  sitemap: {
    path: '/sitemap.xml',
    hostname: 'https://microcms.io/blog',
    exclude: ['/draft'],
    routes(callback) {
      axios
        .get(`https://microcms.microcms.io/api/v1/blog?limit=100`, {
          headers: { 'X-API-KEY': '1c801446-5d12-4076-aba6-da78999af9a8' },
        })
        .then((res) =>
          callback(
            null,
            res.data.contents.map((content) => `${content.id}/`)
          )
        );
    },
  },
  feed: [
    {
      path: '/feed.xml',
      async create(feed) {
        feed.options = {
          title: 'microCMSブログ',
          link: 'https://microcms.io/blog/feed.xml',
          description:
            'microCMSはAPIベースの日本製ヘッドレスCMSです。本ブログはmicroCMSの開発メンバーがmicroCMSの使い方や技術的な内容を発信するブログです。',
        };

        const posts = await axios
          .get(`https://microcms.microcms.io/api/v1/blog?limit=100`, {
            headers: { 'X-API-KEY': '1c801446-5d12-4076-aba6-da78999af9a8' },
          })
          .then((res) => res.data.contents);

        posts.forEach((post) => {
          feed.addItem({
            title: post.title,
            id: post.id,
            link: `https://microcms.io/blog/${post.id}`,
            description: post.description,
            content: post.description,
            date: new Date(post.publishedAt || post.createdAt),
            image: post.ogimage.url,
          });
        });
      },
      cacheTime: 1000 * 60 * 15,
      type: 'atom1',
    },
  ],
};
