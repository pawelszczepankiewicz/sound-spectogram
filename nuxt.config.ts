export default defineNuxtConfig({
  future: {
    compatibilityVersion: 4,
  },

  // Tell Nuxt to look in the app directory
  srcDir: "app",

  css: ["~/assets/scss/main.scss"],

  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/assets/scss/_variables.scss"; @import "@/assets/scss/_mixins.scss";',
        },
      },
    },
  },

  typescript: {
    strict: true,
  },

  app: {
    head: {
      title: "Sound Spectrogram Analyzer",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        {
          name: "description",
          content:
            "Upload and analyze audio files with spectrogram visualization",
        },
      ],
      link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
    },
  },

  components: {
    dirs: [
      {
        path: "~/components",
        pathPrefix: false,
      },
    ],
  },
});
