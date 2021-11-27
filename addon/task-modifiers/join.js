import { waitForProperty } from 'ember-concurrency';

const join = (taskFactory, enabled) => {
  if (enabled) {
    let taskDefinition = taskFactory.taskDefinition;

    // Configure task to be queued
    const enqueueModifier = taskFactory.getModifier('enqueue');
    enqueueModifier(taskFactory, true);

    // With a maxConcurrency of 1
    taskFactory.setMaxConcurrency(1);

    let joinDefintion = function* (...args) {
      const task = this[taskFactory.name];

      if (task.modifierOptions.maxConcurrency) {
        throw new Error(
          `Cannot use 'maxConcurrency' with the 'join' task modifier`
        );
      }

      task.performAgain = async function () {
        // Allow running task to finish without cancellation
        await waitForProperty(task, 'isIdle');
        await task.cancelAll({ resetState: true }); // Reset lastSuccessful thus busting cache
        return task.perform(...arguments);
      };

      if (task.lastSuccessful) return task.lastSuccessful.value;

      return yield* taskDefinition(...args);
    };

    taskFactory.setTaskDefinition(joinDefintion);
  }
};

export default join;
