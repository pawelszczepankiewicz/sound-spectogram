<template>
  <header class="header">
    <h1>Sound Spectrogram Analyzer</h1>
    <p>Upload your audio file and visualize its frequency spectrum</p>
  </header>
</template>

<style lang="scss" scoped>
.header {
  text-align: center;
  padding: 3rem 2rem 2rem;
  animation: fadeInDown 0.8s ease-out;

  h1 {
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #fff 0%, $accent 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;

    @include mobile {
      font-size: 2.5rem;
    }
  }

  p {
    font-size: 1.2rem;
    color: $text-secondary;
  }
}
</style>
