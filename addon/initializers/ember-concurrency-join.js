import { registerJoinModifier } from 'ember-concurrency-join';

export function initialize() {
  registerJoinModifier();
}

export default {
  initialize,
};
