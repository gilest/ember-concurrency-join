# ember-concurrency-join

Adds a `join` modifier for use with [ember-concurrency](https://github.com/machty/ember-concurrency) tasks.

The `join` modifier allows many `perform()` calls to be made on a task while performing said task only once. The resulting value will be returned to all task instances.


## Why

Scenario: an expensive HTTP request is depended upon by many callers.

Callers want the result of the request as soon as possible. Cancelling in-flight requests or making more than one request in parallel is not desired.

Applying the built-in modifiers to this scenario:
- `restartable`, `drop` and `keepLatest` cancel tasks - cancelled task instances return early with no value
- `enqueue` does not cancel tasks but each will run in sequence resulting in a series of requests

Using `join`, however, the request will be started at the first `perform()` call. All subsequent callers "join" in, and when the operation is complete all task instances resolve immediately with the resulting value.


## Compatibility

* Ember.js v3.24 or above
* Ember CLI v3.24 or above
* Node.js v12 or above


## Installation

```
ember install ember-concurrency-join
```


## Usage


### join modifier

Apply the `join` modifier to any task (not compatilbe with the `maxConcurrency` modifier).

```js
class ExampleClass {
  @task({ join: true })
  *task() {
    return yield doWork();
  }
}
```

The first call to `task.perform()` will call `doWork()` and eventually return the result.

Subsequent calls will wait for the initial task instance to finish and resolve with its return value.

Any calls afterwards will resolve immediately with the same return value.


### performAgain

Calling `task.performAgain()` will wait for running tasks to complete before performing the task again, effectively busting the cache.

The cache may also be busted manually by calling `task.cancelAll({ resetState: true })`. Note that this *will cancel* running tasks wheras `performAgain` will wait for them, instead.


## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.


## License

This project is licensed under the [MIT License](LICENSE.md).
