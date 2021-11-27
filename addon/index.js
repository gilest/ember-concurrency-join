import { hasModifier, registerModifier } from 'ember-concurrency';
import join from './task-modifiers/join';

export const defineModifier = () => {
  if (hasModifier('join')) return;

  registerModifier('join', join);
};
