<template>
    <input
        type="text"
        v-model="editValue"
        @keydown.enter="commit"
        @blur="cancel"
        style="width: 25px; background-color: black; color: white;"

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
        }
    },

    data() {
        return {
            editValue: String(this.target[this.target_key])
        };
    },

    watch: {
        'target[target_key]'() {
            this.editValue = String(this.target[this.target_key]);
        }
    },

    emits: ['on_change'],

    methods: {
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