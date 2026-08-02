<script setup lang="ts">
import {Bokeh} from "@bokeh/vue"

import {plot} from "./plot"
</script>

<template>
  <Bokeh :model="plot" />
</template>
