<script lang="ts">
import { page } from '$app/stores';
import TripDetails from '../../../components/trips/TripDetails.svelte';

const tripId = parseInt($page.params.id);
</script>

<div class="container mx-auto px-4 py-8">
  <TripDetails {tripId} />
</div>