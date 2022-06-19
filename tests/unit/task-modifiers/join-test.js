import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { task, timeout } from 'ember-concurrency';
import { registerJoinModifier } from 'ember-concurrency-join';

module('Unit | Task Modifier | join', function (hooks) {
  setupTest(hooks);
  registerJoinModifier();

  class TestClass {
    @task({ join: true })
    *generate() {
      yield timeout(50);
      return Math.floor(Math.random() * 100_000);
    }
  }

  test('queues all but one run and joins result', async function (assert) {
    assert.expect(5);
    const instance = new TestClass();

    const firstRun = instance.generate.perform();
    const secondRun = instance.generate.perform();

    assert.strictEqual(instance.generate.numRunning, 1, 'runs 1');
    assert.strictEqual(instance.generate.numQueued, 1, 'queues 1');

    const firstResult = await firstRun;
    const secondResult = await secondRun;

    assert.strictEqual(firstResult, secondResult, 'both results are the same');

    const thirdRun = instance.generate.perform();

    assert.strictEqual(instance.generate.numRunning, 1, 'runs 1');

    const thirdResult = await thirdRun;

    assert.strictEqual(
      secondResult,
      thirdResult,
      'final result is also the same'
    );
  });

  test('re-runs after cancelAll is called with resetState', async function (assert) {
    assert.expect(1);
    const instance = new TestClass();

    const firstRun = instance.generate.perform();
    const firstResult = await firstRun;

    await instance.generate.cancelAll({ resetState: true });

    const secondRun = instance.generate.perform();
    const secondResult = await secondRun;

    assert.notDeepEqual(
      firstResult,
      secondResult,
      'cache is busted by cancelAll'
    );
  });

  test('re-runs when performAgain is called', async function (assert) {
    assert.expect(1);
    const instance = new TestClass();

    const firstRun = instance.generate.perform();
    const firstResult = await firstRun;

    const secondRun = instance.generate.performAgain();
    const secondResult = await secondRun;

    assert.notDeepEqual(
      firstResult,
      secondResult,
      'cache is busted by performAgain'
    );
  });

  test('does not cancel in progress tasks when performAgain is called', async function (assert) {
    assert.expect(1);
    const instance = new TestClass();

    const firstRun = instance.generate.perform();
    const secondRun = instance.generate.performAgain();
    const firstResult = await firstRun;
    const secondResult = await secondRun;

    assert.notDeepEqual(
      firstResult,
      secondResult,
      'cache is busted by performAgain'
    );
  });

  // Buffer policies
  // drop - cannot set multiple buffer policies
  // keepLatest - cannot set multiple buffer policies
  // enqueue - used by join
  // maxConcurrency - specifically throws an error

  test('errors with maxConcurrency set', function (assert) {
    assert.expect(1);

    class TestClass {
      @task({ join: true, maxConcurrency: 2 })
      *generate() {}
    }

    const instance = new TestClass();
    instance.generate.perform().catch((e) => {
      assert.ok(
        e.message.includes(`Cannot use 'maxConcurrency'`),
        'warns about combining maxConcurrency with joinabel'
      );
    });
  });
});
