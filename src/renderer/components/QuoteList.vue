<template>
  <v-container>
    <v-card class="pa-4">
      <v-card-title>
        Mentett ajánlatok
        <v-spacer/>
        <v-btn color="primary" @click="createQuote">
          <v-icon left>mdi-file-plus</v-icon>
          Új ajánlat
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Keresés név szerint"
            clearable
            outlined
            dense
        />
        <v-data-table
            :headers="headers"
            :items="rows"
            :items-per-page="20"
            sort-by="updatedAt"
            sort-desc
            no-data-text="Még nincs mentett ajánlat."
            no-results-text="Nincs találat."
            @click:row="openQuote"
            class="clickable-rows"
        >
          <template v-slot:item.name="{ item }">
            <strong v-if="item.id === currentId">{{ item.name }}</strong>
            <span v-else>{{ item.name }}</span>
          </template>
          <template v-slot:item.updatedAt="{ item }">
            {{ formatDateTime(item.updatedAt) }}
          </template>
          <template v-slot:item.total="{ item }">
            {{ formatPrice(item.total) }}
          </template>
          <template v-slot:item.actions="{ item }">
            <v-btn icon small title="Megnyitás" @click.stop="openQuote(item)">
              <v-icon small>mdi-folder-open</v-icon>
            </v-btn>
            <v-btn icon small title="Másolat készítése" @click.stop="duplicateQuote(item)">
              <v-icon small>mdi-content-copy</v-icon>
            </v-btn>
            <v-btn icon small title="Törlés" @click.stop="removeQuote(item)">
              <v-icon small>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
import {mapActions, mapState} from "pinia";
import {useQuotesStore} from "../stores/quotesStore";
import {formatDateTime, formatPrice, normalizeText, quoteTotals} from "../quoteUtils";

export default {
  name: "QuoteList",
  data() {
    return {
      search: '',
      headers: [
        {text: 'Név', value: 'name'},
        {text: 'Tételek', value: 'itemCount', align: 'end'},
        {text: 'Végösszeg', value: 'total', align: 'end'},
        {text: 'Módosítva', value: 'updatedAt'},
        {text: '', value: 'actions', sortable: false, align: 'end'},
      ],
    };
  },
  computed: {
    ...mapState(useQuotesStore, ['quotes', 'currentId']),
    rows() {
      const query = normalizeText(this.search);
      return this.quotes
          .map(q => ({
            id: q.id,
            name: q.name || 'Névtelen ajánlat',
            updatedAt: q.updatedAt,
            itemCount: q.groups.reduce((n, g) => n + g.items.length, 0),
            total: quoteTotals(q).total,
          }))
          .filter(row => !query || normalizeText(row.name).includes(query));
    },
  },
  methods: {
    ...mapActions(useQuotesStore, ['open', 'duplicate', 'remove', 'newQuote']),
    formatDateTime,
    formatPrice,
    openQuote(row) {
      this.open(row.id);
      this.$router.push('/offer');
    },
    duplicateQuote(row) {
      this.duplicate(row.id);
      this.$router.push('/offer');
    },
    removeQuote(row) {
      if (confirm(`Biztosan törlöd a(z) „${row.name}” ajánlatot?`)) {
        this.remove(row.id);
      }
    },
    createQuote() {
      this.newQuote();
      this.$router.push('/offer');
    },
  },
};
</script>

<style scoped>
.clickable-rows >>> tbody tr {
  cursor: pointer;
}
</style>
