* 手写ajax



```javascript
function createXHR() {
    if (window.XMLHttpRequest) {
        return new XMLHttpRequest();
    } else {
        return new ActiveXObject();
    }
}

function objectToString(obj) {
    const res = [];
    for (const [key, value] of Object.entries(obj)) {
        res.push(encodeURIComponent(key) + '=' + encodeURIComponent(value));
    }
    return res.join('&');
}

function ajax({ type = 'get', url, data = {}, dataType = 'json' }) {
    const xhr = createXHR();
    const stringData = objectToString(data);
    return new Promise((reolve, reject) => {
        if (type === 'get') {
            xhr.open(type, url + '?' + stringData);
            xhr.send();
        } else {
            xhr.open(type, url);
            xhr.setReqeustHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(stringData);
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304) {
                    const resp = dataType === 'json' ? JSON.parse(xhr.responseText) : xhr.responseText;
                    resolve(resp);
                } else {
                    reject(xhr.status);
                }
            }
        } 
    });
}
```



* 对象深拷贝



```javascript
function deepClone(obj, hash = new WeakMap()) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    if (hash.has(obj)) {
        return hash.get(obj);
    }
    if (obj instanceof Date) {
        return new Date(obj);
    }
    if (obj instanceof RegExp) {
        return new RegExp(obj);
    }
    const newObj = {};
    hash.set(obj, newObj);
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value !== 'object' || value === null) {
            newObj[key] = value;
        } else if (Array.isArray(value)) {
            newObj[key] = [];
            for (const item of value) {
                newObj[key].push(deepClone(item, hash));
            }
        } else if (value instanceof Set) {
            newObj[key] = new Set();
            for (const item of value) {
                newObj[key].add(deepClone(item, hash));
            }
        } else if (value instanceof Map) {
            newObj[key] = new Map();
            for (const [k, v] of value) {
                newObj[key].set(k, deepClone(v, hash));
            }
        } else {
            newObj[key] = deepClone(value, hash);
        }
    }
    return newObj;
}
```



```javascript
const data = {
  age: 18,
  name: 'Leo',
  education: ['小学', '初中', '高中', '大学', undefined, null],
  likesFood: new Set(['fish', 'banana']),
  friends: [
    { name: 'Marry', sex: 'woman' },
    { name: 'Tina', sex: 'woman' },
    { name: 'Jerry', sex: 'man' }],
  work: {
    time: '2019',
    project: { name: 'test', obtain: ['css', 'html', 'js'] }
  },
  play: function () {
    console.log('玩滑板');
  }
};

deepClone(data);

const data2 = {
  name: 'foo',
  child: null,
};
data2.child = data2;

deepClone(data2);
```



* 手写Promise [A](https://juejin.cn/post/6850037281206566919)



```javascript
const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

const resolvePromise = (promise2, x, resolve, reject) => {
    if (promise2 === x) {
        return reject(new TypeError('Chaining cycle dected for promise #<Promise>'));
    }
    
    let called = false;
    if ((typeof x === 'object' && x != null) || typeof x === 'function') {
        try {
            const then = x.then;
            if (typeof then === 'function') {
                then.call(x, y => {
                    if (called) {
                        return;
                    }
                    called = true;
                    resolvePromise(promise2, y, resolve, reject);
                }, e => {
                    if (called) {
                        return;
                    }
                    called = true;
                    reject(e);
                });
            } else {
                resolve(x);
            }
        } catch (e) {
            if (called) {
                return;
            }
            called = true;
            reject(e);
        }
    } else {
        resolve(x);
    }
};

class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.onResolvedCallbacks = [];
        this.onRejectedCallbacks = [];
        
        const resolve = (value) => {
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                this.onResolvedCallbacks.forEach(fn => fn());
            }
        };
        
        const reject = (reason) => {
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn => fn());
            }
        };
        
        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }
    
    then(onFulfilled, onRejected) {
        onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v;
        onRejected = typeof onRejected === 'function' ? onRejected : e => { throw e; };
        
        const promise2 = new Promise((resolve, reject) => {
            if (this.status === FULFILLED) {
                setTimeout(() => {
                    try {
                        const x = onFulfilled(this.value);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            }
            
            if (this.status === REJECTED) {
                setTimeout(() => {
                    try {
                        const x = onRejected(this.reason);
                        resolvePromise(promise2, x, resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }, 0);
            }
            
            if (this.status === PENDING) {
                this.onResolvedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            const x = onFulfilled(this.value);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0);
                });
                
                this.onRejectedCallbacks.push(() => {
                    setTimeout(() => {
                        try {
                            const x = onRejected(this.reason);
                            resolvePromise(promise2, x, resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    }, 0);
                });
            }
        });
        
        return promise2;
    }
    
    static resolve(value) {
        if (value instanceof Promise) {
            return value;
        }
        return new Promise((resolve, reject) => {
            resolve(value);
        });
    }
    
    static reject(reason) {
        return new Promise((resolve, reject) => {
            reject(reason);
        });
    }
    
    static all(values) {
        if (!Array.isArray(values)) {
            const type = typeof values;
            return new TypeError(`TypeError: ${type} ${values} is not iterable`);
        }
        
        return new Promise((resolve, reject) => {
            const resultArr = [];
            let idx = 0;
            
            const processResultByKey = (value, index) => {
                resultArr[index] = value;
                if (++idx === values.length) {
                    resolve(resultArr);
                }
            };
            
            for (let i = 0; i < values.length; i++) {
                const value = values[i];
                if (value && typeof value.then === 'function') {
                    value.then((val) => {
                        processResultByKey(val, i);
                    }, reject);
                } else {
                    processResultByKey(value, i);
                }
            }
        });
    }
    
    static race(promises) {
        return new Promise((resolve, reject) => {
            for (let i = 0; i < promises.length; i++) {
                const p = promises[i];
                if (p && typeof p.then === 'function') {
                    p.then(resolve, reject);
                } else {
                    resolve(p);
                }
            }
        });
    }
    
    catch(fn) {
        return this.then(null, fn);
    }
    
    finally(fn) {
        return this.then((value) => {
            return Promise.resolve(fn()).then(() => value);
        }, (e) => {
            return Promise.resolve(fn()).then(() => { throw e });
        });
    }
}
```



```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Promise.prototype.resolve');
  }, 1000);
}).then((data) => {
      console.log('success:', data);
    }, (e) => {
      console.log('failed:', e);
    });

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('Promise.prototype.reject');
  }, 1000);
}).then((data) => {
      console.log('success:', data);
    }, (err) => {
      console.log('failed:', err);
    });

Promise.resolve(new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('Promise.resolve');
    }, 3000);
})).then((data) => {
    console.log('success:', data);
}).catch((e) => {
    console.log('error:', e);
});

Promise.resolve('Promise.finally first Promise').finally(() => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve('Promise.finally second Promise');
        }, 1000);
    });
}).then((data) => {
    console.log('success:', data);
}).catch((e) => {
    console.log('error:', e);
});

const p3 = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve('Promise.all resolve');
    }, 1000);
});

const p4 = new Promise((resolve, reject) => {
    setTimeout(() => {
        reject('Promise.all reject');
    }, 1000);
});

Promise.all([1, 2, p3]).then((data) => {
    console.log('resolve:', data);
}, (e) => {
    console.log('reject:', e);
});

Promise.all([1, 2, p3, p4]).then((data) => {
    console.log('resolve:', data);
}, (e) => {
    console.log('reject:', e);
});
```



```javascript
const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

class Promise {
    constructor(executor) {
        this.status = PENDING;
        this.value = undefined;
        this.reason = undefined;
        this.onResolvedCallbacks = [];
        this.onRejectedCallbacks = [];
        
        const resolve = (value) => {
            if (this.status === PENDING) {
                this.status = FULFILLED;
                this.value = value;
                this.onResolvedCallbacks.forEach(fn => fn());
            }
        };
        
        const reject = (reason) => {
            if (this.status === PENDING) {
                this.status = REJECTED;
                this.reason = reason;
                this.onRejectedCallbacks.forEach(fn => fn());
            }
        };
        
        try {
            executor(resolve, reject);
        } catch (e) {
            reject(e);
        }
    }
    
    then(onFulfilled, onRejected) {
        if (this.status === FULFILLED) {
            onFulfilled(this.value);
        }
        
        if (this.status === REJECTED) {
            onRejected(this.reason);
        }
        
        if (this.status === PENDING) {
            this.onResolvedCallbacks.push(() => {
                onFulfilled(this.value);
            });
            this.onRejectedCallbacks.push(() => {
                onRejected(this.reason);
            });
        }
    }
}
```



```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve('Promise.prototype.resolve');
  }, 1000);
}).then((data) => {
      console.log('success:', data);
    }, (e) => {
      console.log('failed:', e);
    });

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('Promise.prototype.reject');
  }, 1000);
}).then((data) => {
      console.log('success:', data);
    }, (err) => {
      console.log('failed:', err);
    });
```



* 多维数组扁平化



```javascript
const arr = [0, 1, [2, [3, [4, 5]]]];

console.log([...arr].flat(Infinity)); // [0, 1, 2, 3, 4, 5]
```



```javascript
const arr = [0, 1, [2, [3, [4, 5]]]];

function flat(arr) {
    const ans = [];
    for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            ans.push(...flat(arr[i]));
        } else {
            ans.push(arr[i]);
        }
    }
    return ans;
}

console.log(flat([...arr])); // [0, 1, 2, 3, 4, 5]
```



```javascript
const arr = [0, 1, [2, [3, [4, 5]]]];

function flat(arr) {
    while (arr.some(item => Array.isArray(item))) {
        arr = [].concat(...arr);
    }
    return arr;
}

console.log(flat([...arr])); // [0, 1, 2, 3, 4, 5]
```



* 比较版本号 [A](https://juejin.cn/post/6844903942812336142)



```javascript
function compareVersion(v1, v2) {
    const arr1 = v1.split('.');
    const arr2 = v2.split('.');
    const n1 = arr1.length;
    const n2 = arr2.length;
    const minLength = Math.min(n1, n2);
    
    for (let i = 0; i < minLength; i++) {
        const a = parseInt(arr1[i], 10);
        const b = parseInt(arr2[i], 10);
        if (a > b) {
            return 1;
        } else if (a < b) {
            return -1;
        }
    }
    
    if (n1 > n2) {
        for (let i = n2; i < n1; i++) {
            if (parseInt(arr1[i], 10) !== 0) {
                return 1;
            }
        }
        return 0;
    } else if (n1 < n2) {
        for (let i = n1; i < n2; i++) {
            if (parseInt(arr2[i], 10) !== 0) {
                return -1;
            }
        }
        return 0;
    }
    return 0;
}

console.log(compareVersion('1.2.4', '1.1.5')); // 1
console.log(compareVersion('1.2', '1.10.5')); // -1
console.log(compareVersion('1.00.03', '1.0.03')); // 0
```



* 数字每隔三位加逗号



```javascript
function formatNumber(num) {
  return Number(num).toLocaleString()
}

console.log(formatNumber(123456789.123)) // 123,456,789.123

function formatNumber(num) {
    let ans = '';
    const nums = num.toString().split('.');
    const int = nums[0];
    const decimal = nums[1] ? '.' + nums[1] : '';
    let n = 0;
    for (let i = int.length - 1; i >= 0; i--) {
        n++;
        ans = int[i] + ans;
        if (n % 3 === 0 && i !== 0) {
            ans = ',' + ans;
        }
    }
    return ans + decimal;
}

console.log(formatNumber(123456789.123)) // 123,456,789.123
```



* 函数柯里化 [A](https://zh.javascript.info/currying-partials)



```javascript
function curry(func) {
    return function curried(...args) {
        if (args.length >= func.length) {
            return func.apply(this, args);
        } else {
            return function(...args2) {
                return curried.apply(this, args.concat(args2));
            }
        }
    }
}

function sum(a, b, c) {
  return a + b + c;
}

const curriedSum = curry(sum);

console.log(curriedSum(1, 2, 3)); // 6，仍然可以被正常调用
console.log(curriedSum(1)(2,3)); // 6，对第一个参数的柯里化
console.log(curriedSum(1)(2)(3)); // 6，全柯里化
```



* 数组去重



```javascript
const arr = [1, 2, 2, 'abc', 'abc', true, true, false, false, undefined, undefined, NaN, NaN];

function removeDuplicate(arr) {
    return Array.from(new Set(arr));
}

console.log(removeDuplicate(arr));
```



```javascript
const arr = [1, 2, 2, 'abc', 'abc', true, true, false, false, undefined, undefined, NaN, NaN];

function removeDuplicate(arr) {
    return [...new Set(arr)];
}

console.log(removeDuplicate(arr));
```



```javascript
const arr = [1, 2, 2, 'abc', 'abc', true, true, false, false, undefined, undefined, NaN, NaN];

function removeDuplicate(arr) {
    const newArr = [];
    for (const item of arr) {
        if (!newArr.includes(item)) {
            newArr.push(item);
        }
    }
    return newArr;
}

console.log(removeDuplicate(arr));
```



* 手写 bind、apply、call



```javascript
Function.prototype.call = function (context, ...args) {
  context = context || window;
  
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this;
  
  context[fnSymbol](...args);
  delete context[fnSymbol];
}

Function.prototype.apply = function (context, argsArr) {
  context = context || window;
  
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this;
  
  context[fnSymbol](...argsArr);
  delete context[fnSymbol];
}

Function.prototype.bind = function (context, ...args) {
  context = context || window;
  const fnSymbol = Symbol("fn");
  context[fnSymbol] = this;
  
  return function (...args2) {    
    context[fnSymbol](...args.concat(args2));
    delete context[fnSymbol];   
  }
}
```



* 实现一个 new



```javascript
function myNew(fn, ...args) {
  const obj = Object.create(fn.prototype);
  const ret = fn.apply(obj, args);
  return ret instanceof Object ? ret : obj;
}

function Person(name, age) {
  this.name = name
  this.age = age
  this.sayHi = function() {}
}
Person.prototype.run = function() {}

console.log(myNew(Person, 'Lance', 19));
console.log(new Person('Jerry', 20));
```



* setTimeout 模拟 setInterval



```javascript
function mySetInterval(callback, delay, n = Infinity) {
    let count = 0;
    let timer = setTimeout(function run() {
        callback();
        if (count >= n) {
            clearTimeout(timer);
            return;
        }
        count++;
        timer = setTimeout(run, delay);
    }, delay);
}

setInterval(() => {
    console.log('1');
}, 1000);

mySetInterval(() => {
    console.log('2');
}, 1000);

mySetInterval(() => {
    console.log('3');
}, 1000, 3);
```



* 写一个通用的事件处理函数



```javascript
const EventUtils = {
  addEvent: function(element, type, handler) {
    if (element.addEventListener) {
      element.addEventListener(type, handler, false);
    } else if (element.attachEvent) {
      element.attachEvent("on" + type, handler);
    } else {
      element["on" + type] = handler;
    }
  },
  removeEvent: function(element, type, handler) {
    if (element.removeEventListener) {
      element.removeEventListener(type, handler, false);
    } else if (element.detachEvent) {
      element.detachEvent("on" + type, handler);
    } else {
      element["on" + type] = null;
    }
  },
  getTarget: function(event) {
    return event.target || event.srcElement;
  },
  getEvent: function(event) {
    return event || window.event;
  },
  stopPropagation: function(event) {
    if (event.stopPropagation) {
      event.stopPropagation();
    } else {
      event.cancelBubble = true;
    }
  },
  preventDefault: function(event) {
    if (event.preventDefault) {
      event.preventDefault();
    } else {
      event.returnValue = false;
    }
  },
};
```

