<template>
    <input
        type="text"
        inputmode="decimal"
        v-model="editValue"
        @beforeinput="filter_input"
        @keydown.enter="commit"
        @blur="cancel"
        class="value-modifier"
        :style="{ width: width + 'px' }"
    />
</template>

<script>
export default {
    name: "ValueModifier",

    props: {
        target: {
            type: Object,
            required: true
        },

        target_key: {
            type: String,
            required: true
        },

        min: {
            type: Number,
            default: -Infinity
        },

        max: {
            type: Number,
            default: Infinity
        },

        width: {
            type: Number,
            default: 25
        }
    },

    data() {
        return {
            editValue: String(this.target[this.target_key])
        };
    },

    watch: {
        // refresh editValue when our props change identity
        // (e.g. InspectPanel switching to a different brush's plane)
        target() {
            this.editValue = String(this.target[this.target_key]);
        },
        target_key() {
            this.editValue = String(this.target[this.target_key]);
        }
    },

    emits: ['on_change'],

    methods: {
        // reject keystrokes / pastes that would make the field non-numeric.
        // we allow "in-progress" forms like "", "-", ".", "-.", "1.", etc.
        // so the user can type fluently; commit() does the final validation.
        filter_input(e) {
            // deletes / cuts / format changes have null data — let them through
            if (e.data == null) return;
            const input = e.target;
            const start = input.selectionStart ?? input.value.length;
            const end   = input.selectionEnd   ?? input.value.length;
            const next = input.value.slice(0, start) + e.data + input.value.slice(end);
            if (!/^-?\d*\.?\d*$/.test(next)) {
                e.preventDefault();
            }
        },

        commit() {
            let value = Number(this.editValue);

            if (Number.isNaN(value)) {
                this.editValue = String(this.target[this.target_key]);
                return;
            }

            value = Math.max(this.min, Math.min(this.max, value));

            this.target[this.target_key] = value;
            this.editValue = String(value);
            this.$emit('on_change')
        },

        cancel() {
            this.editValue = String(this.target[this.target_key]);
        }
    }
};
</script>

<style scoped>
.value-modifier {
    background-color: black;
    color: white;
    border: 1px solid #444;
    font-family: inherit;
    font-size: 11px;
    padding: 1px 3px;
    box-sizing: content-box;
}
.value-modifier:focus {
    outline: none;
    border-color: white;
}
</style>