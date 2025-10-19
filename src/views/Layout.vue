<template>
  <div>
    <Head></Head>
    <section class="section">
      <div class="container">
        <feb-alive>
          <router-view></router-view>
        </feb-alive>
      </div>
    </section>
    <APlayer />
  </div>
</template>

<script>
import Head from "./common/Head";
import APlayer from "./common/APlayer";
export default {
  data: function () {
    return {};
  },
  components: {
    Head,
    APlayer
  },
  methods: {},
};
</script>
